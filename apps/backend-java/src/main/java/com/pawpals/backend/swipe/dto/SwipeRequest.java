package com.pawpals.backend.swipe.dto;

import com.pawpals.backend.swipe.SwipeDirection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SwipeRequest(@NotBlank String targetUserId, @NotNull SwipeDirection direction) {}
