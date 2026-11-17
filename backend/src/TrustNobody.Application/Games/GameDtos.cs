using TrustNobody.Domain.Games;

namespace TrustNobody.Application.Games;

public sealed record GameSettingsDto(
    int MaxPlayers,
    int VampireCount,
    bool DoctorEnabled,
    bool SeerEnabled,
    int NightSeconds,
    int DiscussionSeconds,
    int VotingSeconds,
    bool RevealRoleOnDeath)
{
    public GameSettings ToDomain() => new()
    {
        MaxPlayers = MaxPlayers,
        VampireCount = VampireCount,
        DoctorEnabled = DoctorEnabled,
        SeerEnabled = SeerEnabled,
        NightSeconds = NightSeconds,
        DiscussionSeconds = DiscussionSeconds,
        VotingSeconds = VotingSeconds,
        RevealRoleOnDeath = RevealRoleOnDeath,
    };

    public static GameSettingsDto From(GameSettings s) => new(
        s.MaxPlayers, s.VampireCount, s.DoctorEnabled, s.SeerEnabled,
        s.NightSeconds, s.DiscussionSeconds, s.VotingSeconds, s.RevealRoleOnDeath);
}

public sealed record CreateGameResponse(string Code);
public sealed record ActionRequest(Guid? TargetId);

public sealed record MyGameDto(
    string Code, GamePhase Phase, int Round, string OwnerUsername, int PlayerCount, int MaxPlayers, bool IsOwner, DateTime CreatedAt);

public sealed record PlayerView(
    Guid Id, string Username, int Seat, bool IsAlive, bool IsOwner, bool IsMe,
    Role? Role, string? DeathCause, bool? HasVoted, bool? IsReady);

public sealed record ActionView(
    ActionType Type, string Prompt, IReadOnlyList<Guid> Targets, bool CanSkip, bool HasActed, Guid? CurrentTargetId, bool Locked);

public sealed record ReadyView(int Count, int Needed, bool IAmReady);

public sealed record EventView(long Id, int Round, GamePhase Phase, string Message, bool IsPrivate, DateTime CreatedAt);

/// <summary>Oyunun tek bir oyuncuya özel görünümü. Görmemesi gereken bilgi içermez.</summary>
public sealed record GameView(
    string Code,
    GamePhase Phase,
    int Round,
    DateTime? PhaseEndsAt,
    DateTime ServerNow,
    Team Winner,
    GameSettingsDto Settings,
    bool IsOwner,
    Guid MyPlayerId,
    Role MyRole,
    bool MyAlive,
    IReadOnlyList<PlayerView> Players,
    ActionView? Action,
    ReadyView? Ready,
    IReadOnlyList<string> SecretInfo,
    IReadOnlyList<EventView> Events);
