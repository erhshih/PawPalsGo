package com.pawpals.backend.wallet;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.wallet.dto.WalletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

  private final WalletRepository walletRepository;
  private final WalletTransactionRepository transactionRepository;
  private final UserRepository userRepository;

  public WalletResponse getWallet(String userId) {
    Wallet wallet = walletRepository.findByUser_Id(userId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    return WalletResponse.of(wallet.getBalance());
  }

  @Transactional
  public WalletResponse topup(String userId, String packageId) {
    WalletPackages.Package pkg = WalletPackages.find(packageId);
    if (pkg == null) {
      throw ApiException.unprocessable("INVALID_PACKAGE");
    }

    Wallet wallet = walletRepository.lockByUserId(userId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    wallet.setBalance(wallet.getBalance() + pkg.jerky());
    walletRepository.save(wallet);

    recordTransaction(userId, WalletTransactionType.TOPUP, pkg.jerky(), packageId);
    return WalletResponse.of(wallet.getBalance());
  }

  @Transactional
  public void debitEscrow(String userId, int amount, String meetingId) {
    Wallet wallet = walletRepository.lockByUserId(userId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    if (wallet.getBalance() < amount) {
      throw ApiException.unprocessable("INSUFFICIENT_BALANCE");
    }
    wallet.setBalance(wallet.getBalance() - amount);
    walletRepository.save(wallet);
    recordTransaction(userId, WalletTransactionType.ESCROW, amount, meetingId);
  }

  @Transactional
  public void releaseEscrow(String meetingId, String recipientId, int amount) {
    Wallet wallet =
        walletRepository.lockByUserId(recipientId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    wallet.setBalance(wallet.getBalance() + amount);
    walletRepository.save(wallet);
    recordTransaction(recipientId, WalletTransactionType.ESCROW_RELEASE, amount, meetingId);
  }

  @Transactional
  public void refundEscrow(String meetingId, String userId, int amount) {
    Wallet wallet = walletRepository.lockByUserId(userId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    wallet.setBalance(wallet.getBalance() + amount);
    walletRepository.save(wallet);
    recordTransaction(userId, WalletTransactionType.CREDIT, amount, meetingId);
  }

  private void recordTransaction(String userId, WalletTransactionType type, int amount, String relatedEntityId) {
    WalletTransaction tx = new WalletTransaction();
    tx.setUser(userRepository.getReferenceById(userId));
    tx.setType(type);
    tx.setAmount(amount);
    tx.setRelatedEntityId(relatedEntityId);
    transactionRepository.save(tx);
  }
}
