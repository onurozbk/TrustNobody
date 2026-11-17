using System.Security.Claims;
using TrustNobody.Api.Infrastructure;
using TrustNobody.Application.Games;

namespace TrustNobody.Api.Endpoints;

public static class GameEndpoints
{
    public static IEndpointRouteBuilder MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/games").WithTags("Games").RequireAuthorization();

        // Oda oluştur: oluşturan kişi yönetici olur (ama herkes gibi oynar)
        g.MapPost("/", (GameSettingsDto settings, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
            games.CreateAsync(user.GetUserId(), settings, ct));

        // Dahil olduğum, bitmemiş oyunlar
        g.MapGet("/mine", (ClaimsPrincipal user, GameService games, CancellationToken ct) =>
            games.ListMineAsync(user.GetUserId(), ct));

        // Oyunun bana özel görünümü
        g.MapGet("/{code}", (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
            games.GetViewAsync(code, user.GetUserId(), ct));

        // Davet linki / oda koduyla katıl
        g.MapPost("/{code}/join", (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
            games.JoinAsync(code, user.GetUserId(), ct));

        g.MapPost("/{code}/leave", async (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.LeaveAsync(code, user.GetUserId(), ct);
            return Results.NoContent();
        });

        // Gece hamlesi ya da oy. targetId = null → pas
        g.MapPost("/{code}/action", async (string code, ActionRequest req, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.SubmitActionAsync(code, user.GetUserId(), req.TargetId, ct);
            return Results.NoContent();
        });

        // Gündüz "oylamaya hazırım" (aç/kapa)
        g.MapPost("/{code}/ready", async (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.ToggleReadyAsync(code, user.GetUserId(), ct);
            return Results.NoContent();
        });

        // ── Yönetici ── (yetki kontrolü domain'de)
        // Not: Yönetici de oyuncu olduğu için aşamayı elle geçiremez; aşamalar otomatik ilerler.

        g.MapPut("/{code}/settings", async (string code, GameSettingsDto settings, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.UpdateSettingsAsync(code, user.GetUserId(), settings, ct);
            return Results.NoContent();
        });

        g.MapPost("/{code}/kick/{playerId:guid}", async (string code, Guid playerId, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.KickAsync(code, user.GetUserId(), playerId, ct);
            return Results.NoContent();
        });

        g.MapPost("/{code}/start", async (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.StartAsync(code, user.GetUserId(), ct);
            return Results.NoContent();
        });

        g.MapPost("/{code}/abort", async (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.AbortAsync(code, user.GetUserId(), ct);
            return Results.NoContent();
        });

        g.MapPost("/{code}/rematch", async (string code, ClaimsPrincipal user, GameService games, CancellationToken ct) =>
        {
            await games.RematchAsync(code, user.GetUserId(), ct);
            return Results.NoContent();
        });

        return app;
    }
}
