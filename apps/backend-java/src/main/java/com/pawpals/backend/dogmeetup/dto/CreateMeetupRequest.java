package com.pawpals.backend.dogmeetup.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record CreateMeetupRequest(
    @NotBlank @Size(max = 60) String title,
    @Size(max = 300) String description,
    @NotBlank @Size(max = 100) String location,
    @DecimalMin("-90") @DecimalMax("90") Double latitude,
    @DecimalMin("-180") @DecimalMax("180") Double longitude,
    @NotNull Instant scheduledAt,
    @Min(2) @Max(100) Integer maxAttendees) {}
