package com.pawpals.backend.meeting;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingRepository extends JpaRepository<Meeting, String> {

  Optional<Meeting> findFirstByMatch_IdAndStatusOrderByCreatedAtDesc(String matchId, MeetingStatus status);
}
