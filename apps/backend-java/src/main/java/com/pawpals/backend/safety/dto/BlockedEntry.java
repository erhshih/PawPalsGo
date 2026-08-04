package com.pawpals.backend.safety.dto;

import java.time.Instant;

public record BlockedEntry(Instant blockedAt, BlockedUserSummary user) {}
