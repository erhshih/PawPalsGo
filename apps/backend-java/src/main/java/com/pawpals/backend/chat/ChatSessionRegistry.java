package com.pawpals.backend.chat;

import com.pawpals.backend.common.JsonMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

/**
 * Java equivalent of the Nest backend's {@code ChatGateway}: tracks which WebSocket sessions are in which
 * "room:match-&lt;id&gt;" and pushes JSON envelope messages, since this backend uses a plain Spring WebSocket
 * handler rather than the Socket.IO wire protocol the Node backend speaks (see README).
 */
@Slf4j
@Component
public class ChatSessionRegistry {

  private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();
  private final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

  // Not a Spring bean: Boot 4's autoconfigured ObjectMapper is Jackson 3 (tools.jackson.*), while this
  // codebase uses classic Jackson 2 (com.fasterxml.jackson.*, e.g. for jjwt-jackson). JsonMapper.instance()
  // matches the ISO-8601 date formatting Spring's REST layer uses, so WS and REST payloads stay consistent.
  private final ObjectMapper objectMapper = JsonMapper.instance();

  public void registerUser(String userId, WebSocketSession session) {
    userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
  }

  public void joinRoom(String matchId, WebSocketSession session) {
    rooms.computeIfAbsent(roomKey(matchId), k -> new CopyOnWriteArraySet<>()).add(session);
  }

  public void removeSession(WebSocketSession session) {
    rooms.values().forEach(sessions -> sessions.remove(session));
    userSessions.values().forEach(sessions -> sessions.remove(session));
  }

  public void emitToRoom(String matchId, String type, Object payload) {
    broadcast(rooms.getOrDefault(roomKey(matchId), Set.of()), type, payload);
  }

  public void emitMatchNew(String userAId, String userBId, String matchId) {
    Map<String, Object> payload = Map.of("matchId", matchId);
    broadcast(userSessions.getOrDefault(userAId, Set.of()), "match:new", payload);
    broadcast(userSessions.getOrDefault(userBId, Set.of()), "match:new", payload);
  }

  private void broadcast(Set<WebSocketSession> sessions, String type, Object payload) {
    if (sessions.isEmpty()) return;
    String json;
    try {
      json = objectMapper.writeValueAsString(Map.of("type", type, "payload", payload));
    } catch (IOException e) {
      log.warn("Failed to serialize websocket payload", e);
      return;
    }
    TextMessage message = new TextMessage(json);
    for (WebSocketSession session : sessions) {
      try {
        if (session.isOpen()) session.sendMessage(message);
      } catch (IOException e) {
        log.debug("Failed to send websocket message to session {}", session.getId(), e);
      }
    }
  }

  private String roomKey(String matchId) {
    return "room:match-" + matchId;
  }
}
