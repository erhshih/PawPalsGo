package com.pawpals.backend.redemption;

import com.pawpals.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 封閉迴圈兌換：肉乾只能換品牌合作的實體商品兌換碼，絕不能換回現金。 */
@Entity
@Table(name = "redemption_rewards")
@Getter
@Setter
@NoArgsConstructor
public class RedemptionReward extends BaseEntity {

  @Column(nullable = false)
  private String partnerName;

  @Column(nullable = false)
  private String title;

  private String description;

  private String imageUrl;

  @Column(nullable = false)
  private int costJerky;

  private Integer stock;

  @Column(nullable = false)
  private boolean active = true;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
