package com.pawpals.backend.safety;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.safety.dto.BlockedEntry;
import com.pawpals.backend.safety.dto.CreateReportRequest;
import com.pawpals.backend.safety.dto.ReportResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SafetyController {

  private final SafetyService safetyService;

  @PostMapping("/blocks/{userId}")
  public void block(@PathVariable String userId, @AuthenticationPrincipal RequestUser user) {
    safetyService.block(user.userId(), userId);
  }

  @DeleteMapping("/blocks/{userId}")
  public void unblock(@PathVariable String userId, @AuthenticationPrincipal RequestUser user) {
    safetyService.unblock(user.userId(), userId);
  }

  @GetMapping("/blocks")
  public List<BlockedEntry> listBlocked(@AuthenticationPrincipal RequestUser user) {
    return safetyService.listBlocked(user.userId());
  }

  @PostMapping("/reports")
  public ReportResponse report(@Valid @RequestBody CreateReportRequest dto, @AuthenticationPrincipal RequestUser user) {
    return safetyService.report(user.userId(), dto);
  }

  @GetMapping("/reports/mine")
  public List<ReportResponse> listMyReports(@AuthenticationPrincipal RequestUser user) {
    return safetyService.listMyReports(user.userId());
  }
}
