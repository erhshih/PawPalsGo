package com.pawpals.backend.pet;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pets")
@Getter
@Setter
@NoArgsConstructor
public class Pet extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  public String getOwnerId() {
    return owner != null ? owner.getId() : null;
  }

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String breed;

  @Column(nullable = false, length = 140)
  private String bio;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "pet_tags", joinColumns = @JoinColumn(name = "pet_id"))
  @Column(name = "tag")
  private List<String> tags = new ArrayList<>();

  private LocalDate birthDate;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
