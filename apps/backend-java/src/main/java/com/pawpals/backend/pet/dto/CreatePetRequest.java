package com.pawpals.backend.pet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record CreatePetRequest(
    @NotBlank String name,
    @NotBlank String breed,
    @NotBlank @Size(max = 140) String bio,
    @NotNull @Size(max = 5) List<String> tags,
    LocalDate birthDate) {}
