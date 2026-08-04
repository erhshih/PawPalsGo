package com.pawpals.backend.wallet.dto;

public record WalletResponse(int balance, String currency) {

  public static WalletResponse of(int balance) {
    return new WalletResponse(balance, "肉乾");
  }
}
