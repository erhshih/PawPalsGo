package com.pawpals.backend.pet.dto;

import com.pawpals.backend.pet.Photo;
import com.pawpals.backend.pet.PhotoKind;
import java.time.Instant;

public record PhotoResponse(String id, String petId, String url, PhotoKind kind, int sortOrder, Instant createdAt) {

  public static PhotoResponse from(Photo photo) {
    return new PhotoResponse(
        photo.getId(), photo.getPetId(), photo.getUrl(), photo.getKind(), photo.getSortOrder(), photo.getCreatedAt());
  }
}
