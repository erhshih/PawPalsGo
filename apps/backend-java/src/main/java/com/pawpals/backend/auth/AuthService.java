package com.pawpals.backend.auth;

import com.pawpals.backend.auth.dto.LoginRequest;
import com.pawpals.backend.auth.dto.RegisterRequest;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.user.UserRole;
import com.pawpals.backend.wallet.Wallet;
import com.pawpals.backend.wallet.WalletRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final StringRedisTemplate redisTemplate;
  private final AppProperties appProperties;

  @Transactional
  public AuthTokens register(RegisterRequest dto) {
    if (userRepository.existsByEmail(dto.email())) {
      throw ApiException.conflict("EMAIL_TAKEN");
    }

    User user = new User();
    user.setEmail(dto.email());
    user.setPasswordHash(passwordEncoder.encode(dto.password()));
    user.setRole(dto.role());
    user.setGender(dto.gender());
    user = userRepository.save(user);

    Wallet wallet = new Wallet();
    wallet.setUser(user);
    wallet.setBalance(0);
    walletRepository.save(wallet);

    AuthTokens tokens = signTokens(user.getId(), user.getRole());
    saveRefreshToken(user.getId(), tokens.refreshToken());
    return tokens;
  }

  public AuthTokens login(LoginRequest dto) {
    User user =
        userRepository
            .findByEmail(dto.email())
            .orElseThrow(() -> ApiException.unauthorized("INVALID_CREDENTIALS"));

    if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
      throw ApiException.unauthorized("INVALID_CREDENTIALS");
    }

    AuthTokens tokens = signTokens(user.getId(), user.getRole());
    saveRefreshToken(user.getId(), tokens.refreshToken());
    return tokens;
  }

  public AuthTokens refresh(String userId, String refreshToken) {
    String stored = redisTemplate.opsForValue().get("refresh:" + userId);
    if (stored == null) {
      throw ApiException.unauthorized("SESSION_EXPIRED");
    }
    if (!MessageDigest.isEqual(sha256Hex(refreshToken).getBytes(StandardCharsets.UTF_8), stored.getBytes(StandardCharsets.UTF_8))) {
      throw ApiException.unauthorized("INVALID_REFRESH_TOKEN");
    }

    User user = userRepository.findById(userId).orElseThrow(() -> ApiException.unauthorized("SESSION_EXPIRED"));
    AuthTokens tokens = signTokens(user.getId(), user.getRole());
    saveRefreshToken(user.getId(), tokens.refreshToken());
    return tokens;
  }

  public void logout(String userId) {
    redisTemplate.delete("refresh:" + userId);
  }

  private AuthTokens signTokens(String userId, UserRole role) {
    String accessToken = jwtService.signAccessToken(userId, role);
    String refreshToken = jwtService.signRefreshToken(userId, role);
    return new AuthTokens(accessToken, refreshToken, userId, role);
  }

  private void saveRefreshToken(String userId, String refreshToken) {
    redisTemplate
        .opsForValue()
        .set("refresh:" + userId, sha256Hex(refreshToken), Duration.ofSeconds(appProperties.jwt().refreshTtlSeconds()));
  }

  /**
   * Refresh tokens are signed JWTs, not user-chosen secrets, so a fast SHA-256 digest (rather than bcrypt, which
   * silently caps input at 72 bytes and would truncate the token) is the appropriate way to store them at rest.
   */
  private String sha256Hex(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
