package com.pawpals.backend.meeting;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.meeting.dto.CreateMeetingRequest;
import com.pawpals.backend.meeting.dto.MeetingResponse;
import com.pawpals.backend.meeting.dto.VerifyRequest;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/meetings")
@RequiredArgsConstructor
public class MeetingController {

  private final MeetingService meetingService;

  @PostMapping
  public MeetingResponse create(@Valid @RequestBody CreateMeetingRequest dto, @AuthenticationPrincipal RequestUser user) {
    return meetingService.create(user.userId(), dto);
  }

  @DeleteMapping("/{id}")
  public MeetingResponse cancel(@PathVariable String id, @AuthenticationPrincipal RequestUser user) {
    return meetingService.cancel(id, user.userId());
  }

  @GetMapping("/{id}/qr")
  public Map<String, Object> getQr(@PathVariable String id, @AuthenticationPrincipal RequestUser user) {
    return meetingService.getQr(id, user.userId());
  }

  @PostMapping("/{id}/verify")
  public MeetingResponse verify(
      @PathVariable String id, @Valid @RequestBody VerifyRequest dto, @AuthenticationPrincipal RequestUser user) {
    return meetingService.verify(id, user.userId(), dto.token());
  }
}
