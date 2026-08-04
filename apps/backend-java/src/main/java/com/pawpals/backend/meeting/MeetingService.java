package com.pawpals.backend.meeting;

import com.pawpals.backend.chat.ChatSessionRegistry;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.meeting.dto.CreateMeetingRequest;
import com.pawpals.backend.meeting.dto.MeetingResponse;
import com.pawpals.backend.swipe.Match;
import com.pawpals.backend.swipe.MatchRepository;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.wallet.WalletService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MeetingService {

  private static final int ESCROW_AMOUNT = 5;

  private final MeetingRepository meetingRepository;
  private final MatchRepository matchRepository;
  private final WalletService walletService;
  private final ChatSessionRegistry chatSessionRegistry;
  private final StringRedisTemplate redisTemplate;
  private final UserRepository userRepository;

  @Transactional
  public MeetingResponse create(String userId, CreateMeetingRequest dto) {
    if (Duration.between(Instant.now(), dto.scheduledAt()).toMinutes() < 30) {
      throw ApiException.unprocessable("SCHEDULE_TOO_SOON");
    }

    Match match = matchRepository.findById(dto.matchId()).orElseThrow(() -> ApiException.notFound("MATCH_NOT_FOUND"));
    requireMember(match, userId);

    walletService.debitEscrow(userId, ESCROW_AMOUNT, dto.matchId());

    Meeting meeting = new Meeting();
    meeting.setMatch(match);
    meeting.setInitiator(userRepository.getReferenceById(userId));
    meeting.setScheduledAt(dto.scheduledAt());
    meeting.setEscrow(ESCROW_AMOUNT);
    meeting = meetingRepository.save(meeting);

    MeetingResponse response = MeetingResponse.from(meeting);
    chatSessionRegistry.emitToRoom(dto.matchId(), "meeting:updated", response);
    return response;
  }

  @Transactional
  public MeetingResponse cancel(String meetingId, String userId) {
    Meeting meeting = requireMeeting(meetingId);
    Match match = matchRepository.findById(meeting.getMatchId()).orElseThrow(() -> ApiException.notFound("MATCH_NOT_FOUND"));
    requireMember(match, userId);

    double hoursUntil = Duration.between(Instant.now(), meeting.getScheduledAt()).toMinutes() / 60.0;
    boolean isBenign = hoursUntil > 2;
    String recipientId =
        meeting.getInitiatorId().equals(userId)
            ? (match.getUserAId().equals(userId) ? match.getUserBId() : match.getUserAId())
            : meeting.getInitiatorId();

    if (isBenign) {
      walletService.refundEscrow(meetingId, meeting.getInitiatorId(), meeting.getEscrow());
    } else {
      walletService.releaseEscrow(meetingId, recipientId, meeting.getEscrow());
    }

    meeting.setStatus(isBenign ? MeetingStatus.CANCELLED_BENIGN : MeetingStatus.CANCELLED_PENALTY);
    meeting = meetingRepository.save(meeting);

    MeetingResponse response = MeetingResponse.from(meeting);
    chatSessionRegistry.emitToRoom(meeting.getMatchId(), "meeting:updated", response);
    return response;
  }

  public Map<String, Object> getQr(String meetingId, String userId) {
    Meeting meeting = requireMeeting(meetingId);
    if (meeting.getInitiatorId().equals(userId)) {
      throw ApiException.forbidden("INITIATOR_CANNOT_GET_QR");
    }
    if (Instant.now().isBefore(meeting.getScheduledAt())) {
      throw ApiException.unprocessable("NOT_YET_TIME");
    }

    String token = UUID.randomUUID().toString();
    redisTemplate.opsForValue().set(totpKey(meetingId), token, Duration.ofSeconds(30));
    return Map.of("token", token, "expiresIn", 30);
  }

  @Transactional
  public MeetingResponse verify(String meetingId, String userId, String token) {
    Meeting meeting = requireMeeting(meetingId);
    if (!meeting.getInitiatorId().equals(userId)) {
      throw ApiException.forbidden("ONLY_INITIATOR_CAN_VERIFY");
    }

    String stored = redisTemplate.opsForValue().get(totpKey(meetingId));
    if (stored == null) {
      throw ApiException.unprocessable("TOKEN_EXPIRED");
    }
    if (!constantTimeEquals(stored, token)) {
      throw ApiException.unprocessable("INVALID_TOKEN");
    }

    Match match = matchRepository.findById(meeting.getMatchId()).orElseThrow(() -> ApiException.notFound("MATCH_NOT_FOUND"));
    String recipientId = match.getUserAId().equals(userId) ? match.getUserBId() : match.getUserAId();

    walletService.releaseEscrow(meetingId, recipientId, meeting.getEscrow());
    redisTemplate.delete(totpKey(meetingId));

    meeting.setStatus(MeetingStatus.COMPLETED);
    meeting = meetingRepository.save(meeting);

    MeetingResponse response = MeetingResponse.from(meeting);
    chatSessionRegistry.emitToRoom(meeting.getMatchId(), "meeting:updated", response);
    return response;
  }

  private void requireMember(Match match, String userId) {
    if (!match.getUserAId().equals(userId) && !match.getUserBId().equals(userId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
  }

  private Meeting requireMeeting(String meetingId) {
    return meetingRepository.findById(meetingId).orElseThrow(() -> ApiException.notFound("MEETING_NOT_FOUND"));
  }

  private String totpKey(String meetingId) {
    return "meeting:" + meetingId + ":totp";
  }

  private boolean constantTimeEquals(String a, String b) {
    return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
  }
}
