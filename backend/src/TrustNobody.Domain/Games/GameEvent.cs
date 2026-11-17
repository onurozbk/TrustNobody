namespace TrustNobody.Domain.Games;

/// <summary>Oyun günlüğündeki bir duyuru. VisibleToPlayerId doluysa sadece o oyuncu görür.</summary>
public sealed class GameEvent
{
    private GameEvent() { } // EF

    internal GameEvent(Guid gameId, int round, GamePhase phase, string message, Guid? visibleToPlayerId, DateTime now)
    {
        GameId = gameId;
        Round = round;
        Phase = phase;
        Message = message;
        VisibleToPlayerId = visibleToPlayerId;
        CreatedAt = now;
    }

    public long Id { get; private set; }
    public Guid GameId { get; private set; }
    public int Round { get; private set; }
    public GamePhase Phase { get; private set; }
    public string Message { get; private set; } = "";
    public Guid? VisibleToPlayerId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public bool IsPrivate => VisibleToPlayerId is not null;
}
