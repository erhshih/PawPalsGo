package com.pawpals.backend.swipe.dto;

import com.pawpals.backend.chat.dto.MessageResponse;
import java.time.Instant;
import java.util.List;

public record MatchDetail(
    String id,
    PartnerSummary userA,
    PartnerSummary userB,
    List<MessageResponse> messages,
    Instant createdAt,
    PartnerSummary partner) {}
