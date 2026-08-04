package com.pawpals.backend.post;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostCommentRepository extends JpaRepository<PostComment, String> {

  List<PostComment> findByPost_IdOrderByCreatedAtDesc(String postId, Pageable pageable);

  long countByPost_Id(String postId);
}
