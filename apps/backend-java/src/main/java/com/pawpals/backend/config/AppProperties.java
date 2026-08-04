package com.pawpals.backend.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Uploads uploads, int passExpiryMinutes) {

  public record Jwt(String secret, String refreshSecret, long accessTtlSeconds, long refreshTtlSeconds) {}

  public record Cors(List<String> origins) {}

  public record Uploads(String dir) {}
}
