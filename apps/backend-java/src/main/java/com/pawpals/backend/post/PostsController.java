package com.pawpals.backend.post;

import com.pawpals.backend.auth.RequestUser;
import com.pawpals.backend.post.dto.CreatePostRequest;
import com.pawpals.backend.post.dto.PostCommentRequest;
import com.pawpals.backend.post.dto.PostCommentResponse;
import com.pawpals.backend.post.dto.PostPhotoResponse;
import com.pawpals.backend.post.dto.PostResponse;
import com.pawpals.backend.post.dto.TipRequest;
import com.pawpals.backend.post.dto.TipResponse;
import com.pawpals.backend.post.dto.TipperEntry;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostsController {

  private final PostsService postsService;

  @PostMapping
  public PostResponse create(@Valid @RequestBody CreatePostRequest dto, @AuthenticationPrincipal RequestUser user) {
    return postsService.create(user.userId(), dto);
  }

  @GetMapping("/feed")
  public List<PostResponse> getFeed(
      @AuthenticationPrincipal RequestUser user,
      @RequestParam(defaultValue = "5") int radius,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int limit) {
    return postsService.getFeed(user.userId(), Math.min(radius, 50), page, limit);
  }

  @GetMapping("/{postId}")
  public PostResponse getOne(@PathVariable String postId) {
    return postsService.getOne(postId);
  }

  @DeleteMapping("/{postId}")
  public void delete(@PathVariable String postId, @AuthenticationPrincipal RequestUser user) {
    postsService.delete(postId, user.userId());
  }

  @PostMapping("/{postId}/photos")
  public PostPhotoResponse addPhoto(
      @PathVariable String postId,
      @AuthenticationPrincipal RequestUser user,
      @RequestPart("file") MultipartFile file,
      @RequestParam(defaultValue = "0") int sortOrder) {
    return postsService.addPhoto(postId, user.userId(), file, sortOrder);
  }

  @PostMapping("/{postId}/like")
  public void like(@PathVariable String postId, @AuthenticationPrincipal RequestUser user) {
    postsService.like(postId, user.userId());
  }

  @DeleteMapping("/{postId}/like")
  public void unlike(@PathVariable String postId, @AuthenticationPrincipal RequestUser user) {
    postsService.unlike(postId, user.userId());
  }

  @PostMapping("/{postId}/comments")
  public PostCommentResponse addComment(
      @PathVariable String postId, @Valid @RequestBody PostCommentRequest dto, @AuthenticationPrincipal RequestUser user) {
    return postsService.addComment(postId, user.userId(), dto.text());
  }

  @GetMapping("/{postId}/comments")
  public List<PostCommentResponse> getComments(
      @PathVariable String postId, @RequestParam(defaultValue = "20") int limit) {
    return postsService.getComments(postId, limit);
  }

  @PostMapping("/{postId}/tip")
  public TipResponse tip(
      @PathVariable String postId, @Valid @RequestBody TipRequest dto, @AuthenticationPrincipal RequestUser user) {
    String tipId = postsService.tip(postId, user.userId(), dto);
    return new TipResponse(true, tipId);
  }

  @GetMapping("/{postId}/tippers")
  public List<TipperEntry> getTippers(@PathVariable String postId, @AuthenticationPrincipal RequestUser user) {
    return postsService.getTippers(postId, user.userId());
  }
}
