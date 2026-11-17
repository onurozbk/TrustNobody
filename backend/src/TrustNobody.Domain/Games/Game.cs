using TrustNobody.Domain.Common;

namespace TrustNobody.Domain.Games;

/// <summary>
/// Oyun aggregate'i: oyuncular, hamleler ve duyurular dahil tüm oyun kuralları burada.
/// Saf C#; veritabanı, saat ve rastgelelik dışarıdan verilir, böylece birim testle doğrulanabilir.
/// Yönetici de herkes gibi oyuncudur; aşamalar süre, hamleler ve çoğunluk oyuyla otomatik ilerler.
/// </summary>
public sealed class Game
{
    public const int MinPlayers = 4;
    public const int MaxPlayersLimit = 30;
    public const int CodeLength = 6;

    private readonly List<GamePlayer> _players = [];
    private readonly List<GameAction> _actions = [];
    private readonly List<GameEvent> _events = [];

    private Game() { } // EF

    public Guid Id { get; private set; }
    public string Code { get; private set; } = "";
    public Guid OwnerUserId { get; private set; }
    public GamePhase Phase { get; private set; } = GamePhase.Lobby;
    public int Round { get; private set; }
    public DateTime? PhaseEndsAt { get; private set; }
    public Team Winner { get; private set; } = Team.None;
    public GameSettings Settings { get; private set; } = GameSettings.Default;
    public DateTime CreatedAt { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }

    public IReadOnlyList<GamePlayer> Players => _players;
    public IReadOnlyList<GameAction> Actions => _actions;
    public IReadOnlyList<GameEvent> Events => _events;

    public IEnumerable<GamePlayer> AlivePlayers => _players.Where(p => p.IsAlive);
    public bool IsInProgress => Phase is GamePhase.Night or GamePhase.Day or GamePhase.Voting;
    public IEnumerable<GameAction> CurrentRoundActions => _actions.Where(a => a.Round == Round);

    // ───────────────────────────── Oluşturma ve lobi ─────────────────────────────

    public static Game Create(string code, Guid ownerUserId, string ownerUsername, GameSettings settings, DateTime now)
    {
        settings.Validate();
        var game = new Game
        {
            Id = Guid.CreateVersion7(),
            Code = code,
            OwnerUserId = ownerUserId,
            Settings = settings,
            CreatedAt = now,
        };
        game._players.Add(new GamePlayer(game.Id, ownerUserId, ownerUsername, seat: 1, now));
        return game;
    }

    public GamePlayer? FindByUser(Guid userId) => _players.FirstOrDefault(p => p.UserId == userId);

    public GamePlayer RequireMember(Guid userId) =>
        FindByUser(userId) ?? throw DomainException.Forbidden("Bu oyunun oyuncusu değilsin.");

    public bool IsOwner(Guid userId) => OwnerUserId == userId;

    private void RequireOwner(Guid userId)
    {
        if (!IsOwner(userId)) throw DomainException.Forbidden("Bunu sadece oda yöneticisi yapabilir.");
    }

    /// <summary>Odaya katılır. Zaten içerideyse bir şey yapmaz.</summary>
    public GamePlayer Join(Guid userId, string username, DateTime now)
    {
        if (FindByUser(userId) is { } existing) return existing;
        if (Phase != GamePhase.Lobby) throw new DomainException("Oyun başlamış, artık katılamazsın.");
        if (_players.Count >= Settings.MaxPlayers) throw new DomainException("Oda dolu.");

        var player = new GamePlayer(Id, userId, UniqueDisplayName(username), _players.Max(p => p.Seat) + 1, now);
        _players.Add(player);
        return player;
    }

    /// <summary>Odada aynı isim varsa sonuna sayı ekler: "Ali" → "Ali (2)". Misafir adları çakışabilir.</summary>
    private string UniqueDisplayName(string name)
    {
        bool Taken(string n) => _players.Any(p => string.Equals(p.Username, n, StringComparison.OrdinalIgnoreCase));
        if (!Taken(name)) return name;

        var baseName = name.Length > 15 ? name[..15].TrimEnd() : name; // " (30)" ile 20 karakteri geçmesin
        for (var i = 2; ; i++)
        {
            var candidate = $"{baseName} ({i})";
            if (!Taken(candidate)) return candidate;
        }
    }

