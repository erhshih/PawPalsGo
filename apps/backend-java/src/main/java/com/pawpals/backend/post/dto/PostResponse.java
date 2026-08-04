package com.pawpals.backend.post.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(
    String id,
    String authorId,
    String petId,
    String caption,
    Instant createdAt,
    List<PostPhotoResponse> photos,
    long likeCount,
    long commentCount,
    long tipCount,
    AuthorSummary author,
    Double distanceM) {}
