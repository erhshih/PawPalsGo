package com.pawpals.backend.swipe;

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
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "swipes", uniqueConstraints = @UniqueConstraint(columnNames = {"swiper_id", "target_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Swipe extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "swiper_id", nullable = false)
  private User swiper;

  public String getSwiperId() {
    return swiper != null ? swiper.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "target_id", nullable = false)
  private User target;

  public String getTargetId() {
    return target != null ? target.getId() : null;
  }

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SwipeDirection direction;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
