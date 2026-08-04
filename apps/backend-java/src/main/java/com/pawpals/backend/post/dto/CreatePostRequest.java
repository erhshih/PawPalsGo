package com.pawpals.backend.post.dto;

import jakarta.validation.constraints.Size;

public record CreatePostRequest(@Size(max = 300) String caption, String petId) {}
