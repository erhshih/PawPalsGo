package com.pawpals.backend.post;

import com.pawpals.backend.common.BaseEntity;
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
@Table(name = "post_photos")
@Getter
@Setter
@NoArgsConstructor
public class PostPhoto extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  public String getPostId() {
    return post != null ? post.getId() : null;
  }

  @Column(nullable = false)
  private String url;

  @Column(nullable = false)
  private Integer sortOrder;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
