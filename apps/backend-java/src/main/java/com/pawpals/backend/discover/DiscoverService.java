package com.pawpals.backend.discover;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.discover.dto.NearbyResult;
import com.pawpals.backend.discover.dto.UserCardResponse;
import com.pawpals.backend.safety.SafetyService;
import com.pawpals.backend.swipe.SwipeRepository;
import com.pawpals.backend.user.Gender;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.user.UserRole;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiscoverService {

  private final UserRepository userRepository;
  private final SwipeRepository swipeRepository;
  private final AppProperties appProperties;
  private final SafetyService safetyService;

  public void updateLocation(String userId, double lat, double lng) {
    User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    user.setLatitude(lat);
    user.setLongitude(lng);
    userRepository.save(user);
  }

  public List<NearbyResult> findNearby(
      String userId, int radiusKm, int page, int limit, List<Gender> genderFilter, UserRole roleFilter) {
    User me = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    if (me.getLatitude() == null || me.getLongitude() == null) {
      return List.of();
    }

    Instant passExpiry = Instant.now().minus(appProperties.passExpiryMinutes(), ChronoUnit.MINUTES);
    Set<String> excludedIds = new HashSet<>(swipeRepository.findActiveSwipedTargetIds(userId, passExpiry));
    excludedIds.addAll(safetyService.getBlockedUserIds(userId));

    double radiusM = radiusKm * 1000.0;
    List<User> candidates = userRepository.findGeolocatedCandidates(userId);

    record Scored(User user, double distanceM) {}

    return candidates.stream()
        .filter(u -> !excludedIds.contains(u.getId()))
        .filter(u -> genderFilter.isEmpty() || genderFilter.size() >= 3 || genderFilter.contains(u.getGender()))
        .filter(u -> roleFilter == null || roleFilter == u.getRole())
        .map(u -> new Scored(u, haversineMeters(me.getLatitude(), me.getLongitude(), u.getLatitude(), u.getLongitude())))
        .filter(s -> s.distanceM() <= radiusM)
        .sorted(Comparator.comparingDouble(Scored::distanceM))
        .skip((long) Math.max(page - 1, 0) * limit)
        .limit(limit)
        .map(s -> new NearbyResult(UserCardResponse.from(s.user()), s.distanceM()))
        .toList();
  }

  private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
    double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.pow(Math.sin(dLat / 2), 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
