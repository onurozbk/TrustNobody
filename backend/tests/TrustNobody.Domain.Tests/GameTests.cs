using TrustNobody.Domain.Common;
using TrustNobody.Domain.Games;

namespace TrustNobody.Domain.Tests;

/// <summary>Karıştırmayan, her zaman ilk seçeneği alan rastgelelik: roller oturma sırasına göre dağılır.</summary>
file sealed class FixedRandomizer : IRandomizer
{
    public int Next(int maxExclusive) => 0;
    public void Shuffle<T>(Span<T> items) { }
}

public class GameTests
{
    private static readonly IRandomizer Rng = new FixedRandomizer();
    private static readonly DateTime T0 = new(2026, 1, 1, 20, 0, 0, DateTimeKind.Utc);

    private static readonly GameSettings FiveSettings = new()
    {
        MaxPlayers = 8, VampireCount = 1, DoctorEnabled = true, SeerEnabled = true,
        NightSeconds = 60, DiscussionSeconds = 120, VotingSeconds = 60,
    };

    /// <summary>
    /// n oyunculu oyun kurar. FixedRandomizer ile roller oturma sırasına göre:
    /// vampirler, doktor, kahin, köylüler.
    /// </summary>
    private static (Game Game, Guid[] Users) CreateGame(int n, GameSettings? settings = null)
    {
        var users = Enumerable.Range(0, n).Select(_ => Guid.NewGuid()).ToArray();
        var game = Game.Create("ABCDEF", users[0], "p0", settings ?? FiveSettings, T0);
        for (var i = 1; i < n; i++) game.Join(users[i], $"p{i}", T0);
        return (game, users);
    }

    private static (Game Game, Guid[] Users) StartedGame(int n = 5, GameSettings? settings = null)
    {
        var (game, users) = CreateGame(n, settings);
        game.Start(users[0], Rng, T0);
        return (game, users);
    }

    private static GamePlayer P(Game g, Guid userId) => g.FindByUser(userId)!;

    // ───────────── Lobi ─────────────

    [Fact]
    public void Owner_is_first_player_and_join_is_idempotent()
    {
        var (game, users) = CreateGame(3);
        game.Join(users[1], "p1", T0);

        Assert.Equal(3, game.Players.Count);
        Assert.True(game.IsOwner(users[0]));
        Assert.Equal([1, 2, 3], game.Players.Select(p => p.Seat));
    }

    [Fact]
    public void Duplicate_names_in_room_get_a_number()
    {
        var (game, _) = CreateGame(1);
        game.Join(Guid.NewGuid(), "Ali", T0);
        game.Join(Guid.NewGuid(), "ali", T0);
        game.Join(Guid.NewGuid(), "Ali", T0);
        game.Join(Guid.NewGuid(), "Abdurrahmanbeyzade", T0);
        game.Join(Guid.NewGuid(), "Abdurrahmanbeyzade", T0);

        Assert.Equal(["p0", "Ali", "ali (2)", "Ali (3)", "Abdurrahmanbeyzade", "Abdurrahmanbeyz (2)"],
            game.Players.Select(p => p.Username));
        Assert.All(game.Players, p => Assert.True(p.Username.Length <= 20));
    }

    [Fact]
    public void Cannot_join_full_room()
    {
        var (game, _) = CreateGame(4, FiveSettings with { MaxPlayers = 4 });
        var ex = Assert.Throws<DomainException>(() => game.Join(Guid.NewGuid(), "late", T0));
        Assert.Equal("Oda dolu.", ex.Message);
    }

    [Fact]
    public void Owner_cannot_leave_but_others_can()
    {
        var (game, users) = CreateGame(4);
        Assert.Throws<DomainException>(() => game.Leave(users[0]));
        game.Leave(users[1]);
        Assert.Equal(3, game.Players.Count);
    }

    [Fact]
    public void Invalid_settings_are_rejected()
    {
        Assert.Throws<DomainException>(() => (FiveSettings with { VampireCount = 4 }).Validate());
        Assert.Throws<DomainException>(() => (FiveSettings with { MaxPlayers = 2 }).Validate());
        Assert.Throws<DomainException>(() => (FiveSettings with { NightSeconds = 5 }).Validate());
    }

    // ───────────── Başlatma ─────────────

    [Fact]
    public void Only_owner_can_start()
    {
        var (game, users) = CreateGame(5);
        var ex = Assert.Throws<DomainException>(() => game.Start(users[1], Rng, T0));
        Assert.Equal(ErrorKind.Forbidden, ex.Kind);
    }

