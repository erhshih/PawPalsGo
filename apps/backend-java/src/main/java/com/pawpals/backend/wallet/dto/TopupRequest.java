package com.pawpals.backend.wallet.dto;

import jakarta.validation.constraints.NotBlank;

public record TopupRequest(@NotBlank String packageId) {}
