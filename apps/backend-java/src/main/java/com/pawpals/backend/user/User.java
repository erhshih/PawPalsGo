package com.pawpals.backend.user;

import com.pawpals.backend.common.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role;

  @Enumerated(EnumType.STRING)
  private Gender gender;

  private String displayName;

  @Column(length = 500)
  private String bio;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
  @Column(name = "interest")
  private List<String> interests = new ArrayList<>();

  private String education;
  private String zodiac;
  private String jobTitle;
  private String company;
  private String school;
  private String city;
  private Integer height;
  private String avatarUrl;
  private Double latitude;
  private Double longitude;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
