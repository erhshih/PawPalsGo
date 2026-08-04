package com.pawpals.backend.post.dto;

import com.pawpals.backend.post.PostComment;
import java.time.Instant;

public record PostCommentResponse(String id, String postId, String authorId, String text, Instant createdAt) {

  public static PostCommentResponse from(PostComment c) {
    return new PostCommentResponse(c.getId(), c.getPostId(), c.getAuthorId(), c.getText(), c.getCreatedAt());
  }
}
