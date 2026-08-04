package com.pawpals.backend.common;

import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import java.util.UUID;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@MappedSuperclass
@Getter
@EqualsAndHashCode(of = "id")
public abstract class BaseEntity {

  @Id
  private String id;

  @PrePersist
  protected void assignId() {
    if (id == null) {
      id = UUID.randomUUID().toString();
    }
  }
}
