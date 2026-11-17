using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Diagnostics;
using TrustNobody.Domain.Common;

namespace TrustNobody.Api.Infrastructure;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : throw DomainException.Unauthorized("Oturum geçersiz.");
    }
}

public static class CorsRules
{
    /// <summary>localhost, 127.0.0.1 ve özel ağ adresleri (192.168.x, 10.x, 172.16-31.x), her port.</summary>
    public static bool IsLocalOrigin(string origin)
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
        if (uri.IsLoopback) return true;
        if (!System.Net.IPAddress.TryParse(uri.Host, out var ip)) return false;
        var b = ip.GetAddressBytes();
        return b.Length == 4 && (b[0] == 10 || (b[0] == 192 && b[1] == 168) || (b[0] == 172 && b[1] is >= 16 and <= 31));
    }
}

public static class RateLimits
{
    public const string Auth = "auth";
}

/// <summary>İş kuralı hatalarını <c>{ "error": "..." }</c> gövdesiyle uygun HTTP koduna çevirir.</summary>
public sealed class DomainExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not DomainException de) return false;

        ctx.Response.StatusCode = de.Kind switch
        {
            ErrorKind.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorKind.Forbidden => StatusCodes.Status403Forbidden,
            ErrorKind.NotFound => StatusCodes.Status404NotFound,
            ErrorKind.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest,
        };
        await ctx.Response.WriteAsJsonAsync(new ErrorResponse(de.Message), ct);
        return true;
    }
}

public sealed record ErrorResponse(string Error);
