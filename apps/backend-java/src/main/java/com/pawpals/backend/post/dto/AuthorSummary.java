package com.pawpals.backend.post.dto;

import com.pawpals.backend.user.User;

public record AuthorSummary(String id, String displayName, String avatarUrl, String city) {

  public static AuthorSummary from(User u) {
    return new AuthorSummary(u.getId(), u.getDisplayName(), u.getAvatarUrl(), u.getCity());
  }
}
