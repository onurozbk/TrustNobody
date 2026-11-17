namespace TrustNobody.Domain.Games;

/// <summary>Bir oyuncunun bir turdaki hamlesi (gece aksiyonu, oy, "hazırım").</summary>
public sealed class GameAction
{
    private GameAction() { } // EF

    internal GameAction(Guid gameId, int round, ActionType type, Guid actorId, Guid? targetId, DateTime now)
    {
        Id = Guid.CreateVersion7();
        GameId = gameId;
        Round = round;
        Type = type;
        ActorId = actorId;
        TargetId = targetId;
        CreatedAt = now;
    }

    public Guid Id { get; private set; }
    public Guid GameId { get; private set; }
    public int Round { get; private set; }
    public ActionType Type { get; private set; }

    /// <summary>Hamleyi yapan <see cref="GamePlayer"/> Id'si.</summary>
    public Guid ActorId { get; private set; }

    /// <summary>Hedef oyuncu. null = oylamada "pas".</summary>
    public Guid? TargetId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    internal void ChangeTarget(Guid? targetId, DateTime now)
    {
        TargetId = targetId;
        CreatedAt = now;
    }
}
