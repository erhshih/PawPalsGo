package com.pawpals.backend.safety.dto;

import com.pawpals.backend.user.User;

public record BlockedUserSummary(String id, String displayName, String avatarUrl) {

  public static BlockedUserSummary from(User u) {
    return new BlockedUserSummary(u.getId(), u.getDisplayName(), u.getAvatarUrl());
  }
}
