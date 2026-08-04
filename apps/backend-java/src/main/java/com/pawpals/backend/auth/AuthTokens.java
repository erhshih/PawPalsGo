package com.pawpals.backend.auth;

import com.pawpals.backend.user.UserRole;

record AuthTokens(String accessToken, String refreshToken, String userId, UserRole role) {}
