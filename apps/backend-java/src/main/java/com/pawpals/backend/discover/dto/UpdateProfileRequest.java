package com.pawpals.backend.discover.dto;

import com.pawpals.backend.user.Gender;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateProfileRequest(
    @Size(max = 30) String displayName,
    Gender gender,
    @Size(max = 300) String bio,
    @Size(max = 10) List<String> interests,
    @Size(max = 50) String education,
    @Size(max = 20) String zodiac,
    @Size(max = 50) String jobTitle,
    @Size(max = 50) String company,
    @Size(max = 50) String school,
    @Size(max = 50) String city,
    @Min(100) @Max(250) Integer height) {}
