package com.pawpals.backend.redemption;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.redemption.dto.RedemptionResponse;
import com.pawpals.backend.redemption.dto.RewardResponse;
import com.pawpals.backend.wallet.Wallet;
import com.pawpals.backend.wallet.WalletRepository;
import com.pawpals.backend.wallet.WalletTransaction;
import com.pawpals.backend.wallet.WalletTransactionRepository;
import com.pawpals.backend.wallet.WalletTransactionType;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RedemptionsService {

  private final RedemptionRewardRepository rewardRepository;
  private final RedemptionRepository redemptionRepository;
  private final WalletRepository walletRepository;
  private final WalletTransactionRepository walletTransactionRepository;

  public List<RewardResponse> listRewards() {
    return rewardRepository.findByActiveTrueOrderByCostJerkyAsc().stream().map(RewardResponse::from).toList();
  }

  /**
   * 封閉迴圈兌換：肉乾扣款後換一組兌換碼，使用者拿兌換碼去合作品牌端領取實體商品。
   * 沒有任何路徑可以把肉乾換回現金——這是刻意的設計。
   */
  @Transactional
  public RedemptionResponse redeem(String userId, String rewardId) {
    RedemptionReward reward = rewardRepository.lockById(rewardId).orElseThrow(() -> ApiException.notFound("REWARD_NOT_FOUND"));
    if (!reward.isActive()) {
      throw ApiException.notFound("REWARD_NOT_FOUND");
    }
    if (reward.getStock() != null && reward.getStock() <= 0) {
      throw ApiException.unprocessable("OUT_OF_STOCK");
    }

    Wallet wallet = walletRepository.lockByUserId(userId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    if (wallet.getBalance() < reward.getCostJerky()) {
      throw ApiException.unprocessable("INSUFFICIENT_BALANCE");
    }

    if (reward.getStock() != null) {
      reward.setStock(reward.getStock() - 1);
      rewardRepository.save(reward);
    }

    wallet.setBalance(wallet.getBalance() - reward.getCostJerky());
    walletRepository.save(wallet);

    WalletTransaction tx = new WalletTransaction();
    tx.setUser(wallet.getUser());
    tx.setType(WalletTransactionType.REDEMPTION);
    tx.setAmount(reward.getCostJerky());
    tx.setRelatedEntityId(rewardId);
    walletTransactionRepository.save(tx);

    String code = "PP-" + UUID.randomUUID().toString().split("-")[0].toUpperCase();
    Redemption redemption = new Redemption();
    redemption.setReward(reward);
    redemption.setUser(wallet.getUser());
    redemption.setCode(code);
    redemption = redemptionRepository.save(redemption);

    return RedemptionResponse.from(redemption, RewardResponse.from(reward));
  }

  public List<RedemptionResponse> getMyRedemptions(String userId) {
    return redemptionRepository.findByUser_IdOrderByRedeemedAtDesc(userId).stream()
        .map(r -> {
          RedemptionReward reward = rewardRepository.findById(r.getRewardId()).orElse(null);
          return RedemptionResponse.from(r, reward != null ? RewardResponse.from(reward) : null);
        })
        .toList();
  }
}
