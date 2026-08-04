package com.pawpals.backend.safety;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlockRepository extends JpaRepository<Block, String> {

  Optional<Block> findByBlocker_IdAndBlocked_Id(String blockerId, String blockedId);

  void deleteByBlocker_IdAndBlocked_Id(String blockerId, String blockedId);

  List<Block> findByBlocker_IdOrderByCreatedAtDesc(String blockerId);

  @Query("select b from Block b where b.blocker.id = :userId or b.blocked.id = :userId")
  List<Block> findAllInvolving(@Param("userId") String userId);

  @Query(
      "select b from Block b where (b.blocker.id = :userIdA and b.blocked.id = :userIdB) "
          + "or (b.blocker.id = :userIdB and b.blocked.id = :userIdA)")
  Optional<Block> findBetween(@Param("userIdA") String userIdA, @Param("userIdB") String userIdB);
}
