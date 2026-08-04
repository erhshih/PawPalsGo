package com.pawpals.backend.post.dto;

import com.pawpals.backend.post.PostPhoto;
import java.time.Instant;

public record PostPhotoResponse(String id, String postId, String url, int sortOrder, Instant createdAt) {

  public static PostPhotoResponse from(PostPhoto p) {
    return new PostPhotoResponse(p.getId(), p.getPostId(), p.getUrl(), p.getSortOrder(), p.getCreatedAt());
  }
}