    public void Leave(Guid userId)
    {
        var me = RequireMember(userId);
        if (IsOwner(userId)) throw new DomainException("Yönetici odadan ayrılamaz; oyunu sonlandırabilirsin.");
        if (IsInProgress) throw new DomainException("Oyun sürerken ayrılamazsın. Yöneticiden seni çıkarmasını iste.");
        _players.Remove(me);
    }

    public void UpdateSettings(Guid actorUserId, GameSettings settings)
    {
        RequireOwner(actorUserId);
        if (Phase != GamePhase.Lobby) throw new DomainException("Ayarlar sadece lobide değiştirilebilir.");
        settings.Validate();
        if (settings.MaxPlayers < _players.Count)
            throw new DomainException($"Odada zaten {_players.Count} oyuncu var.");
        Settings = settings;
    }

    /// <summary>Lobide oyuncuyu odadan çıkarır; oyun sürüyorsa oyundan eler (ölmüş sayılır).</summary>
    public void Kick(Guid actorUserId, Guid playerId, IRandomizer random, DateTime now)
    {
        RequireOwner(actorUserId);
        var target = _players.FirstOrDefault(p => p.Id == playerId) ?? throw DomainException.NotFound("Oyuncu bulunamadı.");
        if (target.UserId == OwnerUserId) throw new DomainException("Kendini çıkaramazsın.");

        if (!IsInProgress)
        {
            _players.Remove(target);
            return;
        }

        if (!target.IsAlive) throw new DomainException("Bu oyuncu zaten oyun dışı.");
        target.Kill(Round, "Yönetici tarafından oyundan çıkarıldı");
        Public($"🚪 {target.Username} yönetici tarafından oyundan çıkarıldı.{RoleReveal(target)}", now);
        if (!CheckWin(now)) TryFinishEarly(random, now);
    }

    // ───────────────────────────── Başlatma ─────────────────────────────

    public void Start(Guid actorUserId, IRandomizer random, DateTime now)
    {
        RequireOwner(actorUserId);
        if (Phase != GamePhase.Lobby) throw new DomainException("Oyun zaten başlamış.");

        var s = Settings;
        var participants = _players.OrderBy(p => p.Seat).ToList();
        var n = participants.Count;

        if (n < MinPlayers) throw new DomainException($"En az {MinPlayers} oyuncu gerekli (şu an {n}).");
        if (s.VampireCount * 2 >= n) throw new DomainException($"{n} oyuncu için en fazla {(n - 1) / 2} vampir olabilir.");
        if (s.SpecialRoleCount > n) throw new DomainException("Özel rol sayısı oyuncu sayısını aşıyor.");

        var roles = new List<Role>(n);
        roles.AddRange(Enumerable.Repeat(Role.Vampire, s.VampireCount));
        if (s.DoctorEnabled) roles.Add(Role.Doctor);
        if (s.SeerEnabled) roles.Add(Role.Seer);
        roles.AddRange(Enumerable.Repeat(Role.Villager, n - roles.Count));

        var shuffled = roles.ToArray();
        random.Shuffle<Role>(shuffled);
        for (var i = 0; i < n; i++) participants[i].AssignRole(shuffled[i]);

        StartedAt = now;
        Round = 1;
        Phase = GamePhase.Night;

        var parts = new List<string> { $"{s.VampireCount} vampir" };
        if (s.DoctorEnabled) parts.Add("1 doktor");
        if (s.SeerEnabled) parts.Add("1 kahin");
        parts.Add($"{n - s.SpecialRoleCount} köylü");
        Public($"Oyun başladı! {n} oyuncu: {string.Join(", ", parts)}. Rolünü kimseye gösterme.", now);

        EnterNight(1, now);
    }

    // ───────────────────────────── Hamleler ─────────────────────────────