    [Fact]
    public void Needs_minimum_players()
    {
        var (game, users) = CreateGame(3);
        Assert.Throws<DomainException>(() => game.Start(users[0], Rng, T0));
    }

    [Fact]
    public void Start_assigns_roles_including_owner_and_enters_night()
    {
        var (game, users) = StartedGame(5);

        Assert.Equal(GamePhase.Night, game.Phase);
        Assert.Equal(1, game.Round);
        Assert.Equal(T0.AddSeconds(60), game.PhaseEndsAt);
        Assert.Equal(Role.Vampire, P(game, users[0]).Role); // yönetici de rol alır
        Assert.Equal(1, game.Players.Count(p => p.Role == Role.Vampire));
        Assert.Equal(1, game.Players.Count(p => p.Role == Role.Doctor));
        Assert.Equal(1, game.Players.Count(p => p.Role == Role.Seer));
        Assert.Equal(2, game.Players.Count(p => p.Role == Role.Villager));
    }

    // ───────────── Gece ─────────────

    [Fact]
    public void Villager_has_no_night_action()
    {
        var (game, users) = StartedGame();
        Assert.Null(game.GetAllowedAction(P(game, users[3])));
        Assert.Throws<DomainException>(() => game.SubmitAction(users[3], P(game, users[4]).Id, Rng, T0));
    }

    [Fact]
    public void Night_ends_early_when_everyone_acted_and_victim_dies()
    {
        // p0 vampir, p1 doktor, p2 kahin, p3-p4 köylü
        var (game, users) = StartedGame();
        var victim = P(game, users[3]);

        game.SubmitAction(users[0], victim.Id, Rng, T0);           // vampir
        game.SubmitAction(users[1], P(game, users[1]).Id, Rng, T0); // doktor kendini korur
        Assert.Equal(GamePhase.Night, game.Phase);
        game.SubmitAction(users[2], P(game, users[0]).Id, Rng, T0); // kahin vampire bakar

        Assert.Equal(GamePhase.Day, game.Phase);
        Assert.False(victim.IsAlive);
        var seerEvent = Assert.Single(game.Events, e => e.VisibleToPlayerId == P(game, users[2]).Id);
        Assert.Contains("VAMPİR", seerEvent.Message);
    }

    [Fact]
    public void Doctor_saves_the_victim()
    {
        var (game, users) = StartedGame();
        var victim = P(game, users[3]);

        game.SubmitAction(users[0], victim.Id, Rng, T0);
        game.SubmitAction(users[1], victim.Id, Rng, T0);
        game.SubmitAction(users[2], P(game, users[4]).Id, Rng, T0);

        Assert.Equal(GamePhase.Day, game.Phase);
        Assert.True(victim.IsAlive);
        Assert.Contains(game.Events, e => e.Message.Contains("kurtardın"));
    }

    [Fact]
    public void Seer_can_inspect_only_once_per_night()
    {
        var (game, users) = StartedGame();
        game.SubmitAction(users[2], P(game, users[3]).Id, Rng, T0);
        Assert.Throws<DomainException>(() => game.SubmitAction(users[2], P(game, users[4]).Id, Rng, T0));
    }

    [Fact]
    public void Vampire_cannot_target_another_vampire()
    {
        var (game, users) = StartedGame(7, FiveSettings with { VampireCount = 2 });
        Assert.Throws<DomainException>(() => game.SubmitAction(users[0], P(game, users[1]).Id, Rng, T0));
    }

    [Fact]
    public void Phase_advances_when_time_is_up()
    {
        var (game, _) = StartedGame();

        Assert.False(game.AdvanceIfDue(Rng, T0.AddSeconds(59)));
        Assert.True(game.AdvanceIfDue(Rng, T0.AddSeconds(60)));
        Assert.Equal(GamePhase.Day, game.Phase); // kimse hamle yapmadı → kimse ölmedi
        Assert.All(game.Players, p => Assert.True(p.IsAlive));

        Assert.True(game.AdvanceIfDue(Rng, T0.AddSeconds(60 + 120)));
        Assert.Equal(GamePhase.Voting, game.Phase);
    }

    // ───────────── Gündüz ve oylama ─────────────

