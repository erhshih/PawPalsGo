package com.pawpals.backend.swipe.dto;

import com.pawpals.backend.chat.dto.MessageResponse;
import java.time.Instant;

public record MatchSummary(
    String id, PartnerSummary partner, MessageResponse lastMessage, int unreadCount, Instant createdAt) {}
