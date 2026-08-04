package com.pawpals.backend.swipe;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.swipe.dto.MatchDetail;
import com.pawpals.backend.swipe.dto.MatchSummary;
import com.pawpals.backend.swipe.dto.PartnerSummary;
import com.pawpals.backend.swipe.dto.SwipeRequest;
import com.pawpals.backend.swipe.dto.SwipeResult;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SwipeController {

  private final SwipeService swipeService;

  @PostMapping("/swipes")
  public SwipeResult swipe(@Valid @RequestBody SwipeRequest dto, @AuthenticationPrincipal RequestUser user) {
    return swipeService.swipe(user.userId(), dto.targetUserId(), dto.direction());
  }

  @PostMapping("/swipes/{targetUserId}/treat")
  public Map<String, Object> sendTreat(@PathVariable String targetUserId, @AuthenticationPrincipal RequestUser user) {
    return swipeService.sendTreat(user.userId(), targetUserId);
  }

  @GetMapping("/matches")
  public List<MatchSummary> getMatches(@AuthenticationPrincipal RequestUser user) {
    return swipeService.getMatches(user.userId());
  }

  @GetMapping("/matches/{matchId}")
  public MatchDetail getMatch(@PathVariable String matchId, @AuthenticationPrincipal RequestUser user) {
    MatchDetail match = swipeService.getMatch(matchId);
    boolean isUserA = match.userA().id().equals(user.userId());
    boolean isUserB = match.userB().id().equals(user.userId());
    if (!isUserA && !isUserB) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    PartnerSummary partner = isUserA ? match.userB() : match.userA();
    return new MatchDetail(match.id(), match.userA(), match.userB(), match.messages(), match.createdAt(), partner);
  }
}
