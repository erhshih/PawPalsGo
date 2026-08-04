package com.pawpals.backend.swipe;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchRepository extends JpaRepository<Match, String> {

  Optional<Match> findByUserA_IdAndUserB_Id(String userAId, String userBId);

  @Query("select m from Match m where m.userA.id = :userId or m.userB.id = :userId order by m.createdAt desc")
  List<Match> findAllForUser(@Param("userId") String userId);

  @Query("select count(m) from Match m where m.userA.id = :userId or m.userB.id = :userId")
  long countAllForUser(@Param("userId") String userId);
}
