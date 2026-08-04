package com.pawpals.backend.config;

import com.pawpals.backend.auth.JwtService;
import com.pawpals.backend.chat.ChatSessionRegistry;
import com.pawpals.backend.chat.ChatWebSocketHandler;
import com.pawpals.backend.chat.MessageRepository;
import com.pawpals.backend.safety.SafetyService;
import com.pawpals.backend.swipe.MatchRepository;
import com.pawpals.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

  private final JwtService jwtService;
  private final MatchRepository matchRepository;
  private final MessageRepository messageRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatSessionRegistry chatSessionRegistry;
  private final AppProperties appProperties;
  private final SafetyService safetyService;
  private final UserRepository userRepository;

  @Bean
  public ChatWebSocketHandler chatWebSocketHandler() {
    return new ChatWebSocketHandler(
        jwtService, matchRepository, messageRepository, redisTemplate, chatSessionRegistry, safetyService, userRepository);
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry
        .addHandler(chatWebSocketHandler(), "/ws/chat")
        .setAllowedOrigins(appProperties.cors().origins().toArray(new String[0]));
  }
}
