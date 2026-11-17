using Microsoft.EntityFrameworkCore;
using TrustNobody.Application.Abstractions;
using TrustNobody.Application.Games;
using TrustNobody.Domain.Games;
using TrustNobody.Domain.Users;

namespace TrustNobody.Infrastructure.Persistence;

internal sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> FindByLoginAsync(string normalizedLogin, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Email == normalizedLogin || u.NormalizedUsername == normalizedLogin, ct);

    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken ct = default) =>
        db.Users.AnyAsync(u => u.Email == normalizedEmail, ct);

    public Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default)
    {
        var normalized = User.Normalize(username);
        return db.Users.AnyAsync(u => u.NormalizedUsername == normalized, ct);
    }

    public void Add(User user) => db.Users.Add(user);
}

internal sealed class GameRepository(AppDbContext db) : IGameRepository
{
    public Task<Guid?> FindIdByCodeAsync(string code, CancellationToken ct = default) =>
        db.Games.Where(g => g.Code == code).Select(g => (Guid?)g.Id).FirstOrDefaultAsync(ct);

    public Task<Game?> GetAsync(Guid id, CancellationToken ct = default) =>
        db.Games
            .Include(g => g.Players)
            .Include(g => g.Actions)
            .Include(g => g.Events)
            .AsSplitQuery()
            .FirstOrDefaultAsync(g => g.Id == id, ct);

    public Task LockAsync(Guid id, CancellationToken ct = default) =>
        db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM games WHERE id = {id} FOR UPDATE", ct);

    public Task<bool> CodeExistsAsync(string code, CancellationToken ct = default) =>
        db.Games.AnyAsync(g => g.Code == code, ct);

    public void Add(Game game) => db.Games.Add(game);

    public async Task<IReadOnlyList<MyGameDto>> ListActiveForUserAsync(Guid userId, CancellationToken ct = default) =>
        await db.Games
            .AsNoTracking()
            .Where(g => g.Phase != GamePhase.Ended && g.Players.Any(p => p.UserId == userId))
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new MyGameDto(
                g.Code,
                g.Phase,
                g.Round,
                g.Players.Where(p => p.UserId == g.OwnerUserId).Select(p => p.Username).FirstOrDefault() ?? "",
                g.Players.Count,
                g.Settings.MaxPlayers,
                g.OwnerUserId == userId,
                g.CreatedAt))
            .Take(20)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Guid>> ListDueAsync(DateTime now, CancellationToken ct = default) =>
        await db.Games
            .Where(g => (g.Phase == GamePhase.Night || g.Phase == GamePhase.Day || g.Phase == GamePhase.Voting)
                        && g.PhaseEndsAt <= now)
            .Select(g => g.Id)
            .ToListAsync(ct);

    public Task<Guid?> FindMembershipAsync(string code, Guid userId, CancellationToken ct = default) =>
        db.Games
            .Where(g => g.Code == code && g.Players.Any(p => p.UserId == userId))
            .Select(g => (Guid?)g.Id)
            .FirstOrDefaultAsync(ct);
}

internal sealed class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> work, CancellationToken ct = default)
    {
        // Retry stratejisi açıkken kullanıcı transaction'ları execution strategy içinde çalışmalı.
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear(); // yeniden denemede temiz başla
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await work(ct);
            await tx.CommitAsync(ct);
        });
    }
}
