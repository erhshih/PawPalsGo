using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.Hubs;
using PawPals.Api.Models;

namespace PawPals.Api.Controllers;

[ApiController]
[Route("matches/{matchId}")]
[Authorize]
public class ChatController(AppDbContext db, IHubContext<ChatHub> hub) : ControllerBase
{
    private string UserId => User.FindFirst("sub")!.Value;

    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages(string matchId, [FromQuery] int limit = 50)
    {
        var messages = await db.Messages
            .Where(m => m.MatchId == matchId)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
        return Ok(messages);
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage(string matchId, [FromBody] SendMessageRequest req)
    {
        var message = new Message { MatchId = matchId, SenderId = UserId, Text = req.Text };
        db.Messages.Add(message);
        await db.SaveChangesAsync();
        await hub.Clients.Group(matchId).SendAsync("message:new", message);
        return Ok(message);
    }
}

public record SendMessageRequest(string Text);
