using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.Models;

namespace PawPals.Api.Controllers;

[ApiController]
[Route("wallet")]
[Authorize]
public class WalletController(AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirst("sub")!.Value;

    private static readonly Dictionary<string, int> Packages = new()
    {
        { "small", 100 }, { "medium", 300 }, { "large", 800 }
    };

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var wallet = await db.Wallets.FirstOrDefaultAsync(w => w.UserId == UserId);
        if (wallet == null) return NotFound(new { message = "WALLET_NOT_FOUND" });
        return Ok(new { wallet.Balance, currency = "肉乾" });
    }

    [HttpPost("topup")]
    public async Task<IActionResult> Topup([FromBody] TopupRequest req)
    {
        if (!Packages.TryGetValue(req.PackageId, out var amount))
            return UnprocessableEntity(new { message = "INVALID_PACKAGE" });

        await using var tx = await db.Database.BeginTransactionAsync();
        var wallet = await db.Wallets.FirstOrDefaultAsync(w => w.UserId == UserId);
        if (wallet == null) return NotFound();
        wallet.Balance += amount;
        db.WalletTransactions.Add(new WalletTransaction { UserId = UserId, Type = WalletTransactionType.TOPUP, Amount = amount, RelatedEntityId = req.PackageId });
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok(new { wallet.Balance, currency = "肉乾" });
    }
}

public record TopupRequest(string PackageId);
