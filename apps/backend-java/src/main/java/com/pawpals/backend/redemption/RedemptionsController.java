package com.pawpals.backend.redemption;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.redemption.dto.RedemptionResponse;
import com.pawpals.backend.redemption.dto.RewardResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/redemptions")
@RequiredArgsConstructor
public class RedemptionsController {

  private final RedemptionsService redemptionsService;

  @GetMapping("/rewards")
  public List<RewardResponse> listRewards() {
    return redemptionsService.listRewards();
  }

  @PostMapping("/rewards/{rewardId}")
  public RedemptionResponse redeem(@PathVariable String rewardId, @AuthenticationPrincipal RequestUser user) {
    return redemptionsService.redeem(user.userId(), rewardId);
  }

  @GetMapping("/history")
  public List<RedemptionResponse> getMyRedemptions(@AuthenticationPrincipal RequestUser user) {
    return redemptionsService.getMyRedemptions(user.userId());
  }
}
