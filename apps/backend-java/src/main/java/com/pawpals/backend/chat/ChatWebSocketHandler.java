package com.pawpals.backend.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawpals.backend.auth.JwtService;
import com.pawpals.backend.chat.dto.MessageResponse;
import com.pawpals.backend.common.JsonMapper;
import com.pawpals.backend.safety.SafetyService;
import com.pawpals.backend.swipe.Match;
import com.pawpals.backend.swipe.MatchRepository;
import com.pawpals.backend.user.UserRepository;
import io.jsonwebtoken.Claims;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Raw JSON-envelope WebSocket endpoint at {@code /ws/chat?token=<accessToken>} that plays the same role as the
 * Node backend's Socket.IO {@code ChatGateway}: {@code chat:join} / {@code chat:send} in, {@code chat:message} /
 * {@code match:new} / {@code meeting:updated} out. It does NOT speak the Socket.IO wire protocol — see README for
 * why, and what it'd take to make the existing socket.io-client frontends talk to this backend directly.
 */
@Slf4j
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

  private static final String USER_ID_ATTR = "userId";

  private final JwtService jwtService;
  private final MatchRepository matchRepository;
  private final MessageRepository messageRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatSessionRegistry chatSessionRegistry;
  private final SafetyService safetyService;
  private final UserRepository userRepository;
  private final ObjectMapper objectMapper = JsonMapper.instance();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String userId = authenticate(session);
    if (userId == null) {
      closeQuietly(session, CloseStatus.POLICY_VIOLATION);
      return;
    }
    session.getAttributes().put(USER_ID_ATTR, userId);
    chatSessionRegistry.registerUser(userId, session);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    String userId = (String) session.getAttributes().get(USER_ID_ATTR);
    if (userId == null) return;

    JsonNode node;
    try {
      node = objectMapper.readTree(message.getPayload());
    } catch (Exception e) {
      return;
    }

    String type = node.path("type").asText(null);
    String matchId = node.path("matchId").asText(null);
    if (type == null || matchId == null) return;

    switch (type) {
      case "chat:join" -> handleJoin(session, userId, matchId);
      case "chat:send" -> handleSend(userId, matchId, node.path("text").asText(""));
      default -> log.debug("Unknown websocket message type: {}", type);
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    chatSessionRegistry.removeSession(session);
  }

  private void handleJoin(WebSocketSession session, String userId, String matchId) {
    Match match = matchRepository.findById(matchId).orElse(null);
    if (match == null || (!match.getUserAId().equals(userId) && !match.getUserBId().equals(userId))) {
      return;
    }
    chatSessionRegistry.joinRoom(matchId, session);
  }

  private void handleSend(String userId, String matchId, String text) {
    Match match = matchRepository.findById(matchId).orElse(null);
    if (match == null || text.isBlank()) return;

    String recipientId = match.getUserAId().equals(userId) ? match.getUserBId() : match.getUserAId();
    try {
      safetyService.assertNotBlocked(userId, recipientId);
    } catch (Exception e) {
      return;
    }

    Message entity = new Message();
    entity.setMatch(match);
    entity.setSender(userRepository.getReferenceById(userId));
    entity.setText(text);
    entity = messageRepository.save(entity);

    String unreadKey = "unread:" + matchId + ":" + recipientId;
    redisTemplate.opsForValue().increment(unreadKey);
    redisTemplate.expire(unreadKey, Duration.ofDays(30));

    chatSessionRegistry.emitToRoom(matchId, "chat:message", MessageResponse.from(entity));
  }

  private String authenticate(WebSocketSession session) {
    String token = extractToken(session);
    if (token == null) return null;
    try {
      Claims claims = jwtService.verifyAccessToken(token);
      return claims.getSubject();
    } catch (Exception e) {
      return null;
    }
  }

  private String extractToken(WebSocketSession session) {
    if (session.getUri() == null) return null;
    MultiValueMap<String, String> params = UriComponentsBuilder.fromUri(session.getUri()).build().getQueryParams();
    return Optional.ofNullable(params.getFirst("token")).orElse(null);
  }

  private void closeQuietly(WebSocketSession session, CloseStatus status) {
    try {
      session.close(status);
    } catch (Exception ignored) {
      // best-effort
    }
  }
}
