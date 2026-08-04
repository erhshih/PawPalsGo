package com.pawpals.backend.auth;

import com.pawpals.backend.user.UserRole;

public record RequestUser(String userId, UserRole role) {}
