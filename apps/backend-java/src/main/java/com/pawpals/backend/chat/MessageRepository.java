package com.pawpals.backend.chat;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, String> {

  List<Message> findByMatch_IdOrderByCreatedAtDesc(String matchId, Pageable pageable);

  @Query("select m from Message m where m.match.id = :matchId and m.createdAt < :before order by m.createdAt desc")
  List<Message> findByMatchIdBeforeOrderByCreatedAtDesc(
      @Param("matchId") String matchId, @Param("before") Instant before, Pageable pageable);

  List<Message> findTop1ByMatch_IdOrderByCreatedAtDesc(String matchId);

  long countBySender_Id(String senderId);
}
