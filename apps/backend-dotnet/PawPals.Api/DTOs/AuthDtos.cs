using System.ComponentModel.DataAnnotations;
using PawPals.Api.Models;

namespace PawPals.Api.DTOs;

public record RegisterDto(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required] UserRole Role,
    Gender? Gender
);

public record LoginDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record TokenResponse(string AccessToken, string RefreshToken, string UserId, string Role);

public record UpdateProfileDto(
    string? DisplayName,
    string? Bio,
    Gender? Gender,
    List<string>? Interests,
    string? Education,
    string? Zodiac,
    string? JobTitle,
    string? Company,
    string? School,
    string? City,
    int? Height
);

public record UpdateLocationDto(
    [Required] double Lat,
    [Required] double Lng
);
