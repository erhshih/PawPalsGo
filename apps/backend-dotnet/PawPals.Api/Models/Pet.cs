using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PawPals.Api.Models;

public enum PhotoKind { closeup, owner, bw }

[Table("Pet")]
public class Pet
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OwnerId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Breed { get; set; } = "";
    public string Bio { get; set; } = "";
    public List<string> Tags { get; set; } = [];
    public DateTime? BirthDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(OwnerId))] public User Owner { get; set; } = null!;
    public ICollection<Photo> Photos { get; set; } = [];
}

[Table("Photo")]
public class Photo
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PetId { get; set; } = "";
    public string Url { get; set; } = "";
    public PhotoKind Kind { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(PetId))] public Pet Pet { get; set; } = null!;
}
