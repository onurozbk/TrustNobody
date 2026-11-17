namespace TrustNobody.Domain.Users;

/// <summary>
/// Kullanıcı. İki türü var:
/// - Kayıtlı: e-posta + kullanıcı adı + şifre ile giriş yapar.
/// - Misafir: sadece görünen ad ile girer (davet linkiyle hızlı katılım için). E-postası ve şifresi yoktur;
///   cihazdaki oturum silinirse hesaba tekrar erişilemez.
/// </summary>
public sealed class User
{
    public const int EmailMaxLength = 256;
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 20;
    public const int GuestNameMinLength = 2;
    public const int PasswordMinLength = 6;

    private User() { } // EF

    public static User Register(string email, string username, DateTime now) => new()
    {
        Id = Guid.CreateVersion7(),
        Email = email,
        Username = username,
        NormalizedUsername = Normalize(username),
        CreatedAt = now,
    };

    public static User CreateGuest(string displayName, DateTime now) => new()
    {
        Id = Guid.CreateVersion7(),
        Username = displayName,
        IsGuest = true,
        CreatedAt = now,
    };

    public Guid Id { get; private set; }

    /// <summary>Misafirlerde null.</summary>
    public string? Email { get; private set; }

    /// <summary>Görünen ad. Kayıtlılarda benzersiz kullanıcı adı, misafirlerde serbest takma ad.</summary>
    public string Username { get; private set; } = "";

    /// <summary>Büyük/küçük harf duyarsız benzersizlik ve giriş için (unique index). Misafirlerde null.</summary>
    public string? NormalizedUsername { get; private set; }

    /// <summary>Misafirlerde null.</summary>
    public string? PasswordHash { get; private set; }

    public bool IsGuest { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public void SetPasswordHash(string hash) => PasswordHash = hash;

    public static string Normalize(string username) => username.Trim().ToLowerInvariant();
}
