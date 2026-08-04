package com.pawpals.backend.meeting.dto;

import com.pawpals.backend.meeting.Meeting;
import com.pawpals.backend.meeting.MeetingStatus;
import java.time.Instant;

public record MeetingResponse(
    String id,
    String matchId,
    String initiatorId,
    Instant scheduledAt,
    MeetingStatus status,
    int escrow,
    Instant createdAt,
    Instant updatedAt) {

  public static MeetingResponse from(Meeting m) {
    return new MeetingResponse(
        m.getId(), m.getMatchId(), m.getInitiatorId(), m.getScheduledAt(), m.getStatus(), m.getEscrow(), m.getCreatedAt(), m.getUpdatedAt());
  }
}
