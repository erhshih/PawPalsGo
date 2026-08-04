package com.pawpals.backend.redemption;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RedemptionRewardRepository extends JpaRepository<RedemptionReward, String> {

  List<RedemptionReward> findByActiveTrueOrderByCostJerkyAsc();

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RedemptionReward r where r.id = :id")
  Optional<RedemptionReward> lockById(@Param("id") String id);
}
