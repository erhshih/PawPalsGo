package com.pawpals.backend.wallet;

import java.util.List;

/** Mirrors {@code WALLET_PACKAGES} in packages/shared/src/types.ts. */
public final class WalletPackages {

  public record Package(String id, int jerky, String price) {}

  public static final List<Package> ALL =
      List.of(
          new Package("pack_30", 30, "NT$ 90"),
          new Package("pack_100", 100, "NT$ 270"),
          new Package("pack_300", 300, "NT$ 690"));

  private WalletPackages() {}

  public static Package find(String id) {
    return ALL.stream().filter(p -> p.id().equals(id)).findFirst().orElse(null);
  }
}
