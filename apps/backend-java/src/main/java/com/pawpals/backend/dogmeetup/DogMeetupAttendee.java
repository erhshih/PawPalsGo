package com.pawpals.backend.dogmeetup;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.pet.Pet;
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

@Entity
@Table(name = "dog_meetup_attendees", uniqueConstraints = @UniqueConstraint(columnNames = {"meetup_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class DogMeetupAttendee extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "meetup_id", nullable = false)
  private DogMeetup meetup;

  public String getMeetupId() {
    return meetup != null ? meetup.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  public String getUserId() {
    return user != null ? user.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "pet_id")
  private Pet pet;

  public String getPetId() {
    return pet != null ? pet.getId() : null;
  }

  @Column(nullable = false, updatable = false)
  private Instant joinedAt = Instant.now();
}
