package com.pawpals.backend.redemption.dto;

import com.pawpals.backend.redemption.Redemption;
import java.time.Instant;

public record RedemptionResponse(
    String id, String rewardId, String userId, String code, Instant redeemedAt, RewardResponse reward) {

  public static RedemptionResponse from(Redemption r, RewardResponse reward) {
    return new RedemptionResponse(r.getId(), r.getRewardId(), r.getUserId(), r.getCode(), r.getRedeemedAt(), reward);
  }
}
