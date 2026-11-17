namespace TrustNobody.Domain.Games;

public sealed class GamePlayer
{
    private GamePlayer() { } // EF

    internal GamePlayer(Guid gameId, Guid userId, string username, int seat, DateTime now)
    {
        Id = Guid.CreateVersion7();
        GameId = gameId;
        UserId = userId;
        Username = username;
        Seat = seat;
        JoinedAt = now;
    }

    public Guid Id { get; private set; }
    public Guid GameId { get; private set; }
    public Guid UserId { get; private set; }

    /// <summary>Katılım anındaki kullanıcı adı (oyun mesajları için kopyalanır).</summary>
    public string Username { get; private set; } = "";

    public int Seat { get; private set; }
    public Role Role { get; private set; } = Role.None;
    public bool IsAlive { get; private set; } = true;
    public int? DiedInRound { get; private set; }
    public string? DeathCause { get; private set; }
    public DateTime JoinedAt { get; private set; }

    public bool IsVampire => Role == Role.Vampire;

    internal void AssignRole(Role role)
    {
        Role = role;
        IsAlive = true;
        DiedInRound = null;
        DeathCause = null;
    }

    internal void Kill(int round, string cause)
    {
        IsAlive = false;
        DiedInRound = round;
        DeathCause = cause;
    }

    internal void Reset() => AssignRole(Role.None);
}
