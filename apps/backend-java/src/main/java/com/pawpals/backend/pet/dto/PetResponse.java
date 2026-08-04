package com.pawpals.backend.pet.dto;

import com.pawpals.backend.pet.Pet;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record PetResponse(
    String id,
    String ownerId,
    String name,
    String breed,
    String bio,
    List<String> tags,
    LocalDate birthDate,
    Instant createdAt,
    List<PhotoResponse> photos) {

  public static PetResponse from(Pet pet, List<PhotoResponse> photos) {
    return new PetResponse(
        pet.getId(),
        pet.getOwnerId(),
        pet.getName(),
        pet.getBreed(),
        pet.getBio(),
        pet.getTags(),
        pet.getBirthDate(),
        pet.getCreatedAt(),
        photos);
  }
}
