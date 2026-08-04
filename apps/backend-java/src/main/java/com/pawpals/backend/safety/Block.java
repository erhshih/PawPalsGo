package com.pawpals.backend.safety;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 封鎖：discover/swipe/chat 都要互相排除，見 SafetyService#getBlockedUserIds / #assertNotBlocked。 */
@Entity
@Table(name = "blocks", uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Block extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "blocker_id", nullable = false)
  private User blocker;

  public String getBlockerId() {
    return blocker != null ? blocker.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "blocked_id", nullable = false)
  private User blocked;

  public String getBlockedId() {
    return blocked != null ? blocked.getId() : null;
  }

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
