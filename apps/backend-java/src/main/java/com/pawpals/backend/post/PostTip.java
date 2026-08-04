package com.pawpals.backend.post;

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

/** 抖內紀錄本身就是「授權貼文作者查看贈送者個人介紹」的權限清單，見 PostsService#getTippers。 */
@Entity
@Table(name = "post_tips")
@Getter
@Setter
@NoArgsConstructor
public class PostTip extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "post_id", nullable = false)
  private Post post;

  public String getPostId() {
    return post != null ? post.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sender_id", nullable = false)
  private User sender;

  public String getSenderId() {
    return sender != null ? sender.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recipient_id", nullable = false)
  private User recipient;

  public String getRecipientId() {
    return recipient != null ? recipient.getId() : null;
  }

  @Column(nullable = false)
  private int amount;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
