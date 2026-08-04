package com.pawpals.backend.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostCommentRequest(@NotBlank @Size(max = 500) String text) {}
