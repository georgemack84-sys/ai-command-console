using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Proprium.Infrastructure.Persistence;

public sealed class PropriumDbContextFactory : IDesignTimeDbContextFactory<PropriumDbContext>
{
    private const string SyntheticConnectionString =
        "Host=postgres.design-time.invalid;Port=5432;Database=proprium_design_metadata;Username=design_metadata;Password=synthetic-not-connected;Timeout=1";

    public PropriumDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PropriumDbContext>()
            .UseNpgsql(SyntheticConnectionString)
            .Options;
        return new PropriumDbContext(options);
    }
}
