package com.pawpals.backend.post.dto;

import jakarta.validation.constraints.NotNull;

public record TipRequest(@NotNull Integer amount) {

  // 固定分級（1/5/10/50 肉乾），避免任意金額造成的異常交易或誤觸。實際檢查在 PostsService。
  public static final int[] ALLOWED_AMOUNTS = {1, 5, 10, 50};
}
