package com.pawpals.backend.swipe;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SwipeRepository extends JpaRepository<Swipe, String> {

  Optional<Swipe> findBySwiper_IdAndTarget_Id(String swiperId, String targetId);

  @Query(
      """
      select s.target.id from Swipe s
      where s.swiper.id = :swiperId
        and (s.direction <> com.pawpals.backend.swipe.SwipeDirection.PASS
             or s.createdAt > :passExpiry)
      """)
  List<String> findActiveSwipedTargetIds(@Param("swiperId") String swiperId, @Param("passExpiry") Instant passExpiry);
}
