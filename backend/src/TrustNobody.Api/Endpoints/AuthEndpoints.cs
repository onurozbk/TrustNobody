using System.Security.Claims;
using TrustNobody.Api.Infrastructure;
using TrustNobody.Application.Auth;

namespace TrustNobody.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth").WithTags("Auth");

        g.MapPost("/register", (RegisterRequest req, AuthService auth, CancellationToken ct) => auth.RegisterAsync(req, ct))
            .RequireRateLimiting(RateLimits.Auth);

        g.MapPost("/login", (LoginRequest req, AuthService auth, CancellationToken ct) => auth.LoginAsync(req, ct))
            .RequireRateLimiting(RateLimits.Auth);

        // Kayıt olmadan, sadece takma adla giriş (davet linkiyle katılanlar için)
        g.MapPost("/guest", (GuestRequest req, AuthService auth, CancellationToken ct) => auth.GuestAsync(req, ct))
            .RequireRateLimiting(RateLimits.Auth);

        g.MapGet("/me", (ClaimsPrincipal user, AuthService auth, CancellationToken ct) => auth.GetMeAsync(user.GetUserId(), ct))
            .RequireAuthorization();

        return app;
    }
}