    private static (Game Game, Guid[] Users) DayGame()
    {
        var (game, users) = StartedGame();
        game.AdvanceIfDue(Rng, T0.AddSeconds(60)); // sessiz gece → gündüz
        return (game, users);
    }

    [Fact]
    public void Majority_ready_starts_voting_early_and_ready_can_be_toggled()
    {
        var (game, users) = DayGame();
        Assert.Equal(3, game.ReadyNeeded); // 5 kişinin yarısından fazlası

        game.ToggleReady(users[0], Rng, T0);
        game.ToggleReady(users[0], Rng, T0); // geri al
        Assert.Equal(0, game.ReadyCount);

        game.ToggleReady(users[0], Rng, T0);
        game.ToggleReady(users[1], Rng, T0);
        Assert.Equal(GamePhase.Day, game.Phase);
        game.ToggleReady(users[2], Rng, T0);
        Assert.Equal(GamePhase.Voting, game.Phase);
    }

    private static Game VotingGame(out Guid[] users)
    {
        var (game, u) = DayGame();
        foreach (var id in u.Take(3)) game.ToggleReady(id, Rng, T0);
        users = u;
        return game;
    }

    [Fact]
    public void Hanging_the_only_vampire_wins_for_villagers()
    {
        var game = VotingGame(out var users);
        var vampire = P(game, users[0]);

        game.SubmitAction(users[0], P(game, users[1]).Id, Rng, T0);
        foreach (var id in users.Skip(1)) game.SubmitAction(id, vampire.Id, Rng, T0);

        Assert.False(vampire.IsAlive);
        Assert.Equal(GamePhase.Ended, game.Phase);
        Assert.Equal(Team.Villagers, game.Winner);
    }

    [Fact]
    public void Tie_vote_hangs_nobody_and_next_night_starts()
    {
        var game = VotingGame(out var users);

        game.SubmitAction(users[0], P(game, users[3]).Id, Rng, T0);
        game.SubmitAction(users[1], P(game, users[3]).Id, Rng, T0);
        game.SubmitAction(users[2], P(game, users[4]).Id, Rng, T0);
        game.SubmitAction(users[3], P(game, users[4]).Id, Rng, T0);
        game.SubmitAction(users[4], null, Rng, T0); // pas

        Assert.All(game.Players, p => Assert.True(p.IsAlive));
        Assert.Equal(GamePhase.Night, game.Phase);
        Assert.Equal(2, game.Round);
    }

    [Fact]
    public void Vampires_win_when_they_equal_the_others()
    {
        // 4 oyuncu: p0 vampir, p1 doktor, p2 kahin, p3 köylü
        var (game, users) = StartedGame(4);
        game.SubmitAction(users[0], P(game, users[3]).Id, Rng, T0);
        game.SubmitAction(users[1], P(game, users[1]).Id, Rng, T0);
        game.SubmitAction(users[2], P(game, users[3]).Id, Rng, T0);
        // gündüz: 3 kişi kaldı; oylamada doktor asılırsa 1 vampir - 1 kahin → vampirler kazanır
        foreach (var id in users.Take(2)) game.ToggleReady(id, Rng, T0); // 3 kişide 2 "hazırım" yeterli
        Assert.Equal(GamePhase.Voting, game.Phase);

        game.SubmitAction(users[0], P(game, users[1]).Id, Rng, T0);
        game.SubmitAction(users[2], P(game, users[1]).Id, Rng, T0);
        game.SubmitAction(users[1], P(game, users[0]).Id, Rng, T0);

        Assert.Equal(GamePhase.Ended, game.Phase);
        Assert.Equal(Team.Vampires, game.Winner);
    }

    // ───────────── Yönetici araçları ─────────────

    [Fact]
    public void Kick_during_game_eliminates_player()
    {
        var (game, users) = StartedGame();
        game.Kick(users[0], P(game, users[4]).Id, Rng, T0);

        Assert.False(P(game, users[4]).IsAlive);
        Assert.Equal(5, game.Players.Count);
    }

    [Fact]
    public void Rematch_resets_to_lobby_with_same_players()
    {
        var (game, users) = StartedGame();
        game.Abort(users[0], T0);
        game.Rematch(users[0]);

        Assert.Equal(GamePhase.Lobby, game.Phase);
        Assert.Empty(game.Actions);
        Assert.Empty(game.Events);
        Assert.All(game.Players, p => Assert.Equal(Role.None, p.Role));
        Assert.Equal(5, game.Players.Count);
    }
}
