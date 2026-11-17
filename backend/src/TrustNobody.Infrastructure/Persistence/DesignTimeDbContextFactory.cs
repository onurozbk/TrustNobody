using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TrustNobody.Infrastructure.Persistence;

/// <summary>`dotnet ef migrations add ...` için. Çalışma anında bağlantı ayarlardan gelir.</summary>
internal sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>();
        DependencyInjection.ConfigureDb(options,
            Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Port=5432;Database=trustnobody;Username=trustnobody;Password=trustnobody");
        return new AppDbContext(options.Options);
    }
}
