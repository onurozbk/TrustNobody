using System.Net.Mail;
using System.Text.RegularExpressions;
using TrustNobody.Application.Abstractions;
using TrustNobody.Domain.Common;
using TrustNobody.Domain.Users;

namespace TrustNobody.Application.Auth;

public sealed record RegisterRequest(string? Email, string? Username, string? Password);
public sealed record LoginRequest(string? Login, string? Password);
public sealed record GuestRequest(string? DisplayName);
public sealed record UserDto(Guid Id, string? Email, string Username, bool IsGuest);
public sealed record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);

public sealed partial class AuthService(
    IUserRepository users,
    IUnitOfWork uow,
    IPasswordHasher hasher,
    ITokenService tokens,
    TimeProvider clock)
{
    [GeneratedRegex("^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]{3,20}$")]
    private static partial Regex UsernameRegex();

    /// <summary>Misafir adı: harf, rakam, boşluk, _ . - (2-20 karakter).</summary>
    [GeneratedRegex(@"^[\p{L}\p{N}_ .\-]{2,20}$")]
    private static partial Regex GuestNameRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var username = (req.Username ?? "").Trim();
        var password = req.Password ?? "";

        if (email.Length > User.EmailMaxLength || !MailAddress.TryCreate(email, out _))
            throw new DomainException("Geçerli bir e-posta girin.");
        if (!UsernameRegex().IsMatch(username))
            throw new DomainException($"Kullanıcı adı {User.UsernameMinLength}-{User.UsernameMaxLength} karakter olmalı (harf, rakam, _).");
        if (password.Length < User.PasswordMinLength)
            throw new DomainException($"Şifre en az {User.PasswordMinLength} karakter olmalı.");

        if (await users.EmailExistsAsync(email, ct)) throw DomainException.Conflict("Bu e-posta zaten kayıtlı.");
        if (await users.UsernameExistsAsync(username, ct)) throw DomainException.Conflict("Bu kullanıcı adı alınmış.");

        var user = User.Register(email, username, clock.GetUtcNow().UtcDateTime);
        user.SetPasswordHash(hasher.Hash(user, password));
        users.Add(user);
        await uow.SaveChangesAsync(ct);

        return CreateResponse(user);
    }

    /// <summary>Kayıt olmadan, sadece görünen adla oturum açar (davet linkiyle hızlı katılım).</summary>
    public async Task<AuthResponse> GuestAsync(GuestRequest req, CancellationToken ct = default)
    {
        var name = Whitespace().Replace((req.DisplayName ?? "").Trim(), " ");
        if (!GuestNameRegex().IsMatch(name))
            throw new DomainException($"Takma ad {User.GuestNameMinLength}-{User.UsernameMaxLength} karakter olmalı (harf, rakam, boşluk).");

        var user = User.CreateGuest(name, clock.GetUtcNow().UtcDateTime);
        users.Add(user);
        await uow.SaveChangesAsync(ct);

        return CreateResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var login = (req.Login ?? "").Trim().ToLowerInvariant();
        var user = login.Length == 0 ? null : await users.FindByLoginAsync(login, ct);

        if (user is null || !hasher.Verify(user, req.Password ?? ""))
            throw DomainException.Unauthorized("E-posta/kullanıcı adı veya şifre hatalı.");

        return CreateResponse(user);
    }

    public async Task<UserDto> GetMeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await users.GetByIdAsync(userId, ct) ?? throw DomainException.Unauthorized("Kullanıcı bulunamadı.");
        return ToDto(user);
    }

    private AuthResponse CreateResponse(User user)
    {
        var token = tokens.Create(user);
        return new AuthResponse(token.Token, token.ExpiresAt, ToDto(user));
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Email, u.Username, u.IsGuest);
}
