package com.pawpals.backend.safety.dto;

import com.pawpals.backend.safety.Report;
import com.pawpals.backend.safety.ReportReason;
import com.pawpals.backend.safety.ReportStatus;
import java.time.Instant;

public record ReportResponse(
    String id,
    String reporterId,
    String targetId,
    ReportReason reason,
    String detail,
    String postId,
    ReportStatus status,
    Instant createdAt) {

  public static ReportResponse from(Report r) {
    return new ReportResponse(
        r.getId(), r.getReporterId(), r.getTargetId(), r.getReason(), r.getDetail(), r.getPostId(), r.getStatus(), r.getCreatedAt());
  }
}
