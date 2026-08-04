package com.pawpals.backend.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostPhotoRepository extends JpaRepository<PostPhoto, String> {

  List<PostPhoto> findByPost_IdOrderBySortOrderAsc(String postId);

  int countByPost_Id(String postId);

  List<PostPhoto> findByPost_IdInOrderBySortOrderAsc(List<String> postIds);
}
