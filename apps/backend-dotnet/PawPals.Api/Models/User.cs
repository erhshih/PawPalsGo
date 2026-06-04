using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PawPals.Api.Models;

public enum UserRole { OWNER, LOVER }
public enum Gender { MALE, FEMALE, OTHER }

[Table("User")]
public class User
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public Gender? Gender { get; set; }
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public List<string> Interests { get; set; } = [];
    public string? Education { get; set; }
    public string? Zodiac { get; set; }
    public string? JobTitle { get; set; }
    public string? Company { get; set; }
    public string? School { get; set; }
    public string? City { get; set; }
    public int? Height { get; set; }
    public string? AvatarUrl { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Pet> Pets { get; set; } = [];
    public Wallet? Wallet { get; set; }
}
