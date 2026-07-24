using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class LocalAdministratorIntegrationTests
{
    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    [Fact]
    public async Task Missing_local_administrator_credentials_fail_without_persistence()
    {
        await using var database = CreateContext();
        var initializer = new LocalAdministratorInitializer(database, new PasswordHasher<User>());
        await Assert.ThrowsAsync<InvalidOperationException>(() => initializer.InitializeAsync("", "secret"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => initializer.InitializeAsync("admin", ""));
        Assert.False(await database.Users.AnyAsync(item => item.NormalizedUsername == "ADMIN"));
    }

    [Fact]
    public async Task Repeated_local_administrator_initialization_is_idempotent()
    {
        var username = $"admin-{Guid.NewGuid():N}";
        await using var database = CreateContext();
        await AuthorizationSeeder.SeedAsync(database);
        var initializer = new LocalAdministratorInitializer(database, new PasswordHasher<User>());

        await initializer.InitializeAsync(username, "not-a-committed-secret");
        await initializer.InitializeAsync(username, "not-a-committed-secret");

        var normalized = IdentityNormalization.NormalizeUsername(username);
        var user = await database.Users.SingleAsync(item => item.NormalizedUsername == normalized);
        Assert.Equal(1, await database.Users.CountAsync(item => item.NormalizedUsername == normalized));
        Assert.Equal(1, await database.UserRoles.CountAsync(item => item.UserId == user.Id && item.Role.NormalizedName == "ADMINISTRATOR"));
    }
}
