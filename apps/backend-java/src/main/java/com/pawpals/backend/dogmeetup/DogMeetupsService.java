package com.pawpals.backend.dogmeetup;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.dogmeetup.dto.AttendeeResponse;
import com.pawpals.backend.dogmeetup.dto.CreateMeetupRequest;
import com.pawpals.backend.dogmeetup.dto.MeetupResponse;
import com.pawpals.backend.dogmeetup.dto.PetSummary;
import com.pawpals.backend.pet.Pet;
import com.pawpals.backend.pet.PetRepository;
import com.pawpals.backend.post.dto.AuthorSummary;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DogMeetupsService {

  private final DogMeetupRepository meetupRepository;
  private final DogMeetupAttendeeRepository attendeeRepository;
  private final PetRepository petRepository;
  private final UserRepository userRepository;

  @Transactional
  public MeetupResponse create(String organizerId, CreateMeetupRequest dto) {
    if (!dto.scheduledAt().isAfter(Instant.now())) {
      throw ApiException.unprocessable("SCHEDULED_AT_MUST_BE_FUTURE");
    }

    User organizer = userRepository.getReferenceById(organizerId);
    DogMeetup meetup = new DogMeetup();
    meetup.setOrganizer(organizer);
    meetup.setTitle(dto.title());
    meetup.setDescription(dto.description());
    meetup.setLocation(dto.location());
    meetup.setLatitude(dto.latitude());
    meetup.setLongitude(dto.longitude());
    meetup.setScheduledAt(dto.scheduledAt());
    meetup.setMaxAttendees(dto.maxAttendees());
    meetup = meetupRepository.save(meetup);

    DogMeetupAttendee organizerAttendee = new DogMeetupAttendee();
    organizerAttendee.setMeetup(meetup);
    organizerAttendee.setUser(organizer);
    attendeeRepository.save(organizerAttendee);

    return toResponse(meetup, true, null);
  }

  @Transactional
  public void join(String meetupId, String userId, String petId) {
    DogMeetup meetup = meetupRepository.findById(meetupId).orElseThrow(() -> ApiException.notFound("MEETUP_NOT_FOUND"));
    if (meetup.getCancelledAt() != null) {
      throw ApiException.notFound("MEETUP_NOT_FOUND");
    }
    if (!meetup.getScheduledAt().isAfter(Instant.now())) {
      throw ApiException.unprocessable("MEETUP_ALREADY_STARTED");
    }
    if (meetup.getMaxAttendees() != null && attendeeRepository.countByMeetup_Id(meetupId) >= meetup.getMaxAttendees()) {
      throw ApiException.unprocessable("MEETUP_FULL");
    }
    Pet pet = null;
    if (petId != null) {
      pet = petRepository.findById(petId).orElse(null);
      if (pet == null || !pet.getOwnerId().equals(userId)) {
        throw ApiException.forbidden("PET_NOT_OWNED");
      }
    }

    DogMeetupAttendee attendee =
        attendeeRepository.findByMeetup_IdAndUser_Id(meetupId, userId).orElseGet(DogMeetupAttendee::new);
    attendee.setMeetup(meetup);
    attendee.setUser(userRepository.getReferenceById(userId));
    attendee.setPet(pet);
    attendeeRepository.save(attendee);
  }

  @Transactional
  public void leave(String meetupId, String userId) {
    DogMeetup meetup = meetupRepository.findById(meetupId).orElseThrow(() -> ApiException.notFound("MEETUP_NOT_FOUND"));
    if (meetup.getOrganizerId().equals(userId)) {
      throw ApiException.forbidden("ORGANIZER_MUST_CANCEL_INSTEAD");
    }
    attendeeRepository.deleteByMeetup_IdAndUser_Id(meetupId, userId);
  }

  public MeetupResponse cancel(String meetupId, String organizerId) {
    DogMeetup meetup = meetupRepository.findById(meetupId).orElseThrow(() -> ApiException.notFound("MEETUP_NOT_FOUND"));
    if (!meetup.getOrganizerId().equals(organizerId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    meetup.setCancelledAt(Instant.now());
    meetup = meetupRepository.save(meetup);
    return toResponse(meetup, true, null);
  }

  /** 只顯示附近、還沒開始、沒被取消的揪團，依時間排序（快到的優先），不是全域列表。 */
  public List<MeetupResponse> getNearby(String userId, int radiusKm, int page, int limit) {
    User me = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    if (me.getLatitude() == null || me.getLongitude() == null) {
      return List.of();
    }

    double radiusM = radiusKm * 1000.0;
    List<DogMeetup> candidates = meetupRepository.findNearbyCandidates();

    record Scored(DogMeetup meetup, double distanceM) {}

    List<Scored> withDistance =
        candidates.stream()
            .map(m -> new Scored(m, haversineM(me.getLatitude(), me.getLongitude(), m.getLatitude(), m.getLongitude())))
            .filter(s -> s.distanceM() <= radiusM)
            .toList();

    int offset = Math.max(page - 1, 0) * limit;
    return withDistance.stream()
        .skip(offset)
        .limit(limit)
        .map(s -> toResponse(s.meetup(), false, s.distanceM()))
        .toList();
  }

  public MeetupResponse getOne(String meetupId) {
    DogMeetup meetup = meetupRepository.findById(meetupId).orElseThrow(() -> ApiException.notFound("MEETUP_NOT_FOUND"));
    return toResponse(meetup, true, null);
  }

  private MeetupResponse toResponse(DogMeetup meetup, boolean includeAttendees, Double distanceM) {
    User organizerUser = userRepository.findById(meetup.getOrganizerId()).orElse(null);
    AuthorSummary organizer = organizerUser != null ? AuthorSummary.from(organizerUser) : null;
    long attendeeCount = attendeeRepository.countByMeetup_Id(meetup.getId());
    List<AttendeeResponse> attendees =
        includeAttendees
            ? attendeeRepository.findByMeetup_IdOrderByJoinedAtAsc(meetup.getId()).stream()
                .map(this::toAttendeeResponse)
                .toList()
            : null;

    return new MeetupResponse(
        meetup.getId(),
        meetup.getOrganizerId(),
        meetup.getTitle(),
        meetup.getDescription(),
        meetup.getLocation(),
        meetup.getLatitude(),
        meetup.getLongitude(),
        meetup.getScheduledAt(),
        meetup.getMaxAttendees(),
        meetup.getCancelledAt(),
        meetup.getCreatedAt(),
        organizer,
        attendeeCount,
        attendees,
        distanceM);
  }

  private AttendeeResponse toAttendeeResponse(DogMeetupAttendee attendee) {
    User user = userRepository.findById(attendee.getUserId()).orElse(null);
    Pet pet = attendee.getPetId() != null ? petRepository.findById(attendee.getPetId()).orElse(null) : null;
    return new AttendeeResponse(
        attendee.getId(),
        attendee.getMeetupId(),
        attendee.getUserId(),
        attendee.getPetId(),
        attendee.getJoinedAt(),
        user != null ? AuthorSummary.from(user) : null,
        pet != null ? PetSummary.from(pet) : null);
  }

  private double haversineM(double lat1, double lon1, double lat2, double lon2) {
    double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.pow(Math.sin(dLat / 2), 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
