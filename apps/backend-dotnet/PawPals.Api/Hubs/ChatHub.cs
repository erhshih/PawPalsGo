using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace PawPals.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    public async Task JoinMatch(string matchId) =>
        await Groups.AddToGroupAsync(Context.ConnectionId, matchId);

    public async Task LeaveMatch(string matchId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, matchId);
}
