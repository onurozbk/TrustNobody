using TrustNobody.Application.Games;
using TrustNobody.Domain.Games;
using TrustNobody.Domain.Users;

namespace TrustNobody.Application.Abstractions;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Küçük harfe çevrilmiş e-posta ya da kullanıcı adıyla arar.</summary>
    Task<User?> FindByLoginAsync(string normalizedLogin, CancellationToken ct = default);

    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken ct = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default);
    void Add(User user);
}

public interface IGameRepository
{
    Task<Guid?> FindIdByCodeAsync(string code, CancellationToken ct = default);

    /// <summary>Oyunu oyuncular, hamleler ve duyurularla birlikte yükler.</summary>
    Task<Game?> GetAsync(Guid id, CancellationToken ct = default);

    /// <summary>Oyun satırını transaction sonuna kadar kilitler (SELECT ... FOR UPDATE).</summary>
    Task LockAsync(Guid id, CancellationToken ct = default);

    Task<bool> CodeExistsAsync(string code, CancellationToken ct = default);
    void Add(Game game);

    Task<IReadOnlyList<MyGameDto>> ListActiveForUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Aşama süresi dolmuş, devam eden oyunlar.</summary>
    Task<IReadOnlyList<Guid>> ListDueAsync(DateTime now, CancellationToken ct = default);

    /// <summary>Kullanıcı bu oyunun oyuncusuysa oyunun Id'si.</summary>
    Task<Guid?> FindMembershipAsync(string code, Guid userId, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken ct = default);

    /// <summary>İşi tek bir veritabanı transaction'ı içinde çalıştırır.</summary>
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> work, CancellationToken ct = default);
}

public interface IPasswordHasher
{
    string Hash(User user, string password);
    bool Verify(User user, string password);
}

public sealed record AccessToken(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    AccessToken Create(User user);
}

/// <summary>Oyun değiştiğinde oyunculara haber verir (SignalR vb.).</summary>
public interface IGameNotifier
{
    Task GameChangedAsync(Guid gameId, CancellationToken ct = default);
}
