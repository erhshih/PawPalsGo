package com.pawpals.backend.dogmeetup;

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

/** 只顯示附近、還沒開始、沒被取消的揪團，見 DogMeetupsService#getNearby。 */
@Entity
@Table(name = "dog_meetups")
@Getter
@Setter
@NoArgsConstructor
public class DogMeetup extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organizer_id", nullable = false)
  private User organizer;

  public String getOrganizerId() {
    return organizer != null ? organizer.getId() : null;
  }

  @Column(nullable = false, length = 60)
  private String title;

  @Column(length = 300)
  private String description;

  @Column(nullable = false, length = 100)
  private String location;

  private Double latitude;
  private Double longitude;

  @Column(nullable = false)
  private Instant scheduledAt;

  private Integer maxAttendees;

  private Instant cancelledAt;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
