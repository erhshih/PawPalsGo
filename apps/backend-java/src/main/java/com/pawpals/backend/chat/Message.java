package com.pawpals.backend.chat;

import com.pawpals.backend.common.BaseEntity;
import com.pawpals.backend.swipe.Match;
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

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "match_id", nullable = false)
  private Match match;

  public String getMatchId() {
    return match != null ? match.getId() : null;
  }

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sender_id", nullable = false)
  private User sender;

  public String getSenderId() {
    return sender != null ? sender.getId() : null;
  }

  @Column(nullable = false, length = 2000)
  private String text;

  @Column(nullable = false, updatable = false)
  private Instant createdAt = Instant.now();
}
