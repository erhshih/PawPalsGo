package com.pawpals.backend.discover;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.chat.MessageRepository;
import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.discover.dto.MeResponse;
import com.pawpals.backend.discover.dto.NearbyResult;
import com.pawpals.backend.discover.dto.StatsResponse;
import com.pawpals.backend.discover.dto.UpdateLocationRequest;
import com.pawpals.backend.discover.dto.UpdateProfileRequest;
import com.pawpals.backend.swipe.MatchRepository;
import com.pawpals.backend.user.Gender;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.user.UserRole;
import jakarta.validation.Valid;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class DiscoverController {

  private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of("image/jpeg", "image/png");
  private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024;
  private static final Set<Gender> ALLOWED_GENDERS = Set.of(Gender.MALE, Gender.FEMALE, Gender.OTHER);
  private static final Set<UserRole> ALLOWED_ROLES = Set.of(UserRole.OWNER, UserRole.LOVER);

  private final DiscoverService discoverService;
  private final UserRepository userRepository;
  private final MatchRepository matchRepository;
  private final MessageRepository messageRepository;
  private final AppProperties appProperties;

  @GetMapping("/users/me")
  public MeResponse getMe(@AuthenticationPrincipal RequestUser user) {
    return MeResponse.from(requireUser(user.userId()));
  }

  @PatchMapping("/users/me")
  public MeResponse updateMe(@AuthenticationPrincipal RequestUser user, @Valid @RequestBody UpdateProfileRequest dto) {
    User entity = requireUser(user.userId());
    if (dto.displayName() != null) entity.setDisplayName(dto.displayName());
    if (dto.gender() != null) entity.setGender(dto.gender());
    if (dto.bio() != null) entity.setBio(dto.bio());
    if (dto.interests() != null) entity.setInterests(dto.interests());
    if (dto.education() != null) entity.setEducation(dto.education());
    if (dto.zodiac() != null) entity.setZodiac(dto.zodiac());
    if (dto.jobTitle() != null) entity.setJobTitle(dto.jobTitle());
    if (dto.company() != null) entity.setCompany(dto.company());
    if (dto.school() != null) entity.setSchool(dto.school());
    if (dto.city() != null) entity.setCity(dto.city());
    if (dto.height() != null) entity.setHeight(dto.height());
    return MeResponse.from(userRepository.save(entity));
  }

  @PostMapping("/users/me/avatar")
  public Map<String, Object> uploadAvatar(
      @AuthenticationPrincipal RequestUser user, @RequestPart("file") MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw ApiException.unprocessable("FILE_REQUIRED");
    }
    if (!ALLOWED_AVATAR_TYPES.contains(file.getContentType())) {
      throw ApiException.unprocessable("INVALID_FILE_TYPE");
    }
    if (file.getSize() > MAX_AVATAR_SIZE) {
      throw ApiException.unprocessable("FILE_TOO_LARGE");
    }

    String ext = extensionOf(file.getOriginalFilename());
    String filename = java.util.UUID.randomUUID() + ext;
    Path dir = Path.of(appProperties.uploads().dir(), "avatars").toAbsolutePath();
    try {
      Files.createDirectories(dir);
      file.transferTo(dir.resolve(filename));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }

    String relativePath = "/uploads/avatars/" + filename;
    User entity = requireUser(user.userId());
    entity.setAvatarUrl(relativePath);
    userRepository.save(entity);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("avatarUrl", relativePath);
    return body;
  }

  @GetMapping("/users/me/stats")
  public StatsResponse getMyStats(@AuthenticationPrincipal RequestUser user) {
    long matches = matchRepository.countAllForUser(user.userId());
    long messages = messageRepository.countBySender_Id(user.userId());
    return new StatsResponse(matches, messages);
  }

  @PatchMapping("/users/me/location")
  public Map<String, Object> updateLocation(
      @Valid @RequestBody UpdateLocationRequest dto, @AuthenticationPrincipal RequestUser user) {
    discoverService.updateLocation(user.userId(), dto.lat(), dto.lng());
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("ok", true);
    return body;
  }

  @GetMapping("/discover")
  public List<NearbyResult> findNearby(
      @AuthenticationPrincipal RequestUser user,
      @RequestParam(defaultValue = "5") int radius,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int limit,
      @RequestParam(required = false) String gender,
      @RequestParam(required = false) String roleFilter) {
    List<Gender> genderFilter =
        gender == null
            ? List.of()
            : Arrays.stream(gender.split(","))
                .map(String::trim)
                .filter(g -> ALLOWED_GENDERS.stream().anyMatch(ag -> ag.name().equals(g)))
                .map(Gender::valueOf)
                .toList();

    UserRole safeRoleFilter =
        roleFilter != null && ALLOWED_ROLES.stream().anyMatch(r -> r.name().equals(roleFilter))
            ? UserRole.valueOf(roleFilter)
            : null;

    return discoverService.findNearby(user.userId(), Math.min(radius, 50), page, limit, genderFilter, safeRoleFilter);
  }

  private User requireUser(String userId) {
    return userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
  }

  private String extensionOf(String originalFilename) {
    if (originalFilename == null) return "";
    int dot = originalFilename.lastIndexOf('.');
    return dot >= 0 ? originalFilename.substring(dot) : "";
  }
}
