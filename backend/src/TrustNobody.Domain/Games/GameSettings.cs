using TrustNobody.Domain.Common;

namespace TrustNobody.Domain.Games;

/// <summary>Oda yöneticisinin seçtiği ayarlar (değer nesnesi).</summary>
public sealed record GameSettings
{
    public int MaxPlayers { get; init; } = 12;
    public int VampireCount { get; init; } = 2;
    public bool DoctorEnabled { get; init; } = true;
    public bool SeerEnabled { get; init; } = true;
    public int NightSeconds { get; init; } = 60;
    public int DiscussionSeconds { get; init; } = 300;
    public int VotingSeconds { get; init; } = 60;
    public bool RevealRoleOnDeath { get; init; } = true;

    public static GameSettings Default => new();

    public int SpecialRoleCount => VampireCount + (DoctorEnabled ? 1 : 0) + (SeerEnabled ? 1 : 0);

    public void Validate()
    {
        if (MaxPlayers is < Game.MinPlayers or > Game.MaxPlayersLimit)
            throw new DomainException($"Oyuncu sayısı {Game.MinPlayers}-{Game.MaxPlayersLimit} arası olmalı.");
        if (VampireCount is < 1 or > 10) throw new DomainException("Vampir sayısı 1-10 arası olmalı.");
        if (VampireCount * 2 >= MaxPlayers) throw new DomainException("Vampir sayısı oyuncu sayısının yarısından az olmalı.");
        if (SpecialRoleCount > MaxPlayers) throw new DomainException("Özel rol sayısı oyuncu sayısını aşıyor.");
        if (NightSeconds is < 15 or > 600) throw new DomainException("Gece süresi 15-600 saniye arası olmalı.");
        if (DiscussionSeconds is < 30 or > 3600) throw new DomainException("Tartışma süresi 30 sn - 60 dk arası olmalı.");
        if (VotingSeconds is < 15 or > 600) throw new DomainException("Oylama süresi 15-600 saniye arası olmalı.");
    }
}
