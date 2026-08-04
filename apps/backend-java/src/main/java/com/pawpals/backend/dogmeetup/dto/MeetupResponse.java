package com.pawpals.backend.dogmeetup.dto;

import com.pawpals.backend.post.dto.AuthorSummary;
import java.time.Instant;
import java.util.List;

public record MeetupResponse(
    String id,
    String organizerId,
    String title,
    String description,
    String location,
    Double latitude,
    Double longitude,
    Instant scheduledAt,
    Integer maxAttendees,
    Instant cancelledAt,
    Instant createdAt,
    AuthorSummary organizer,
    long attendeeCount,
    List<AttendeeResponse> attendees,
    Double distanceM) {}
