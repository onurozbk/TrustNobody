using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TrustNobody.Application.Abstractions;
using TrustNobody.Domain.Users;

namespace TrustNobody.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = "trustnobody";
    public string Audience { get; set; } = "trustnobody";

    /// <summary>En az 32 karakter. Üretimde ortam değişkeninden verin (Jwt__Key).</summary>
    public string Key { get; set; } = "";

    public int ExpiryDays { get; set; } = 7;

    public SymmetricSecurityKey SigningKey()
    {
        if (Key.Length < 32) throw new InvalidOperationException("Jwt:Key en az 32 karakter olmalı.");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key));
    }
}

internal sealed class JwtTokenService(IOptions<JwtOptions> options, TimeProvider clock) : ITokenService
{
    public AccessToken Create(User user)
    {
        var o = options.Value;
        var expires = clock.GetUtcNow().UtcDateTime.AddDays(o.ExpiryDays);
        var token = new JwtSecurityToken(
            issuer: o.Issuer,
            audience: o.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim("guest", user.IsGuest ? "true" : "false"),
            ],
            expires: expires,
            signingCredentials: new SigningCredentials(o.SigningKey(), SecurityAlgorithms.HmacSha256));
        return new AccessToken(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

/// <summary>ASP.NET Core Identity'nin PBKDF2 tabanlı hasher'ı.</summary>
internal sealed class IdentityPasswordHasher : Application.Abstractions.IPasswordHasher
{
    private readonly PasswordHasher<User> _inner = new();

    public string Hash(User user, string password) => _inner.HashPassword(user, password);

    public bool Verify(User user, string password) =>
        user.PasswordHash is { } hash // misafirlerin şifresi yok
        && _inner.VerifyHashedPassword(user, hash, password) != PasswordVerificationResult.Failed;
}
