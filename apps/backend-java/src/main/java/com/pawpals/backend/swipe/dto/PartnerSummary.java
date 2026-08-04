package com.pawpals.backend.swipe.dto;

import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRole;

public record PartnerSummary(String id, String email, UserRole role) {

  public static PartnerSummary from(User u) {
    return new PartnerSummary(u.getId(), u.getEmail(), u.getRole());
  }
}
