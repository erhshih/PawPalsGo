package com.pawpals.backend.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostTipRepository extends JpaRepository<PostTip, String> {

  List<PostTip> findByPost_IdOrderByCreatedAtDesc(String postId);

  long countByPost_Id(String postId);
}
