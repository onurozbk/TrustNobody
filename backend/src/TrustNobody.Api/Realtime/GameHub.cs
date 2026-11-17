using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TrustNobody.Api.Infrastructure;
using TrustNobody.Application.Abstractions;
using TrustNobody.Application.Games;

namespace TrustNobody.Api.Realtime;

/// <summary>
/// Canlı güncelleme kanalı. Sunucu sadece "changed" sinyali gönderir; istemci kendi görünümünü
/// GET /api/games/{code} ile çeker. Böylece gizli bilgiler asla yayın kanalından geçmez.
/// </summary>
[Authorize]
public sealed class GameHub(GameService games) : Hub
{
    public const string Path = "/hubs/game";
    public const string ChangedEvent = "changed";

    public static string GroupName(Guid gameId) => $"game:{gameId}";

    /// <summary>İstemci oyun ekranına girince çağırır; sadece oyun üyeleri gruba katılabilir.</summary>
    public async Task JoinGame(string code)
    {
        var gameId = await games.FindMembershipAsync(code, Context.User!.GetUserId())
                     ?? throw new HubException("Bu oyunun oyuncusu değilsin.");
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(gameId));
    }

    public async Task LeaveGame(string code)
    {
        var gameId = await games.FindMembershipAsync(code, Context.User!.GetUserId());
        if (gameId is not null) await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(gameId.Value));
    }
}

public sealed class SignalRGameNotifier(IHubContext<GameHub> hub) : IGameNotifier
{
    public Task GameChangedAsync(Guid gameId, CancellationToken ct = default) =>
        hub.Clients.Group(GameHub.GroupName(gameId)).SendAsync(GameHub.ChangedEvent, ct);
}
