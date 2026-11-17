using Microsoft.Extensions.DependencyInjection;
using TrustNobody.Application.Auth;
using TrustNobody.Application.Games;
using TrustNobody.Domain.Common;

namespace TrustNobody.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IRandomizer>(CryptoRandomizer.Instance);
        services.AddScoped<AuthService>();
        services.AddScoped<GameService>();
        return services;
    }
}
