namespace TrustNobody.Domain.Games;

/// <summary>Lobby → Night → Day (tartışma) → Voting → Night ... → Ended</summary>
public enum GamePhase { Lobby, Night, Day, Voting, Ended }

public enum Role
{
    None,       // lobide henüz rol dağıtılmadı
    Villager,   // Köylü
    Vampire,    // Vampir
    Doctor,     // Doktor: her gece birini korur
    Seer,       // Kahin: her gece birinin vampir olup olmadığını öğrenir
}

public enum Team { None, Villagers, Vampires }

/// <summary>ReadyToVote: gündüz "tartışma bitti, oylamaya hazırım" işareti.</summary>
public enum ActionType { VampireBite, DoctorProtect, SeerInspect, Vote, ReadyToVote }

public static class RoleNames
{
    public static string Tr(Role role) => role switch
    {
        Role.Villager => "Köylü",
        Role.Vampire => "Vampir",
        Role.Doctor => "Doktor",
        Role.Seer => "Kahin",
        _ => "-",
    };
}
