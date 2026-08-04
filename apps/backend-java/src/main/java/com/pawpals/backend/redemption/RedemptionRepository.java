package com.pawpals.backend.redemption;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RedemptionRepository extends JpaRepository<Redemption, String> {

  List<Redemption> findByUser_IdOrderByRedeemedAtDesc(String userId);
}