    /// <summary>Oyuncunun şu aşamada yapabileceği hamle; yoksa null.</summary>
    public AllowedAction? GetAllowedAction(GamePlayer me)
    {
        if (!me.IsAlive || me.Role == Role.None) return null;
        var alive = AlivePlayers.ToList();

        return Phase switch
        {
            GamePhase.Night => me.Role switch
            {
                Role.Vampire => new AllowedAction(ActionType.VampireBite, alive.Where(p => !p.IsVampire).ToList(), false),
                Role.Doctor => new AllowedAction(ActionType.DoctorProtect, alive, false),
                Role.Seer => new AllowedAction(ActionType.SeerInspect, alive.Where(p => p.Id != me.Id).ToList(), false),
                _ => null,
            },
            GamePhase.Voting => new AllowedAction(ActionType.Vote, alive.Where(p => p.Id != me.Id).ToList(), true),
            _ => null,
        };
    }

    public GameAction? FindCurrentAction(GamePlayer actor, ActionType type) =>
        _actions.FirstOrDefault(a => a.Round == Round && a.Type == type && a.ActorId == actor.Id);

    /// <summary>Gece aksiyonu ya da gündüz oyu. targetId null = pas (sadece oylamada).</summary>
    public void SubmitAction(Guid userId, Guid? targetId, IRandomizer random, DateTime now)
    {
        var me = RequireMember(userId);
        var allowed = GetAllowedAction(me) ?? throw new DomainException("Şu an yapabileceğin bir hamle yok.");

        GamePlayer? target = null;
        if (targetId is null)
        {
            if (!allowed.CanSkip) throw new DomainException("Bir hedef seçmelisin.");
        }
        else
        {
            target = allowed.Targets.FirstOrDefault(t => t.Id == targetId)
                     ?? throw new DomainException("Bu oyuncuyu seçemezsin.");
        }

        var existing = FindCurrentAction(me, allowed.Type);
        if (allowed.Type == ActionType.SeerInspect && existing is not null)
            throw new DomainException("Bu gece zaten birine baktın.");

        if (existing is null) _actions.Add(new GameAction(Id, Round, allowed.Type, me.Id, targetId, now));
        else existing.ChangeTarget(targetId, now);

        if (allowed.Type == ActionType.SeerInspect)
        {
            var verdict = target!.IsVampire ? "bir VAMPİR! 🧛" : "vampir değil.";
            Private(me, $"🔮 Kahin görüsü: {target.Username} {verdict}", now);
        }

        TryFinishEarly(random, now);
    }

    /// <summary>Oylamaya erken geçmek için gereken "hazırım" sayısı: hayattakilerin yarısından fazlası.</summary>
    public int ReadyNeeded => AlivePlayers.Count() / 2 + 1;

    public int ReadyCount
    {
        get
        {
            var aliveIds = AlivePlayers.Select(p => p.Id).ToHashSet();
            return CurrentRoundActions.Count(a => a.Type == ActionType.ReadyToVote && aliveIds.Contains(a.ActorId));
        }
    }

    /// <summary>Gündüz "oylamaya hazırım" işaretini açar/kapatır. Çoğunluk hazırsa oylama başlar.</summary>
    public void ToggleReady(Guid userId, IRandomizer random, DateTime now)
    {
        var me = RequireMember(userId);
        if (Phase != GamePhase.Day) throw new DomainException("Sadece gündüz tartışmasında kullanılabilir.");
        if (!me.IsAlive) throw new DomainException("Ölüler oylamaya katılamaz.");

        var existing = FindCurrentAction(me, ActionType.ReadyToVote);
        if (existing is not null)
        {
            _actions.Remove(existing);
            return;
        }

        _actions.Add(new GameAction(Id, Round, ActionType.ReadyToVote, me.Id, null, now));
        TryFinishEarly(random, now);
    }

    /// <summary>Herkes hamlesini yaptıysa süreyi beklemeden aşamayı bitirir.</summary>
    private void TryFinishEarly(IRandomizer random, DateTime now)
    {
        var round = CurrentRoundActions.ToList();
        bool Acted(GamePlayer p, ActionType t) => round.Any(a => a.ActorId == p.Id && a.Type == t);

        switch (Phase)
        {
            case GamePhase.Night:
                var vamps = AlivePlayers.Where(p => p.IsVampire).ToList();
                var bites = round.Where(a => a.Type == ActionType.VampireBite && vamps.Any(v => v.Id == a.ActorId)).ToList();
                var vampsAgree = bites.Count == vamps.Count && bites.Select(b => b.TargetId).Distinct().Count() == 1;
                var doctorDone = AlivePlayers.Where(p => p.Role == Role.Doctor).All(p => Acted(p, ActionType.DoctorProtect));
                var seerDone = AlivePlayers.Where(p => p.Role == Role.Seer).All(p => Acted(p, ActionType.SeerInspect));
                if (vampsAgree && doctorDone && seerDone) ResolveNight(random, now);
                break;

            case GamePhase.Day:
                if (ReadyCount >= ReadyNeeded) EnterVoting(now);
                break;

            case GamePhase.Voting:
                if (AlivePlayers.All(p => Acted(p, ActionType.Vote))) ResolveVoting(now);
                break;
        }
    }

