package com.pawpals.backend.auth.dto;

import com.pawpals.backend.user.Gender;
import com.pawpals.backend.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8, max = 72) String password,
    @NotNull UserRole role,
    Gender gender) {}
