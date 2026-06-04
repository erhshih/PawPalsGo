using Microsoft.EntityFrameworkCore;
using PawPals.Api.Models;

namespace PawPals.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Pet> Pets => Set<Pet>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<Swipe> Swipes => Set<Swipe>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasPostgresEnum<UserRole>("UserRole");
        b.HasPostgresEnum<Gender>("Gender");
        b.HasPostgresEnum<SwipeDirection>("SwipeDirection");
        b.HasPostgresEnum<WalletTransactionType>("WalletTransactionType");
        b.HasPostgresEnum<PhotoKind>("PhotoKind");

        b.Entity<User>(e =>
        {
            e.Property(u => u.Role).HasColumnName("role");
            e.Property(u => u.Gender).HasColumnName("gender");
            e.Property(u => u.Id).HasColumnName("id");
            e.Property(u => u.Email).HasColumnName("email");
            e.Property(u => u.PasswordHash).HasColumnName("passwordHash");
            e.Property(u => u.DisplayName).HasColumnName("displayName");
            e.Property(u => u.Bio).HasColumnName("bio");
            e.Property(u => u.Interests).HasColumnName("interests");
            e.Property(u => u.Education).HasColumnName("education");
            e.Property(u => u.Zodiac).HasColumnName("zodiac");
            e.Property(u => u.JobTitle).HasColumnName("jobTitle");
            e.Property(u => u.Company).HasColumnName("company");
            e.Property(u => u.School).HasColumnName("school");
            e.Property(u => u.City).HasColumnName("city");
            e.Property(u => u.Height).HasColumnName("height");
            e.Property(u => u.AvatarUrl).HasColumnName("avatarUrl");
            e.Property(u => u.Latitude).HasColumnName("latitude");
            e.Property(u => u.Longitude).HasColumnName("longitude");
            e.Property(u => u.CreatedAt).HasColumnName("createdAt");
            e.HasIndex(u => u.Email).IsUnique();
        });

        b.Entity<Pet>(e =>
        {
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.OwnerId).HasColumnName("ownerId");
            e.Property(p => p.Name).HasColumnName("name");
            e.Property(p => p.Breed).HasColumnName("breed");
            e.Property(p => p.Bio).HasColumnName("bio");
            e.Property(p => p.Tags).HasColumnName("tags");
            e.Property(p => p.BirthDate).HasColumnName("birthDate");
            e.Property(p => p.CreatedAt).HasColumnName("createdAt");
        });

        b.Entity<Photo>(e =>
        {
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.PetId).HasColumnName("petId");
            e.Property(p => p.Url).HasColumnName("url");
            e.Property(p => p.Kind).HasColumnName("kind");
            e.Property(p => p.SortOrder).HasColumnName("sortOrder");
            e.Property(p => p.CreatedAt).HasColumnName("createdAt");
        });

        b.Entity<Swipe>(e =>
        {
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.SwiperId).HasColumnName("swiperId");
            e.Property(s => s.TargetId).HasColumnName("targetId");
            e.Property(s => s.Direction).HasColumnName("direction");
            e.Property(s => s.CreatedAt).HasColumnName("createdAt");
            e.HasIndex(s => new { s.SwiperId, s.TargetId }).IsUnique();
        });

        b.Entity<Match>(e =>
        {
            e.Property(m => m.Id).HasColumnName("id");
            e.Property(m => m.UserAId).HasColumnName("userAId");
            e.Property(m => m.UserBId).HasColumnName("userBId");
            e.Property(m => m.CreatedAt).HasColumnName("createdAt");
            e.HasIndex(m => new { m.UserAId, m.UserBId }).IsUnique();
        });

        b.Entity<Message>(e =>
        {
            e.Property(m => m.Id).HasColumnName("id");
            e.Property(m => m.MatchId).HasColumnName("matchId");
            e.Property(m => m.SenderId).HasColumnName("senderId");
            e.Property(m => m.Text).HasColumnName("text");
            e.Property(m => m.CreatedAt).HasColumnName("createdAt");
        });

        b.Entity<Wallet>(e =>
        {
            e.Property(w => w.Id).HasColumnName("id");
            e.Property(w => w.UserId).HasColumnName("userId");
            e.Property(w => w.Balance).HasColumnName("balance");
            e.HasIndex(w => w.UserId).IsUnique();
        });

        b.Entity<WalletTransaction>(e =>
        {
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.UserId).HasColumnName("userId");
            e.Property(t => t.Type).HasColumnName("type");
            e.Property(t => t.Amount).HasColumnName("amount");
            e.Property(t => t.RelatedEntityId).HasColumnName("relatedEntityId");
            e.Property(t => t.CreatedAt).HasColumnName("createdAt");
        });
    }
}
