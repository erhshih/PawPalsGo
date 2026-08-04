package com.pawpals.backend.safety;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.post.PostRepository;
import com.pawpals.backend.safety.dto.BlockedEntry;
import com.pawpals.backend.safety.dto.BlockedUserSummary;
import com.pawpals.backend.safety.dto.CreateReportRequest;
import com.pawpals.backend.safety.dto.ReportResponse;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SafetyService {

  private final BlockRepository blockRepository;
  private final ReportRepository reportRepository;
  private final UserRepository userRepository;
  private final PostRepository postRepository;

  public void block(String blockerId, String blockedId) {
    if (blockerId.equals(blockedId)) {
      throw ApiException.badRequest("CANNOT_BLOCK_SELF");
    }
    Block block = blockRepository.findByBlocker_IdAndBlocked_Id(blockerId, blockedId).orElseGet(Block::new);
    block.setBlocker(userRepository.getReferenceById(blockerId));
    block.setBlocked(userRepository.getReferenceById(blockedId));
    blockRepository.save(block);
  }

  @Transactional
  public void unblock(String blockerId, String blockedId) {
    blockRepository.deleteByBlocker_IdAndBlocked_Id(blockerId, blockedId);
  }

  public List<BlockedEntry> listBlocked(String blockerId) {
    return blockRepository.findByBlocker_IdOrderByCreatedAtDesc(blockerId).stream()
        .map(b -> {
          User blocked = userRepository.findById(b.getBlockedId()).orElse(null);
          return new BlockedEntry(b.getCreatedAt(), blocked != null ? BlockedUserSummary.from(blocked) : null);
        })
        .toList();
  }

  public ReportResponse report(String reporterId, CreateReportRequest dto) {
    if (reporterId.equals(dto.targetId())) {
      throw ApiException.badRequest("CANNOT_REPORT_SELF");
    }
    if (dto.postId() != null && !postRepository.existsById(dto.postId())) {
      throw ApiException.badRequest("POST_NOT_FOUND");
    }
    Report report = new Report();
    report.setReporter(userRepository.getReferenceById(reporterId));
    report.setTarget(userRepository.getReferenceById(dto.targetId()));
    report.setReason(dto.reason());
    report.setDetail(dto.detail());
    if (dto.postId() != null) {
      report.setPost(postRepository.getReferenceById(dto.postId()));
    }
    return ReportResponse.from(reportRepository.save(report));
  }

  public List<ReportResponse> listMyReports(String reporterId) {
    return reportRepository.findByReporter_IdOrderByCreatedAtDesc(reporterId).stream().map(ReportResponse::from).toList();
  }

  /** 用來過濾 discover/feed/nearby 這種「候選人清單」的排除名單，雙向都算。 */
  public Set<String> getBlockedUserIds(String userId) {
    Set<String> ids = new LinkedHashSet<>();
    for (Block b : blockRepository.findAllInvolving(userId)) {
      ids.add(b.getBlockerId().equals(userId) ? b.getBlockedId() : b.getBlockerId());
    }
    return ids;
  }

  /** 用來擋掉「已經有一方封鎖對方」的互動（滑卡片、傳訊息），雙向都算。 */
  public void assertNotBlocked(String userIdA, String userIdB) {
    if (blockRepository.findBetween(userIdA, userIdB).isPresent()) {
      throw ApiException.forbidden("USER_BLOCKED");
    }
  }
}
