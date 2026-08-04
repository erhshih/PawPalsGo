package com.pawpals.backend.dogmeetup;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.dogmeetup.dto.CreateMeetupRequest;
import com.pawpals.backend.dogmeetup.dto.JoinMeetupRequest;
import com.pawpals.backend.dogmeetup.dto.MeetupResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dog-meetups")
@RequiredArgsConstructor
public class DogMeetupsController {

  private final DogMeetupsService dogMeetupsService;

  @PostMapping
  public MeetupResponse create(@Valid @RequestBody CreateMeetupRequest dto, @AuthenticationPrincipal RequestUser user) {
    return dogMeetupsService.create(user.userId(), dto);
  }

  @GetMapping("/nearby")
  public List<MeetupResponse> getNearby(
      @AuthenticationPrincipal RequestUser user,
      @RequestParam(defaultValue = "10") int radius,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int limit) {
    return dogMeetupsService.getNearby(user.userId(), Math.min(radius, 50), page, limit);
  }

  @GetMapping("/{meetupId}")
  public MeetupResponse getOne(@PathVariable String meetupId) {
    return dogMeetupsService.getOne(meetupId);
  }

  @DeleteMapping("/{meetupId}")
  public MeetupResponse cancel(@PathVariable String meetupId, @AuthenticationPrincipal RequestUser user) {
    return dogMeetupsService.cancel(meetupId, user.userId());
  }

  @PostMapping("/{meetupId}/join")
  public void join(
      @PathVariable String meetupId, @RequestBody(required = false) JoinMeetupRequest dto, @AuthenticationPrincipal RequestUser user) {
    dogMeetupsService.join(meetupId, user.userId(), dto != null ? dto.petId() : null);
  }

  @DeleteMapping("/{meetupId}/leave")
  public void leave(@PathVariable String meetupId, @AuthenticationPrincipal RequestUser user) {
    dogMeetupsService.leave(meetupId, user.userId());
  }
}
