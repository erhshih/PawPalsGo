using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PawPals.Api.Models;

public enum SwipeDirection { LIKE, PASS, SUPER_LIKE }
public enum MeetingStatus { SCHEDULED, CHECKING_IN, COMPLETED, CANCELLED_BENIGN, CANCELLED_PENALTY }
public enum WalletTransactionType { TOPUP, DEBIT, CREDIT, ESCROW, ESCROW_RELEASE }

[Table("Swipe")]
public class Swipe
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SwiperId { get; set; } = "";
    public string TargetId { get; set; } = "";
    public SwipeDirection Direction { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(SwiperId))] public User Swiper { get; set; } = null!;
    [ForeignKey(nameof(TargetId))] public User Target { get; set; } = null!;
}

[Table("Match")]
public class Match
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserAId { get; set; } = "";
    public string UserBId { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserAId))] public User UserA { get; set; } = null!;
    [ForeignKey(nameof(UserBId))] public User UserB { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = [];
}

[Table("Message")]
public class Message
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string MatchId { get; set; } = "";
    public string SenderId { get; set; } = "";
    public string Text { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(MatchId))] public Match Match { get; set; } = null!;
    [ForeignKey(nameof(SenderId))] public User Sender { get; set; } = null!;
}

[Table("Wallet")]
public class Wallet
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public int Balance { get; set; } = 0;

    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
}

[Table("WalletTransaction")]
public class WalletTransaction
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public WalletTransactionType Type { get; set; }
    public int Amount { get; set; }
    public string? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
}
