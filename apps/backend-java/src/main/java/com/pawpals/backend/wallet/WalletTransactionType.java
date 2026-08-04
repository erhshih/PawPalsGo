package com.pawpals.backend.wallet;

public enum WalletTransactionType {
  TOPUP,
  DEBIT,
  CREDIT,
  ESCROW,
  ESCROW_RELEASE,
  TIP_SENT,
  TIP_RECEIVED,
  REDEMPTION
}
