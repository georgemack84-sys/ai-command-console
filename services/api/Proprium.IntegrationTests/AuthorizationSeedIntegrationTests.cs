using Microsoft.EntityFrameworkCore;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class AuthorizationSeedIntegrationTests
{
    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    [Fact]
    public async Task Repeated_seed_matches_the_canonical_catalog_and_baseline_mappings()
    {
        await using var database = CreateContext();
        await AuthorizationSeeder.SeedAsync(database);
        await AuthorizationSeeder.SeedAsync(database);

        var catalogKeys = PermissionCatalog.All.Select(item => item.Key).OrderBy(key => key, StringComparer.Ordinal).ToArray();
        var persistedKeys = await database.Permissions
            .Where(item => catalogKeys.Contains(item.Key))
            .Select(item => item.Key)
            .OrderBy(key => key)
            .ToArrayAsync();
        Assert.Equal(catalogKeys, persistedKeys);

        var administrator = await database.Roles.SingleAsync(item => item.NormalizedName == "ADMINISTRATOR");
        var administratorKeys = await database.RolePermissions
            .Where(item => item.RoleId == administrator.Id)
            .Select(item => item.Permission.Key)
            .OrderBy(key => key)
            .ToArrayAsync();
        Assert.Equal(catalogKeys, administratorKeys);

        var member = await database.Roles.SingleAsync(item => item.NormalizedName == "MEMBER");
        var memberKeys = await database.RolePermissions
            .Where(item => item.RoleId == member.Id)
            .Select(item => item.Permission.Key)
            .OrderBy(key => key)
            .ToArrayAsync();
        Assert.Equal(new[] { "application.authenticated.access", "identity.profile.read-self", "identity.session.manage-self" }, memberKeys);
    }
}
