package com.pawpals.backend.chat;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.chat.dto.MessageResponse;
import com.pawpals.backend.chat.dto.SendMessageRequest;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.meeting.MeetingRepository;
import com.pawpals.backend.meeting.MeetingStatus;
import com.pawpals.backend.meeting.dto.MeetingResponse;
import com.pawpals.backend.safety.SafetyService;
import com.pawpals.backend.swipe.Match;
import com.pawpals.backend.swipe.MatchRepository;
import com.pawpals.backend.user.UserRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/matches")
@RequiredArgsConstructor
public class ChatController {

  private final MatchRepository matchRepository;
  private final MeetingRepository meetingRepository;
  private final MessageRepository messageRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatSessionRegistry chatSessionRegistry;
  private final SafetyService safetyService;
  private final UserRepository userRepository;

  @GetMapping("/{matchId}/meeting")
  public Optional<MeetingResponse> getActiveMeeting(
      @PathVariable String matchId, @AuthenticationPrincipal RequestUser user) {
    requireMember(matchId, user.userId());
    return meetingRepository
        .findFirstByMatch_IdAndStatusOrderByCreatedAtDesc(matchId, MeetingStatus.SCHEDULED)
        .map(MeetingResponse::from);
  }

  @GetMapping("/{matchId}/messages")
  public List<MessageResponse> getMessages(
      @PathVariable String matchId,
      @AuthenticationPrincipal RequestUser user,
      @RequestParam(required = false) Instant before,
      @RequestParam(defaultValue = "20") int limit) {
    requireMember(matchId, user.userId());
    List<Message> messages =
        before == null
            ? messageRepository.findByMatch_IdOrderByCreatedAtDesc(matchId, PageRequest.of(0, limit))
            : messageRepository.findByMatchIdBeforeOrderByCreatedAtDesc(matchId, before, PageRequest.of(0, limit));
    return messages.stream().map(MessageResponse::from).toList();
  }

  @PostMapping("/{matchId}/messages")
  public MessageResponse sendMessage(
      @PathVariable String matchId, @Valid @RequestBody SendMessageRequest dto, @AuthenticationPrincipal RequestUser user) {
    Match match = requireMember(matchId, user.userId());
    String recipientIdForCheck = match.getUserAId().equals(user.userId()) ? match.getUserBId() : match.getUserAId();
    safetyService.assertNotBlocked(user.userId(), recipientIdForCheck);

    Message message = new Message();
    message.setMatch(match);
    message.setSender(userRepository.getReferenceById(user.userId()));
    message.setText(dto.text());
    message = messageRepository.save(message);

    String recipientId = match.getUserAId().equals(user.userId()) ? match.getUserBId() : match.getUserAId();
    String unreadKey = "unread:" + matchId + ":" + recipientId;
    redisTemplate.opsForValue().increment(unreadKey);
    redisTemplate.expire(unreadKey, java.time.Duration.ofDays(30));

    MessageResponse response = MessageResponse.from(message);
    chatSessionRegistry.emitToRoom(matchId, "chat:message", response);
    return response;
  }

  @PostMapping("/{matchId}/read")
  public Map<String, Object> markRead(@PathVariable String matchId, @AuthenticationPrincipal RequestUser user) {
    redisTemplate.delete("unread:" + matchId + ":" + user.userId());
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("userId", user.userId());
    payload.put("readAt", Instant.now().truncatedTo(ChronoUnit.MILLIS).toString());
    chatSessionRegistry.emitToRoom(matchId, "chat:read", payload);
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("ok", true);
    return body;
  }

  private Match requireMember(String matchId, String userId) {
    Match match = matchRepository.findById(matchId).orElseThrow(() -> ApiException.forbidden("FORBIDDEN"));
    if (!match.getUserAId().equals(userId) && !match.getUserBId().equals(userId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    return match;
  }
}