    // ───────────────────────────── Aşama geçişleri ─────────────────────────────

    /// <summary>Süresi dolmuşsa aşamayı ilerletir. Arka plan servisi çağırır.</summary>
    public bool AdvanceIfDue(IRandomizer random, DateTime now)
    {
        if (!IsInProgress || PhaseEndsAt > now) return false;

        switch (Phase)
        {
            case GamePhase.Night: ResolveNight(random, now); break;
            case GamePhase.Day: EnterVoting(now); break;
            case GamePhase.Voting: ResolveVoting(now); break;
        }
        return true;
    }

    private void EnterNight(int round, DateTime now)
    {
        Round = round;
        Phase = GamePhase.Night;
        PhaseEndsAt = now.AddSeconds(Settings.NightSeconds);
        Public($"🌙 Gece {round} çöktü. Herkes gözlerini kapatsın... Vampirler avını, doktor koruyacağı kişiyi, kahin bakacağı kişiyi seçsin.", now);
    }

    private void ResolveNight(IRandomizer random, DateTime now)
    {
        var round = CurrentRoundActions.ToList();
        var aliveIds = AlivePlayers.Select(p => p.Id).ToHashSet();

        var bites = round
            .Where(a => a.Type == ActionType.VampireBite && aliveIds.Contains(a.ActorId) && a.TargetId is not null)
            .Select(a => a.TargetId!.Value);
        var victimId = PickPlurality(bites, random);

        var doctor = AlivePlayers.FirstOrDefault(p => p.Role == Role.Doctor);
        var protectedId = doctor is null
            ? null
            : round.FirstOrDefault(a => a.Type == ActionType.DoctorProtect && a.ActorId == doctor.Id)?.TargetId;

        Phase = GamePhase.Day;
        PhaseEndsAt = now.AddSeconds(Settings.DiscussionSeconds);

        var victim = victimId is null ? null : _players.First(p => p.Id == victimId);
        if (victim is not null && victim.Id == protectedId)
        {
            Public($"☀️ Gün {Round} doğdu. Bu gece kimse ölmedi! Tartışma başlasın.", now);
            Private(doctor!, $"🩺 Koruduğun {victim.Username} bu gece saldırıya uğradı ve sen onu kurtardın!", now);
        }
        else if (victim is not null)
        {
            victim.Kill(Round, "Gece vampirler tarafından öldürüldü");
            Public($"☀️ Gün {Round} doğdu. {victim.Username} bu gece öldürülmüş halde bulundu.{RoleReveal(victim)} Tartışma başlasın.", now);
        }
        else
        {
            Public($"☀️ Gün {Round} doğdu. Bu gece kimse ölmedi. Tartışma başlasın.", now);
        }

        CheckWin(now);
    }

    private void EnterVoting(DateTime now)
    {
        var early = PhaseEndsAt > now ? " (çoğunluk hazır olduğu için erken)" : "";
        Phase = GamePhase.Voting;
        PhaseEndsAt = now.AddSeconds(Settings.VotingSeconds);
        Public($"🗳️ Oylama başladı{early}! Asılmasını istediğin kişiye oy ver ya da pas geç.", now);
    }

