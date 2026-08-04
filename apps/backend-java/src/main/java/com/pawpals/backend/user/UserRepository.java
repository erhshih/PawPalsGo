package com.pawpals.backend.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, String> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  @Query("select u from User u where u.id <> :userId and u.latitude is not null and u.longitude is not null")
  List<User> findGeolocatedCandidates(@Param("userId") String userId);
}
