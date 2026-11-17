using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustNobody.Domain.Games;
using TrustNobody.Domain.Users;

namespace TrustNobody.Infrastructure.Persistence;

// Tablo/kolon isimleri UseSnakeCaseNamingConvention ile snake_case olur (users, game_players, phase_ends_at ...).

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> e)
    {
        e.ToTable("users");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        // Misafirlerde email/normalized_username/password_hash null. PostgreSQL unique index'te NULL'lar çakışmaz.
        e.Property(x => x.Email).HasMaxLength(User.EmailMaxLength);
        e.Property(x => x.Username).HasMaxLength(User.UsernameMaxLength).IsRequired();
        e.Property(x => x.NormalizedUsername).HasMaxLength(User.UsernameMaxLength);
        e.HasIndex(x => x.Email).IsUnique();
        e.HasIndex(x => x.NormalizedUsername).IsUnique();
        e.ToTable(t => t.HasCheckConstraint("ck_users_registered_fields",
            "is_guest OR (email IS NOT NULL AND normalized_username IS NOT NULL AND password_hash IS NOT NULL)"));
    }
}

internal sealed class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> e)
    {
        e.ToTable("games");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Code).HasMaxLength(Game.CodeLength).IsRequired();
        e.HasIndex(x => x.Code).IsUnique();
        e.HasIndex(x => new { x.Phase, x.PhaseEndsAt });

        e.Property(x => x.Phase).HasConversion<string>().HasMaxLength(16);
        e.Property(x => x.Winner).HasConversion<string>().HasMaxLength(16);

        e.HasOne<User>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);

        // Ayarlar değer nesnesi: games tablosunda settings_* kolonları olarak tutulur.
        e.ComplexProperty(x => x.Settings);

        e.HasMany(x => x.Players).WithOne().HasForeignKey(p => p.GameId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.Actions).WithOne().HasForeignKey(a => a.GameId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.Events).WithOne().HasForeignKey(a => a.GameId).OnDelete(DeleteBehavior.Cascade);

        // Koleksiyonlar private alanlar (_players vb.) üzerinden doldurulur.
        e.Navigation(x => x.Players).UsePropertyAccessMode(PropertyAccessMode.Field);
        e.Navigation(x => x.Actions).UsePropertyAccessMode(PropertyAccessMode.Field);
        e.Navigation(x => x.Events).UsePropertyAccessMode(PropertyAccessMode.Field);

        e.Ignore(x => x.AlivePlayers);
        e.Ignore(x => x.CurrentRoundActions);
    }
}

internal sealed class GamePlayerConfiguration : IEntityTypeConfiguration<GamePlayer>
{
    public void Configure(EntityTypeBuilder<GamePlayer> e)
    {
        e.ToTable("game_players");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Username).HasMaxLength(User.UsernameMaxLength).IsRequired();
        e.Property(x => x.Role).HasConversion<string>().HasMaxLength(16);
        e.Property(x => x.DeathCause).HasMaxLength(128);
        e.HasIndex(x => new { x.GameId, x.UserId }).IsUnique();
        e.HasIndex(x => x.UserId);
        e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class GameActionConfiguration : IEntityTypeConfiguration<GameAction>
{
    public void Configure(EntityTypeBuilder<GameAction> e)
    {
        e.ToTable("game_actions");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedNever();
        e.Property(x => x.Type).HasConversion<string>().HasMaxLength(16);
        e.HasIndex(x => new { x.GameId, x.Round, x.Type, x.ActorId }).IsUnique();
    }
}

internal sealed class GameEventConfiguration : IEntityTypeConfiguration<GameEvent>
{
    public void Configure(EntityTypeBuilder<GameEvent> e)
    {
        e.ToTable("game_events");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).UseIdentityAlwaysColumn();
        e.Property(x => x.Phase).HasConversion<string>().HasMaxLength(16);
        e.Property(x => x.Message).HasMaxLength(1000).IsRequired();
        e.HasIndex(x => x.GameId);
    }
}