    private void ResolveVoting(DateTime now)
    {
        var aliveIds = AlivePlayers.Select(p => p.Id).ToHashSet();
        var votes = CurrentRoundActions.Where(a => a.Type == ActionType.Vote && aliveIds.Contains(a.ActorId)).ToList();

        var skips = votes.Count(v => v.TargetId is null);
        var tally = votes
            .Where(v => v.TargetId is not null)
            .GroupBy(v => v.TargetId!.Value)
            .Select(x => (Player: _players.First(p => p.Id == x.Key), Count: x.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();

        var summary = tally.Count == 0 && skips == 0
            ? "Kimse oy vermedi."
            : string.Join(", ", tally.Select(t => $"{t.Player.Username} ({t.Count})")
                .Concat(skips > 0 ? [$"Pas ({skips})"] : []));

        var top = tally.FirstOrDefault();
        var isUniqueTop = tally.Count > 0 && (tally.Count == 1 || tally[1].Count < top.Count);

        if (isUniqueTop && top.Count > skips)
        {
            top.Player.Kill(Round, "Köy meydanında asıldı");
            Public($"⚖️ Oylama sonucu: {summary}. {top.Player.Username} asıldı.{RoleReveal(top.Player)}", now);
        }
        else
        {
            Public($"⚖️ Oylama sonucu: {summary}. Karar çıkmadı, bugün kimse asılmadı.", now);
        }

        if (!CheckWin(now)) EnterNight(Round + 1, now);
    }

    // ───────────────────────────── Yönetici araçları ─────────────────────────────

    public void Abort(Guid actorUserId, DateTime now)
    {
        RequireOwner(actorUserId);
        if (Phase == GamePhase.Ended) throw new DomainException("Oyun zaten bitti.");
        Phase = GamePhase.Ended;
        PhaseEndsAt = null;
        EndedAt = now;
        Public("⛔ Oyun yönetici tarafından sonlandırıldı.", now);
    }

    /// <summary>Aynı oyuncularla yeni oyun: lobiye geri döner.</summary>
    public void Rematch(Guid actorUserId)
    {
        RequireOwner(actorUserId);
        if (Phase != GamePhase.Ended) throw new DomainException("Önce mevcut oyun bitmeli.");

        _actions.Clear();
        _events.Clear();
        foreach (var p in _players) p.Reset();

        Phase = GamePhase.Lobby;
        Round = 0;
        Winner = Team.None;
        PhaseEndsAt = null;
        StartedAt = null;
        EndedAt = null;
    }

    // ───────────────────────────── Yardımcılar ─────────────────────────────

    private bool CheckWin(DateTime now)
    {
        var vamps = AlivePlayers.Count(p => p.IsVampire);
        var others = AlivePlayers.Count(p => !p.IsVampire);

        var winner = vamps == 0 ? Team.Villagers : vamps >= others ? Team.Vampires : Team.None;
        if (winner == Team.None) return false;

        Winner = winner;
        Phase = GamePhase.Ended;
        PhaseEndsAt = null;
        EndedAt = now;

        var vampNames = string.Join(", ", _players.Where(p => p.IsVampire).Select(p => p.Username));
        Public(winner == Team.Villagers
            ? $"🎉 Tüm vampirler yok edildi. KÖYLÜLER KAZANDI! Vampirler: {vampNames}"
            : $"🩸 Vampirler köyü ele geçirdi. VAMPİRLER KAZANDI! Vampirler: {vampNames}", now);
        return true;
    }

    private string RoleReveal(GamePlayer p) =>
        Settings.RevealRoleOnDeath ? $" Rolü: {RoleNames.Tr(p.Role)}." : "";

    /// <summary>En çok seçilen hedef; eşitlikte rastgele biri.</summary>
    private static Guid? PickPlurality(IEnumerable<Guid> targets, IRandomizer random)
    {
        var groups = targets.GroupBy(t => t).Select(x => (Id: x.Key, Count: x.Count())).ToList();
        if (groups.Count == 0) return null;
        var max = groups.Max(x => x.Count);
        var top = groups.Where(x => x.Count == max).OrderBy(x => x.Id).ToList();
        return top.Count == 1 ? top[0].Id : top[random.Next(top.Count)].Id;
    }

    private void Public(string message, DateTime now) =>
        _events.Add(new GameEvent(Id, Round, Phase, message, null, now));

    private void Private(GamePlayer player, string message, DateTime now) =>
        _events.Add(new GameEvent(Id, Round, Phase, message, player.Id, now));
}

/// <summary>Bir oyuncunun şu an yapabileceği hamle ve seçebileceği hedefler.</summary>
public sealed record AllowedAction(ActionType Type, IReadOnlyList<GamePlayer> Targets, bool CanSkip);
