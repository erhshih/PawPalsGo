package com.pawpals.backend.wallet;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.wallet.dto.TopupRequest;
import com.pawpals.backend.wallet.dto.WalletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class WalletController {

  private final WalletService walletService;

  @GetMapping
  public WalletResponse getWallet(@AuthenticationPrincipal RequestUser user) {
    return walletService.getWallet(user.userId());
  }

  @PostMapping("/topup")
  public WalletResponse topup(@Valid @RequestBody TopupRequest dto, @AuthenticationPrincipal RequestUser user) {
    return walletService.topup(user.userId(), dto.packageId());
  }
}
