package com.pawpals.backend.swipe;

import com.pawpals.backend.chat.ChatSessionRegistry;
import com.pawpals.backend.chat.MessageRepository;
import com.pawpals.backend.chat.dto.MessageResponse;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.safety.SafetyService;
import com.pawpals.backend.swipe.dto.MatchDetail;
import com.pawpals.backend.swipe.dto.MatchSummary;
import com.pawpals.backend.swipe.dto.PartnerSummary;
import com.pawpals.backend.swipe.dto.SwipeResult;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.wallet.Wallet;
import com.pawpals.backend.wallet.WalletRepository;
import com.pawpals.backend.wallet.WalletTransaction;
import com.pawpals.backend.wallet.WalletTransactionRepository;
import com.pawpals.backend.wallet.WalletTransactionType;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SwipeService {

  private final SwipeRepository swipeRepository;
  private final MatchRepository matchRepository;
  private final UserRepository userRepository;
  private final MessageRepository messageRepository;
  private final WalletRepository walletRepository;
  private final WalletTransactionRepository walletTransactionRepository;
  private final StringRedisTemplate redisTemplate;
  private final ChatSessionRegistry chatSessionRegistry;
  private final SafetyService safetyService;

  // Deliberately NOT @Transactional: the match-insert-then-fallback-query below relies on each
  // repository call running in its own transaction/connection, mirroring the Node backend where
  // this isn't wrapped in a single Prisma $transaction either. Under Postgres, a constraint
  // violation aborts the rest of whatever transaction it occurred in, so the fallback SELECT must
  // run in a fresh transaction, not the one that just failed.
  public SwipeResult swipe(String swiperId, String targetUserId, SwipeDirection direction) {
    safetyService.assertNotBlocked(swiperId, targetUserId);

    Swipe swipe =
        swipeRepository.findBySwiper_IdAndTarget_Id(swiperId, targetUserId).orElseGet(Swipe::new);
    swipe.setSwiper(userRepository.getReferenceById(swiperId));
    swipe.setTarget(userRepository.getReferenceById(targetUserId));
    swipe.setDirection(direction);
    swipeRepository.save(swipe);

    if (direction == SwipeDirection.LIKE || direction == SwipeDirection.SUPER_LIKE) {
      String likesKey = "user:" + swiperId + ":likes";
      redisTemplate.opsForSet().add(likesKey, targetUserId);
      redisTemplate.expire(likesKey, Duration.ofDays(90));

      boolean theyLikedMe =
          Boolean.TRUE.equals(redisTemplate.opsForSet().isMember("user:" + targetUserId + ":likes", swiperId));

      if (theyLikedMe) {
        List<String> sorted = Arrays.asList(swiperId, targetUserId);
        sorted.sort(String::compareTo);
        String userAId = sorted.get(0);
        String userBId = sorted.get(1);

        String matchId;
        try {
          Match match = new Match();
          match.setUserA(userRepository.getReferenceById(userAId));
          match.setUserB(userRepository.getReferenceById(userBId));
          matchId = matchRepository.save(match).getId();
        } catch (DataIntegrityViolationException e) {
          matchId =
              matchRepository
                  .findByUserA_IdAndUserB_Id(userAId, userBId)
                  .map(Match::getId)
                  .orElse(null);
        }

        if (matchId != null) {
          chatSessionRegistry.emitMatchNew(swiperId, targetUserId, matchId);
        }
        return new SwipeResult(true, matchId);
      }
    }

    return new SwipeResult(false, null);
  }

  @Transactional
  public Map<String, Object> sendTreat(String senderId, String targetUserId) {
    Wallet senderWallet =
        walletRepository.lockByUserId(senderId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    if (senderWallet.getBalance() < 1) {
      throw ApiException.unprocessable("INSUFFICIENT_BALANCE");
    }
    Wallet targetWallet =
        walletRepository.lockByUserId(targetUserId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));

    senderWallet.setBalance(senderWallet.getBalance() - 1);
    targetWallet.setBalance(targetWallet.getBalance() + 1);
    walletRepository.save(senderWallet);
    walletRepository.save(targetWallet);

    walletTransactionRepository.save(transaction(senderId, WalletTransactionType.DEBIT, 1, targetUserId));
    walletTransactionRepository.save(transaction(targetUserId, WalletTransactionType.CREDIT, 1, senderId));

    return Map.of("ok", true);
  }

  public List<MatchSummary> getMatches(String userId) {
    return matchRepository.findAllForUser(userId).stream()
        .map(
            match -> {
              String partnerId = match.getUserAId().equals(userId) ? match.getUserBId() : match.getUserAId();
              User partner = userRepository.findById(partnerId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
              MessageResponse lastMessage =
                  messageRepository.findTop1ByMatch_IdOrderByCreatedAtDesc(match.getId()).stream()
                      .findFirst()
                      .map(MessageResponse::from)
                      .orElse(null);
              String unreadRaw = redisTemplate.opsForValue().get("unread:" + match.getId() + ":" + userId);
              int unread = unreadRaw == null ? 0 : Integer.parseInt(unreadRaw);
              return new MatchSummary(
                  match.getId(), PartnerSummary.from(partner), lastMessage, unread, match.getCreatedAt());
            })
        .toList();
  }

  public MatchDetail getMatch(String matchId) {
    Match match = matchRepository.findById(matchId).orElseThrow(() -> ApiException.notFound("MATCH_NOT_FOUND"));
    User userA = userRepository.findById(match.getUserAId()).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    User userB = userRepository.findById(match.getUserBId()).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    List<MessageResponse> messages =
        messageRepository.findByMatch_IdOrderByCreatedAtDesc(matchId, PageRequest.of(0, 20)).stream()
            .map(MessageResponse::from)
            .toList();
    return new MatchDetail(match.getId(), PartnerSummary.from(userA), PartnerSummary.from(userB), messages, match.getCreatedAt(), null);
  }

  private WalletTransaction transaction(String userId, WalletTransactionType type, int amount, String relatedEntityId) {
    WalletTransaction tx = new WalletTransaction();
    tx.setUser(userRepository.getReferenceById(userId));
    tx.setType(type);
    tx.setAmount(amount);
    tx.setRelatedEntityId(relatedEntityId);
    return tx;
  }
}
