package com.pawpals.backend.post;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, String> {

  Optional<PostLike> findByPost_IdAndUser_Id(String postId, String userId);

  void deleteByPost_IdAndUser_Id(String postId, String userId);

  long countByPost_Id(String postId);
}
