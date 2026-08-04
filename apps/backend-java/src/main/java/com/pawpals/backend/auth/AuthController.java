package com.pawpals.backend.auth;

import com.pawpals.backend.auth.dto.LoginRequest;
import com.pawpals.backend.auth.dto.RegisterRequest;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private static final String REFRESH_COOKIE = "refreshToken";

  private final AuthService authService;
  private final JwtService jwtService;
  private final AppProperties appProperties;

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> register(@Valid @RequestBody RegisterRequest dto, HttpServletResponse response) {
    AuthTokens tokens = authService.register(dto);
    setRefreshCookie(response, tokens.refreshToken());
    return orderedMap("accessToken", tokens.accessToken(), "userId", tokens.userId());
  }

  @PostMapping("/login")
  public Map<String, Object> login(@Valid @RequestBody LoginRequest dto, HttpServletResponse response) {
    AuthTokens tokens = authService.login(dto);
    setRefreshCookie(response, tokens.refreshToken());
    return orderedMap("accessToken", tokens.accessToken(), "userId", tokens.userId(), "role", tokens.role());
  }

  @PostMapping("/refresh")
  public Map<String, Object> refresh(HttpServletRequest request, HttpServletResponse response) {
    String refreshToken = readCookie(request);
    if (refreshToken == null) {
      throw ApiException.unauthorized("INVALID_TOKEN");
    }
    String userId = jwtService.extractSubjectUnverified(refreshToken);
    AuthTokens tokens = authService.refresh(userId, refreshToken);
    setRefreshCookie(response, tokens.refreshToken());
    return orderedMap("accessToken", tokens.accessToken());
  }

  @PostMapping("/logout")
  public Map<String, Object> logout(@AuthenticationPrincipal RequestUser user, HttpServletResponse response) {
    authService.logout(user.userId());
    clearRefreshCookie(response);
    return orderedMap("ok", true);
  }

  private String readCookie(HttpServletRequest request) {
    if (request.getCookies() == null) return null;
    for (Cookie cookie : request.getCookies()) {
      if (REFRESH_COOKIE.equals(cookie.getName())) return cookie.getValue();
    }
    return null;
  }

  private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
    Cookie cookie = new Cookie(REFRESH_COOKIE, refreshToken);
    cookie.setHttpOnly(true);
    cookie.setPath("/");
    cookie.setMaxAge((int) appProperties.jwt().refreshTtlSeconds());
    response.addCookie(cookie);
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    Cookie cookie = new Cookie(REFRESH_COOKIE, "");
    cookie.setHttpOnly(true);
    cookie.setPath("/");
    cookie.setMaxAge(0);
    response.addCookie(cookie);
  }

  private Map<String, Object> orderedMap(Object... kv) {
    Map<String, Object> map = new LinkedHashMap<>();
    for (int i = 0; i < kv.length; i += 2) {
      map.put((String) kv[i], kv[i + 1]);
    }
    return map;
  }
}
