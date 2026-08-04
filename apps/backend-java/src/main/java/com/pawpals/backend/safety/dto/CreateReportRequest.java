package com.pawpals.backend.safety.dto;

import com.pawpals.backend.safety.ReportReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
    @NotBlank String targetId, @NotNull ReportReason reason, @Size(max = 500) String detail, String postId) {}
