package com.pawpals.backend.discover.dto;

import com.pawpals.backend.user.Gender;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRole;
import java.util.List;

public record UserCardResponse(
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
    String avatarUrl) {

  public static UserCardResponse from(User u) {
    return new UserCardResponse(
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
        u.getAvatarUrl());
  }
}
