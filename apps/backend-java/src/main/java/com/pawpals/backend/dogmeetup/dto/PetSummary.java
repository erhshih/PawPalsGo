package com.pawpals.backend.dogmeetup.dto;

import com.pawpals.backend.pet.Pet;

public record PetSummary(String id, String name, String breed) {

  public static PetSummary from(Pet p) {
    return new PetSummary(p.getId(), p.getName(), p.getBreed());
  }
}
