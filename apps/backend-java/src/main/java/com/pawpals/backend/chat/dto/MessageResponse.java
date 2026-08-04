package com.pawpals.backend.chat.dto;

import com.pawpals.backend.chat.Message;
import java.time.Instant;

public record MessageResponse(String id, String matchId, String senderId, String text, Instant createdAt) {

  public static MessageResponse from(Message m) {
    return new MessageResponse(m.getId(), m.getMatchId(), m.getSenderId(), m.getText(), m.getCreatedAt());
  }
}
