package com.pawpals.backend.dogmeetup;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DogMeetupAttendeeRepository extends JpaRepository<DogMeetupAttendee, String> {

  Optional<DogMeetupAttendee> findByMeetup_IdAndUser_Id(String meetupId, String userId);

  void deleteByMeetup_IdAndUser_Id(String meetupId, String userId);

  long countByMeetup_Id(String meetupId);

  List<DogMeetupAttendee> findByMeetup_IdOrderByJoinedAtAsc(String meetupId);
}
