package com.pawpals.backend.wallet;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
public class WalletTransaction extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public String getUserId() {
    return user != null ? user.getId() : null;
  }

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WalletTransactionType type;

  @Column(nullable = false)
  private int amount;

  /** 依 type 指向不同的表（貼文/狗聚/配對/兌換獎勵…），是多型參照，故意不做成 FK。 */
  private String relatedEntityId;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
