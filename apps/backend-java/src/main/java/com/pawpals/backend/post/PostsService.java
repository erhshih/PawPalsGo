package com.pawpals.backend.post;

import com.pawpals.backend.common.ApiException;
import com.pawpals.backend.config.AppProperties;
import com.pawpals.backend.discover.dto.MeResponse;
import com.pawpals.backend.pet.Pet;
import com.pawpals.backend.pet.PetRepository;
import com.pawpals.backend.post.dto.AuthorSummary;
import com.pawpals.backend.post.dto.CreatePostRequest;
import com.pawpals.backend.post.dto.PostCommentResponse;
import com.pawpals.backend.post.dto.PostPhotoResponse;
import com.pawpals.backend.post.dto.PostResponse;
import com.pawpals.backend.post.dto.TipRequest;
import com.pawpals.backend.post.dto.TipperEntry;
import com.pawpals.backend.user.User;
import com.pawpals.backend.user.UserRepository;
import com.pawpals.backend.wallet.WalletRepository;
import com.pawpals.backend.wallet.WalletTransaction;
import com.pawpals.backend.wallet.WalletTransactionRepository;
import com.pawpals.backend.wallet.WalletTransactionType;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PostsService {

  private static final int MAX_PHOTOS_PER_POST = 5;
  private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png");

  private final PostRepository postRepository;
  private final PostPhotoRepository postPhotoRepository;
  private final PostLikeRepository postLikeRepository;
  private final PostCommentRepository postCommentRepository;
  private final PostTipRepository postTipRepository;
  private final PetRepository petRepository;
  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final WalletTransactionRepository walletTransactionRepository;
  private final AppProperties appProperties;

  public PostResponse create(String authorId, CreatePostRequest dto) {
    Pet pet = null;
    if (dto.petId() != null) {
      pet = petRepository.findById(dto.petId()).orElse(null);
      if (pet == null || !pet.getOwnerId().equals(authorId)) {
        throw ApiException.forbidden("PET_NOT_OWNED");
      }
    }
    Post post = new Post();
    post.setAuthor(userRepository.getReferenceById(authorId));
    post.setPet(pet);
    post.setCaption(dto.caption());
    post = postRepository.save(post);
    return toResponse(post, List.of(), null);
  }

  public PostPhotoResponse addPhoto(String postId, String userId, MultipartFile file, int sortOrder) {
    Post post = postRepository.findById(postId).orElseThrow(() -> ApiException.notFound("POST_NOT_FOUND"));
    if (!post.getAuthorId().equals(userId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    if (postPhotoRepository.countByPost_Id(postId) >= MAX_PHOTOS_PER_POST) {
      throw ApiException.unprocessable("MAX_PHOTOS_REACHED");
    }
    if (file == null || file.isEmpty()) {
      throw ApiException.unprocessable("FILE_REQUIRED");
    }
    if (!ALLOWED_TYPES.contains(file.getContentType())) {
      throw ApiException.unprocessable("INVALID_FILE_TYPE");
    }

    String ext = extensionOf(file.getOriginalFilename());
    String filename = System.currentTimeMillis() + ext;
    Path dir = Path.of(appProperties.uploads().dir(), "posts", postId).toAbsolutePath();
    try {
      Files.createDirectories(dir);
      file.transferTo(dir.resolve(filename));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }

    PostPhoto photo = new PostPhoto();
    photo.setPost(post);
    photo.setUrl("/uploads/posts/" + postId + "/" + filename);
    photo.setSortOrder(sortOrder);
    return PostPhotoResponse.from(postPhotoRepository.save(photo));
  }

  public void delete(String postId, String userId) {
    Post post = postRepository.findById(postId).orElseThrow(() -> ApiException.notFound("POST_NOT_FOUND"));
    if (!post.getAuthorId().equals(userId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    postRepository.delete(post);
  }

  /** 配對前的探索層：只顯示附近使用者的貼文，不是全域動態牆。 */
  public List<PostResponse> getFeed(String userId, int radiusKm, int page, int limit) {
    User me = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
    if (me.getLatitude() == null || me.getLongitude() == null) {
      return List.of();
    }

    double radiusM = radiusKm * 1000.0;
    List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();

    record Scored(Post post, User author, double distanceM) {}

    List<Scored> withDistance =
        posts.stream()
            .map(p -> {
              User author = userRepository.findById(p.getAuthorId()).orElse(null);
              if (author == null || author.getLatitude() == null || author.getLongitude() == null) {
                return null;
              }
              double d =
                  haversineM(me.getLatitude(), me.getLongitude(), author.getLatitude(), author.getLongitude());
              return new Scored(p, author, d);
            })
            .filter(s -> s != null && s.distanceM() <= radiusM)
            .toList();

    int offset = Math.max(page - 1, 0) * limit;
    return withDistance.stream()
        .skip(offset)
        .limit(limit)
        .map(s -> toResponse(s.post(), photosOf(s.post().getId()), s.distanceM(), s.author()))
        .toList();
  }

  public PostResponse getOne(String postId) {
    Post post = postRepository.findById(postId).orElseThrow(() -> ApiException.notFound("POST_NOT_FOUND"));
    return toResponse(post, photosOf(postId), null);
  }

  public void like(String postId, String userId) {
    ensurePostExists(postId);
    if (postLikeRepository.findByPost_IdAndUser_Id(postId, userId).isEmpty()) {
      PostLike like = new PostLike();
      like.setPost(postRepository.getReferenceById(postId));
      like.setUser(userRepository.getReferenceById(userId));
      postLikeRepository.save(like);
    }
  }

  @Transactional
  public void unlike(String postId, String userId) {
    postLikeRepository.deleteByPost_IdAndUser_Id(postId, userId);
  }

  public PostCommentResponse addComment(String postId, String userId, String text) {
    ensurePostExists(postId);
    PostComment comment = new PostComment();
    comment.setPost(postRepository.getReferenceById(postId));
    comment.setAuthor(userRepository.getReferenceById(userId));
    comment.setText(text);
    return PostCommentResponse.from(postCommentRepository.save(comment));
  }

  public List<PostCommentResponse> getComments(String postId, int limit) {
    return postCommentRepository.findByPost_IdOrderByCreatedAtDesc(postId, PageRequest.of(0, limit)).stream()
        .map(PostCommentResponse::from)
        .toList();
  }

  /**
   * 抖內：肉乾只能花在「打賞貼文」這個定義好的用途，不能任意轉帳給其他使用者。
   * 唯一的額外效果是把贈送者加進 PostTip，讓貼文作者之後能查看贈送者的個人介紹（見 getTippers）。
   */
  @Transactional
  public String tip(String postId, String senderId, TipRequest dto) {
    if (Arrays.stream(TipRequest.ALLOWED_AMOUNTS).noneMatch(a -> a == dto.amount())) {
      throw ApiException.unprocessable("INVALID_AMOUNT");
    }
    Post post = postRepository.findById(postId).orElseThrow(() -> ApiException.notFound("POST_NOT_FOUND"));
    if (post.getAuthorId().equals(senderId)) {
      throw ApiException.forbidden("CANNOT_TIP_OWN_POST");
    }
    int amount = dto.amount();

    var senderWallet = walletRepository.lockByUserId(senderId).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));
    if (senderWallet.getBalance() < amount) {
      throw ApiException.unprocessable("INSUFFICIENT_BALANCE");
    }
    var recipientWallet =
        walletRepository.lockByUserId(post.getAuthorId()).orElseThrow(() -> ApiException.notFound("WALLET_NOT_FOUND"));

    senderWallet.setBalance(senderWallet.getBalance() - amount);
    recipientWallet.setBalance(recipientWallet.getBalance() + amount);
    walletRepository.save(senderWallet);
    walletRepository.save(recipientWallet);

    recordTransaction(senderId, WalletTransactionType.TIP_SENT, amount, postId);
    recordTransaction(post.getAuthorId(), WalletTransactionType.TIP_RECEIVED, amount, postId);

    PostTip tip = new PostTip();
    tip.setPost(post);
    tip.setSender(userRepository.getReferenceById(senderId));
    tip.setRecipient(post.getAuthor());
    tip.setAmount(amount);
    tip = postTipRepository.save(tip);
    return tip.getId();
  }

  /** 只有貼文作者可以看到「誰抖內了、他們的個人介紹長怎樣」。 */
  public List<TipperEntry> getTippers(String postId, String requesterId) {
    Post post = postRepository.findById(postId).orElseThrow(() -> ApiException.notFound("POST_NOT_FOUND"));
    if (!post.getAuthorId().equals(requesterId)) {
      throw ApiException.forbidden("FORBIDDEN");
    }
    return postTipRepository.findByPost_IdOrderByCreatedAtDesc(postId).stream()
        .map(t -> {
          User sender = userRepository.findById(t.getSenderId()).orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND"));
          return new TipperEntry(t.getAmount(), t.getCreatedAt(), MeResponse.from(sender));
        })
        .toList();
  }

  private void ensurePostExists(String postId) {
    if (!postRepository.existsById(postId)) {
      throw ApiException.notFound("POST_NOT_FOUND");
    }
  }

  private void recordTransaction(String userId, WalletTransactionType type, int amount, String relatedEntityId) {
    WalletTransaction tx = new WalletTransaction();
    tx.setUser(userRepository.getReferenceById(userId));
    tx.setType(type);
    tx.setAmount(amount);
    tx.setRelatedEntityId(relatedEntityId);
    walletTransactionRepository.save(tx);
  }

  private List<PostPhotoResponse> photosOf(String postId) {
    return postPhotoRepository.findByPost_IdOrderBySortOrderAsc(postId).stream().map(PostPhotoResponse::from).toList();
  }

  private PostResponse toResponse(Post post, List<PostPhotoResponse> photos, Double distanceM) {
    User author = userRepository.findById(post.getAuthorId()).orElse(null);
    return toResponse(post, photos, distanceM, author);
  }

  private PostResponse toResponse(Post post, List<PostPhotoResponse> photos, Double distanceM, User author) {
    long likeCount = postLikeRepository.countByPost_Id(post.getId());
    long commentCount = postCommentRepository.countByPost_Id(post.getId());
    long tipCount = postTipRepository.countByPost_Id(post.getId());
    AuthorSummary authorSummary = author != null ? AuthorSummary.from(author) : null;
    return new PostResponse(
        post.getId(),
        post.getAuthorId(),
        post.getPetId(),
        post.getCaption(),
        post.getCreatedAt(),
        photos,
        likeCount,
        commentCount,
        tipCount,
        authorSummary,
        distanceM);
  }

  private double haversineM(double lat1, double lon1, double lat2, double lon2) {
    double R = 6371000;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.pow(Math.sin(dLat / 2), 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private String extensionOf(String originalFilename) {
    if (originalFilename == null) return "";
    int dot = originalFilename.lastIndexOf('.');
    return dot >= 0 ? originalFilename.substring(dot) : "";
  }
}
