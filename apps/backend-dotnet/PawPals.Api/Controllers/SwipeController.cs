using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.Models;

namespace PawPals.Api.Controllers;

[ApiController]
[Authorize]
public class SwipeController(AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirst("sub")!.Value;

    [HttpPost("swipes")]
    public async Task<IActionResult> Swipe([FromBody] SwipeRequest req)
    {
        var existing = await db.Swipes.FirstOrDefaultAsync(s => s.SwiperId == UserId && s.TargetId == req.TargetUserId);
        if (existing != null) existing.Direction = req.Direction;
        else db.Swipes.Add(new Swipe { SwiperId = UserId, TargetId = req.TargetUserId, Direction = req.Direction });
        await db.SaveChangesAsync();

        if (req.Direction is SwipeDirection.LIKE or SwipeDirection.SUPER_LIKE)
        {
            var theyLikedMe = await db.Swipes.AnyAsync(s =>
                s.SwiperId == req.TargetUserId && s.TargetId == UserId &&
                s.Direction != SwipeDirection.PASS);

            if (theyLikedMe)
            {
                var ids = new[] { UserId, req.TargetUserId }.OrderBy(x => x).ToArray();
                var match = await db.Matches.FirstOrDefaultAsync(m => m.UserAId == ids[0] && m.UserBId == ids[1]);
                if (match == null)
                {
                    match = new Match { UserAId = ids[0], UserBId = ids[1] };
                    db.Matches.Add(match);
                    await db.SaveChangesAsync();
                }
                return Ok(new { matched = true, matchId = match.Id });
            }
        }
        return Ok(new { matched = false });
    }

    [HttpGet("matches")]
    public async Task<IActionResult> GetMatches()
    {
        var matches = await db.Matches
            .Where(m => m.UserAId == UserId || m.UserBId == UserId)
            .Include(m => m.UserA).ThenInclude(u => u.Pets).ThenInclude(p => p.Photos)
            .Include(m => m.UserB).ThenInclude(u => u.Pets).ThenInclude(p => p.Photos)
            .Include(m => m.Messages.OrderByDescending(msg => msg.CreatedAt).Take(1))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(matches.Select(m => new
        {
            m.Id,
            partner = m.UserAId == UserId ? new { m.UserB.Id, m.UserB.Email, m.UserB.Role, m.UserB.Pets } : new { m.UserA.Id, m.UserA.Email, m.UserA.Role, m.UserA.Pets },
            lastMessage = m.Messages.FirstOrDefault(),
            m.CreatedAt
        }));
    }

    [HttpGet("matches/{matchId}")]
    public async Task<IActionResult> GetMatch(string matchId)
    {
        var match = await db.Matches
            .Include(m => m.UserA)
            .Include(m => m.UserB)
            .Include(m => m.Messages.OrderByDescending(msg => msg.CreatedAt).Take(20))
            .FirstOrDefaultAsync(m => m.Id == matchId);
        if (match == null) return NotFound();
        return Ok(match);
    }
}

public record SwipeRequest(string TargetUserId, SwipeDirection Direction);
