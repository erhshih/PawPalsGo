package com.pawpals.backend.dogmeetup;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DogMeetupRepository extends JpaRepository<DogMeetup, String> {

  @Query(
      "select m from DogMeetup m where m.cancelledAt is null and m.scheduledAt > current_timestamp "
          + "and m.latitude is not null and m.longitude is not null order by m.scheduledAt asc")
  List<DogMeetup> findNearbyCandidates();
}
