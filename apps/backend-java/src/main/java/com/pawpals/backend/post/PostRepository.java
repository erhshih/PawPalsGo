package com.pawpals.backend.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, String> {

  List<Post> findByAuthor_IdInOrderByCreatedAtDesc(List<String> authorIds);

  List<Post> findAllByOrderByCreatedAtDesc();
}
