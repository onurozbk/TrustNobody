using TrustNobody.Application.Abstractions;
using TrustNobody.Domain.Common;
using TrustNobody.Domain.Games;

namespace TrustNobody.Application.Games;

/// <summary>
/// Oyun kullanım senaryoları. Her değişiklik: transaction aç → oyun satırını kilitle → yükle →
/// domain metodunu çağır → kaydet → oyunculara bildir.
/// </summary>
public sealed class GameService(
    IGameRepository games,
    IUserRepository users,
    IUnitOfWork uow,
    IGameNotifier notifier,
    IRandomizer random,
    TimeProvider clock)
{
    private const string CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // karışan karakterler (0/O, 1/I) yok

    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    public static string NormalizeCode(string code) => (code ?? "").Trim().ToUpperInvariant();

    // ───────────────────────────── Sorgular ─────────────────────────────

    public async Task<GameView> GetViewAsync(string code, Guid userId, CancellationToken ct = default)
    {
        var game = await LoadAsync(await ResolveIdAsync(code, ct), ct);
        var me = game.RequireMember(userId);
        return GameViewBuilder.Build(game, me, Now);
    }

    public Task<IReadOnlyList<MyGameDto>> ListMineAsync(Guid userId, CancellationToken ct = default) =>
        games.ListActiveForUserAsync(userId, ct);

    public Task<Guid?> FindMembershipAsync(string code, Guid userId, CancellationToken ct = default) =>
        games.FindMembershipAsync(NormalizeCode(code), userId, ct);

    // ───────────────────────────── Komutlar ─────────────────────────────

    public async Task<CreateGameResponse> CreateAsync(Guid userId, GameSettingsDto settings, CancellationToken ct = default)
    {
        var user = await users.GetByIdAsync(userId, ct) ?? throw DomainException.Unauthorized("Kullanıcı bulunamadı.");

        string code;
        do code = GenerateCode();
        while (await games.CodeExistsAsync(code, ct));

        var game = Game.Create(code, user.Id, user.Username, settings.ToDomain(), Now);
        games.Add(game);
        await uow.SaveChangesAsync(ct);
        return new CreateGameResponse(code);
    }

    public async Task<CreateGameResponse> JoinAsync(string code, Guid userId, CancellationToken ct = default)
    {
        var user = await users.GetByIdAsync(userId, ct) ?? throw DomainException.Unauthorized("Kullanıcı bulunamadı.");
        await MutateAsync(code, (g, now) => g.Join(user.Id, user.Username, now), ct);
        return new CreateGameResponse(NormalizeCode(code));
    }

    public Task LeaveAsync(string code, Guid userId, CancellationToken ct = default) =>
        MutateAsync(code, (g, _) => g.Leave(userId), ct);

    public Task UpdateSettingsAsync(string code, Guid userId, GameSettingsDto settings, CancellationToken ct = default) =>
        MutateAsync(code, (g, _) => g.UpdateSettings(userId, settings.ToDomain()), ct);

    public Task KickAsync(string code, Guid userId, Guid playerId, CancellationToken ct = default) =>
        MutateAsync(code, (g, now) => g.Kick(userId, playerId, random, now), ct);

    public Task StartAsync(string code, Guid userId, CancellationToken ct = default) =>
        MutateAsync(code, (g, now) => g.Start(userId, random, now), ct);

    public Task AbortAsync(string code, Guid userId, CancellationToken ct = default) =>
        MutateAsync(code, (g, now) => g.Abort(userId, now), ct);

    public Task RematchAsync(string code, Guid userId, CancellationToken ct = default) =>
        MutateAsync(code, (g, _) => g.Rematch(userId), ct);

    public Task SubmitActionAsync(string code, Guid userId, Guid? targetId, CancellationToken ct = default) =>
        MutateAsync(code, (g, now) => g.SubmitAction(userId, targetId, random, now), ct);

    public Task ToggleReadyAsync(string code, Guid userId, CancellationToken ct = default) =>
        MutateAsync(code, (g, now) => g.ToggleReady(userId, random, now), ct);

    /// <summary>Arka plan servisi için: süresi dolan aşamayı ilerletir.</summary>
    public async Task AdvanceIfDueAsync(Guid gameId, CancellationToken ct = default)
    {
        var changed = false;
        await uow.ExecuteInTransactionAsync(async t =>
        {
            await games.LockAsync(gameId, t);
            var game = await LoadAsync(gameId, t);
            changed = game.AdvanceIfDue(random, Now);
            if (changed) await uow.SaveChangesAsync(t);
        }, ct);

        if (changed) await notifier.GameChangedAsync(gameId, ct);
    }

    public Task<IReadOnlyList<Guid>> ListDueAsync(CancellationToken ct = default) => games.ListDueAsync(Now, ct);

    // ───────────────────────────── Yardımcılar ─────────────────────────────

    private async Task MutateAsync(string code, Action<Game, DateTime> change, CancellationToken ct)
    {
        var id = await ResolveIdAsync(code, ct);
        await uow.ExecuteInTransactionAsync(async t =>
        {
            await games.LockAsync(id, t);
            var game = await LoadAsync(id, t);
            change(game, Now);
            await uow.SaveChangesAsync(t);
        }, ct);
        await notifier.GameChangedAsync(id, ct);
    }

    private async Task<Guid> ResolveIdAsync(string code, CancellationToken ct) =>
        await games.FindIdByCodeAsync(NormalizeCode(code), ct) ?? throw DomainException.NotFound("Oyun bulunamadı.");

    private async Task<Game> LoadAsync(Guid id, CancellationToken ct) =>
        await games.GetAsync(id, ct) ?? throw DomainException.NotFound("Oyun bulunamadı.");

    private string GenerateCode() =>
        string.Create(Game.CodeLength, random, (span, rng) =>
        {
            for (var i = 0; i < span.Length; i++) span[i] = CodeChars[rng.Next(CodeChars.Length)];
        });
}
