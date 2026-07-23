using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Proprium.Infrastructure.Persistence;

public sealed class PropriumDbContextFactory : IDesignTimeDbContextFactory<PropriumDbContext>
{
    public PropriumDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PropriumDbContext>()
            .UseNpgsql("Host=localhost;Port=55432;Database=proprium;Username=proprium;Password=change-me")
            .Options;
        return new PropriumDbContext(options);
    }
}
