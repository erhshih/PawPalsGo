package com.pawpals.backend.post.dto;

import com.pawpals.backend.discover.dto.MeResponse;
import java.time.Instant;

public record TipperEntry(int amount, Instant tippedAt, MeResponse sender) {}
