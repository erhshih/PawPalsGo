package com.pawpals.backend.pet.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record UpdatePetRequest(
    String name, String breed, @Size(max = 140) String bio, @Size(max = 5) List<String> tags, LocalDate birthDate) {}
