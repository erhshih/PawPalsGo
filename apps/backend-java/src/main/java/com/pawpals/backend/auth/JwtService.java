package com.pawpals.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/** Mirrors the Nest backend's JwtService usage: HS256 access/refresh tokens with a "sub"/"role" payload. */
@Service
@RequiredArgsConstructor
public class JwtService {

  private final AppProperties appProperties;
  private final ObjectMapper objectMapper = new ObjectMapper();

  private SecretKey accessKey() {
    return Keys.hmacShaKeyFor(appProperties.jwt().secret().getBytes(StandardCharsets.UTF_8));
  }

  private SecretKey refreshKey() {
    return Keys.hmacShaKeyFor(appProperties.jwt().refreshSecret().getBytes(StandardCharsets.UTF_8));
  }

  public String signAccessToken(String userId, UserRole role) {
    return sign(userId, role, accessKey(), appProperties.jwt().accessTtlSeconds());
  }

  public String signRefreshToken(String userId, UserRole role) {
    return sign(userId, role, refreshKey(), appProperties.jwt().refreshTtlSeconds());
  }

  private String sign(String userId, UserRole role, SecretKey key, long ttlSeconds) {
    Instant now = Instant.now();
    return Jwts.builder()
        .claims(Map.of("sub", userId, "role", role.name()))
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(ttlSeconds, ChronoUnit.SECONDS)))
        .signWith(key)
        .compact();
  }

  /** Verifies an access token (Authorization header, WebSocket handshake). Throws JwtException if invalid/expired. */
  public Claims verifyAccessToken(String token) {
    return Jwts.parser().verifyWith(accessKey()).build().parseSignedClaims(token).getPayload();
  }

  /**
   * Decodes the refresh-token payload WITHOUT verifying the signature, matching the Nest backend's
   * AuthController#parseRefreshToken. The actual security check happens against the bcrypt hash stored in Redis.
   */
  public String extractSubjectUnverified(String token) {
    String[] parts = token == null ? null : token.split("\\.");
    if (parts == null || parts.length != 3) {
      throw new JwtException("Invalid token");
    }
    try {
      byte[] json = Base64.getUrlDecoder().decode(parts[1]);
      Map<?, ?> payload = objectMapper.readValue(json, Map.class);
      Object sub = payload.get("sub");
      if (!(sub instanceof String subject) || !StringUtils.hasText(subject)) {
        throw new JwtException("Invalid token");
      }
      return subject;
    } catch (JwtException e) {
      throw e;
    } catch (Exception e) {
      throw new JwtException("Invalid token", e);
    }
  }
}
