using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TrustNobody.Application.Abstractions;
using TrustNobody.Infrastructure.Persistence;
using TrustNobody.Infrastructure.Security;

namespace TrustNobody.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default ayarı eksik.");

        services.AddDbContext<AppDbContext>(o => ConfigureDb(o, connectionString));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGameRepository, GameRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddOptions<JwtOptions>()
            .Bind(config.GetSection(JwtOptions.Section))
            .Validate(o => o.Key.Length >= 32, "Jwt:Key en az 32 karakter olmalı.")
            .ValidateOnStart();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, IdentityPasswordHasher>();

        return services;
    }

    internal static void ConfigureDb(DbContextOptionsBuilder o, string connectionString) =>
        o.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                npgsql.EnableRetryOnFailure(3);
            })
            .UseSnakeCaseNamingConvention();

    /// <summary>Bekleyen migration'ları uygular; veritabanı henüz hazır değilse birkaç kez dener.</summary>
    public static async Task MigrateDatabaseAsync(this IServiceProvider services, Action<string>? log = null)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await db.Database.MigrateAsync();
                return;
            }
            catch (Exception ex) when (attempt < 10)
            {
                log?.Invoke($"Veritabanına bağlanılamadı ({attempt}/10): {ex.Message}");
                await Task.Delay(TimeSpan.FromSeconds(2));
            }
        }
    }
}
