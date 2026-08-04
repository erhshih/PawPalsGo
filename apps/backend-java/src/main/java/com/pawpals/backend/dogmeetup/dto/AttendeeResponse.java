package com.pawpals.backend.dogmeetup.dto;

import com.pawpals.backend.post.dto.AuthorSummary;
import java.time.Instant;

public record AttendeeResponse(
    String id, String meetupId, String userId, String petId, Instant joinedAt, AuthorSummary user, PetSummary pet) {}
