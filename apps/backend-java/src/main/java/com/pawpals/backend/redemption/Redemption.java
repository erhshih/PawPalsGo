package com.pawpals.backend.redemption;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "redemptions")
@Getter
@Setter
@NoArgsConstructor
public class Redemption extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reward_id", nullable = false)
  private RedemptionReward reward;

  public String getRewardId() {
    return reward != null ? reward.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public String getUserId() {
    return user != null ? user.getId() : null;
  }

  @Column(nullable = false)
  private String code;

  @Column(nullable = false, updatable = false)
  private Instant redeemedAt = Instant.now();
}
