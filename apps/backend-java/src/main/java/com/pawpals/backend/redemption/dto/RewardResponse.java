package com.pawpals.backend.redemption.dto;

import com.pawpals.backend.redemption.RedemptionReward;
import java.time.Instant;

public record RewardResponse(
    String id,
    String partnerName,
    String title,
    String description,
    String imageUrl,
    int costJerky,
    Integer stock,
    boolean active,
    Instant createdAt) {

  public static RewardResponse from(RedemptionReward r) {
    return new RewardResponse(
        r.getId(),
        r.getPartnerName(),
        r.getTitle(),
        r.getDescription(),
        r.getImageUrl(),
        r.getCostJerky(),
        r.getStock(),
        r.isActive(),
        r.getCreatedAt());
  }
}
