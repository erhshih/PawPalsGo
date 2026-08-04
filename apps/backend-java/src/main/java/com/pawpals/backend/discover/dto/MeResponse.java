package com.pawpals.backend.discover.dto;

import com.pawpals.backend.user.Gender;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRole;
import java.time.Instant;
import java.util.List;

public record MeResponse(
    String id,
    String email,
    UserRole role,
    Gender gender,
    String displayName,
    String bio,
    List<String> interests,
    String education,
    String zodiac,
    String jobTitle,
    String company,
    String school,
    String city,
    Integer height,
    String avatarUrl,
    Instant createdAt) {

  public static MeResponse from(User u) {
    return new MeResponse(
        u.getId(),
        u.getEmail(),
        u.getRole(),
        u.getGender(),
        u.getDisplayName(),
        u.getBio(),
        u.getInterests(),
        u.getEducation(),
        u.getZodiac(),
        u.getJobTitle(),
        u.getCompany(),
        u.getSchool(),
        u.getCity(),
        u.getHeight(),
        u.getAvatarUrl(),
        u.getCreatedAt());
  }
}
