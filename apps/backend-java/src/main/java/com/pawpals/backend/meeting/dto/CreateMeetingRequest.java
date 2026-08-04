package com.pawpals.backend.meeting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateMeetingRequest(@NotBlank String matchId, @NotNull Instant scheduledAt) {}
