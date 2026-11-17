using TrustNobody.Domain.Games;

namespace TrustNobody.Application.Games;

/// <summary>
/// Her oyuncuya sadece görmesi gereken bilgiyi hazırlar. Yönetici dahil herkes yalnızca kendi rolünü görür;
/// roller istemciye toplu halde gitmez, böylece geliştirici araçlarıyla hile yapılamaz.
/// </summary>
public static class GameViewBuilder
{
    public static GameView Build(Game g, GamePlayer me, DateTime now)
    {
        var ended = g.Phase == GamePhase.Ended;
        var round = g.CurrentRoundActions.ToList();
        var names = g.Players.ToDictionary(p => p.Id, p => p.Username);
        bool Did(GamePlayer p, ActionType t) => round.Any(a => a.Type == t && a.ActorId == p.Id);

        bool CanSeeRole(GamePlayer p) =>
            ended
            || p.Id == me.Id
            || (me.IsVampire && p.IsVampire)
            || (!p.IsAlive && g.Settings.RevealRoleOnDeath);

        var players = g.Players
            .OrderBy(p => p.Seat)
            .Select(p => new PlayerView(
                p.Id, p.Username, p.Seat, p.IsAlive, g.IsOwner(p.UserId), p.Id == me.Id,
                CanSeeRole(p) && p.Role != Role.None ? p.Role : null,
                p.DeathCause,
                g.Phase == GamePhase.Voting && p.IsAlive ? Did(p, ActionType.Vote) : null,
                g.Phase == GamePhase.Day && p.IsAlive ? Did(p, ActionType.ReadyToVote) : null))
            .ToList();

        ActionView? action = null;
        if (g.GetAllowedAction(me) is { } allowed)
        {
            var current = g.FindCurrentAction(me, allowed.Type);
            action = new ActionView(
                allowed.Type, Prompt(allowed.Type), allowed.Targets.Select(t => t.Id).ToList(), allowed.CanSkip,
                current is not null, current?.TargetId, allowed.Type == ActionType.SeerInspect && current is not null);
        }

        var ready = g.Phase == GamePhase.Day
            ? new ReadyView(g.ReadyCount, g.ReadyNeeded, Did(me, ActionType.ReadyToVote))
            : null;

        // Gizli bilgi: vampirler takım arkadaşlarını ve gece kimi seçtiklerini görür.
        var secret = new List<string>();
        if (g.IsInProgress && me.IsVampire)
        {
            var mates = g.Players.Where(p => p.IsVampire && p.Id != me.Id).Select(p => p.Username).ToList();
            secret.Add(mates.Count > 0 ? $"🧛 Vampir arkadaşların: {string.Join(", ", mates)}" : "🧛 Tek vampir sensin.");
            if (g.Phase == GamePhase.Night)
                secret.AddRange(round
                    .Where(a => a.Type == ActionType.VampireBite && a.ActorId != me.Id)
                    .Select(a => $"🩸 {names[a.ActorId]} → {(a.TargetId is { } t ? names[t] : "?")}"));
        }

        var events = g.Events
            .Where(e => ended || e.VisibleToPlayerId is null || e.VisibleToPlayerId == me.Id)
            .OrderBy(e => e.CreatedAt).ThenBy(e => e.Id)
            .Select(e => new EventView(e.Id, e.Round, e.Phase, e.Message, e.IsPrivate, e.CreatedAt))
            .ToList();

        return new GameView(
            g.Code, g.Phase, g.Round, g.PhaseEndsAt, now, g.Winner, GameSettingsDto.From(g.Settings),
            g.IsOwner(me.UserId), me.Id, me.Role, me.IsAlive, players, action, ready, secret, events);
    }

    private static string Prompt(ActionType t) => t switch
    {
        ActionType.VampireBite => "Bu gece kimi ısıracaksınız?",
        ActionType.DoctorProtect => "Bu gece kimi koruyacaksın?",
        ActionType.SeerInspect => "Bu gece kimin rolüne bakacaksın?",
        _ => "Kimin asılmasını istiyorsun?",
    };
}
