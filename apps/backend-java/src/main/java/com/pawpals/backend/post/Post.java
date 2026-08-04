package com.pawpals.backend.post;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.pet.Pet;
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

/** 配對前的探索層：貼文只會出現在附近使用者的動態牆，見 PostsService#getFeed。 */
@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class Post extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "author_id", nullable = false)
  private User author;

  public String getAuthorId() {
    return author != null ? author.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "pet_id")
  private Pet pet;

  public String getPetId() {
    return pet != null ? pet.getId() : null;
  }

  @Column(length = 300)
  private String caption;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
