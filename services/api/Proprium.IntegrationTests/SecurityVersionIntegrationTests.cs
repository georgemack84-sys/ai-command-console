using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;
using System.Data.Common;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class SecurityVersionIntegrationTests
{
    private static PropriumDbContext CreateContext(params IInterceptor[] interceptors)
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        var options = new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection);
        if (interceptors.Length > 0) options.AddInterceptors(interceptors);
        return new PropriumDbContext(options.Options);
    }

    [Fact]
    public async Task Role_assignment_increments_security_version_in_the_same_transaction()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        database.AddRange(user, role);
        await database.SaveChangesAsync();
        await new SecurityVersionInvalidator(database).AssignRoleAsync(user.Id, role.Id);
        await database.Entry(user).ReloadAsync();
        Assert.Equal(2, user.SecurityVersion);
        Assert.True(await database.UserRoles.AnyAsync(item => item.UserId == user.Id && item.RoleId == role.Id));
    }

    [Fact]
    public async Task Atomic_increment_updates_once_and_rejects_a_missing_user()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        database.Users.Add(user);
        await database.SaveChangesAsync();
        var invalidator = new SecurityVersionInvalidator(database);
        await invalidator.IncrementAsync(user.Id);
        await database.Entry(user).ReloadAsync();
        Assert.Equal(2, user.SecurityVersion);
        await Assert.ThrowsAsync<InvalidOperationException>(() => invalidator.IncrementAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task Concurrent_atomic_increments_do_not_lose_updates()
    {
        var userId = Guid.NewGuid();
        await using (var setup = CreateContext())
        {
            setup.Users.Add(new User
            {
                Id = userId,
                Username = $"user-{userId:N}",
                NormalizedUsername = $"USER-{userId:N}",
                PasswordHash = "test"
            });
            await setup.SaveChangesAsync();
        }

        const int incrementCount = 8;
        await Task.WhenAll(Enumerable.Range(0, incrementCount).Select(async _ =>
        {
            await using var database = CreateContext();
            await new SecurityVersionInvalidator(database).IncrementAsync(userId);
        }));

        await using var verification = CreateContext();
        var user = await verification.Users.SingleAsync(item => item.Id == userId);
        Assert.Equal(1 + incrementCount, user.SecurityVersion);
    }

    [Fact]
    public async Task Session_security_version_snapshot_must_be_positive()
    {
        await using var database = CreateContext();
        var user = new User
        {
            Username = $"user-{Guid.NewGuid():N}",
            NormalizedUsername = $"USER-{Guid.NewGuid():N}",
            PasswordHash = "test"
        };
        database.Users.Add(user);
        await database.SaveChangesAsync();

        database.Sessions.Add(new Session
        {
            UserId = user.Id,
            TokenHash = Guid.NewGuid().ToString("N"),
            SecurityVersionSnapshot = 0,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1)
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
    }

    [Fact]
    public async Task Failed_multi_user_invalidation_rolls_back_role_permission_changes()
    {
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var retained = new Permission { Key = $"test.retained.{Guid.NewGuid():N}", Description = "Retained permission.", CapabilityGroup = "test" };
        var requested = new Permission { Key = $"test.requested.{Guid.NewGuid():N}", Description = "Requested permission.", CapabilityGroup = "test" };
        await using (var setup = CreateContext())
        {
            setup.AddRange(role, user, retained, requested, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = retained });
            await setup.SaveChangesAsync();
        }

        await using (var mutation = CreateContext(new RejectSecurityVersionUpdateInterceptor()))
        {
            var invalidator = new SecurityVersionInvalidator(mutation);
            await Assert.ThrowsAsync<InvalidOperationException>(() => invalidator.ReplaceRolePermissionsAsync(role.Id, [requested.Id]));
        }

        await using var verification = CreateContext();
        Assert.True(await verification.RolePermissions.AnyAsync(item => item.RoleId == role.Id && item.PermissionId == retained.Id));
        Assert.False(await verification.RolePermissions.AnyAsync(item => item.RoleId == role.Id && item.PermissionId == requested.Id));
        Assert.Equal(1, await verification.Users.Where(item => item.Id == user.Id).Select(item => item.SecurityVersion).SingleAsync());
    }

    [Fact]
    public async Task Role_permission_change_invalidates_each_assigned_user_once()
    {
        await using var database = CreateContext();
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var first = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var second = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var permission = new Permission { Key = $"test.security.{Guid.NewGuid():N}", Description = "Test permission.", CapabilityGroup = "test" };
        database.AddRange(role, first, second, permission, new UserRole { User = first, Role = role }, new UserRole { User = second, Role = role });
        await database.SaveChangesAsync();
        await new SecurityVersionInvalidator(database).ReplaceRolePermissionsAsync(role.Id, [permission.Id]);
        await database.Entry(first).ReloadAsync(); await database.Entry(second).ReloadAsync();
        Assert.Equal(2, first.SecurityVersion); Assert.Equal(2, second.SecurityVersion);
        Assert.Equal(2, await database.AuthenticationEvents.CountAsync(item => item.EventType == AuthenticationEventType.SecurityVersionInvalidated && (item.UserId == first.Id || item.UserId == second.Id)));
    }

    [Fact]
    public async Task Unchanged_role_permissions_do_not_invalidate_assigned_users()
    {
        await using var database = CreateContext();
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var permission = new Permission { Key = $"test.security.{Guid.NewGuid():N}", Description = "Test permission.", CapabilityGroup = "test" };
        database.AddRange(role, user, permission, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = permission });
        await database.SaveChangesAsync();

        await new SecurityVersionInvalidator(database).ReplaceRolePermissionsAsync(role.Id, [permission.Id]);

        await database.Entry(user).ReloadAsync();
        Assert.Equal(1, user.SecurityVersion);
    }

    [Fact]
    public async Task Seed_is_idempotent_and_local_administrator_is_hashed()
    {
        await using var database = CreateContext();
        await AuthorizationSeeder.SeedAsync(database);
        await AuthorizationSeeder.SeedAsync(database);
        Assert.Equal(2, await database.Roles.CountAsync(item => item.NormalizedName == "ADMINISTRATOR" || item.NormalizedName == "MEMBER"));
        var username = $"admin-{Guid.NewGuid():N}";
        var initializer = new LocalAdministratorInitializer(database, new PasswordHasher<User>());
        await initializer.InitializeAsync(username, "not-a-committed-secret");
        var user = await database.Users.SingleAsync(item => item.NormalizedUsername == username.ToUpperInvariant());
        Assert.NotEqual("not-a-committed-secret", user.PasswordHash);
        Assert.True(await database.UserRoles.AnyAsync(item => item.UserId == user.Id && item.Role.NormalizedName == "ADMINISTRATOR"));
    }

    private sealed class RejectSecurityVersionUpdateInterceptor : DbCommandInterceptor
    {
        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(DbCommand command, CommandEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (command.CommandText.Contains("UPDATE users", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Simulated security-version update failure.");
            return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
        }
    }
}
