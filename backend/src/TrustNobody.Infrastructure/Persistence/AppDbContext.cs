using Microsoft.EntityFrameworkCore;
using TrustNobody.Domain.Games;
using TrustNobody.Domain.Users;

namespace TrustNobody.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<GamePlayer> GamePlayers => Set<GamePlayer>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
