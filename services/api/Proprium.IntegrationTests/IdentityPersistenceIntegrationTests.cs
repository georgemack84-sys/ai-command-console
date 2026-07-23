using Microsoft.EntityFrameworkCore;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class IdentityPersistenceIntegrationTests
{
    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    [Fact]
    public async Task PostgreSQL_enforces_unique_normalized_usernames()
    {
        var normalized = $"USER-{Guid.NewGuid():N}";
        await using (var setup = CreateContext())
        {
            setup.Users.Add(new User { Username = normalized.ToLowerInvariant(), NormalizedUsername = normalized, PasswordHash = "test" });
            await setup.SaveChangesAsync();
        }

        await using var duplicate = CreateContext();
        duplicate.Users.Add(new User { Username = $"other-{Guid.NewGuid():N}", NormalizedUsername = normalized, PasswordHash = "test" });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicate.SaveChangesAsync());
    }

    [Fact]
    public async Task PostgreSQL_enforces_unique_normalized_role_names_and_permission_keys()
    {
        var normalizedRole = $"ROLE-{Guid.NewGuid():N}";
        var permissionKey = $"test.unique.{Guid.NewGuid():N}";
        await using (var setup = CreateContext())
        {
            setup.AddRange(
                new Role { Name = normalizedRole.ToLowerInvariant(), NormalizedName = normalizedRole },
                new Permission { Key = permissionKey, Description = "Unique permission.", CapabilityGroup = "test" });
            await setup.SaveChangesAsync();
        }

        await using var duplicateRole = CreateContext();
        duplicateRole.Roles.Add(new Role { Name = $"other-{Guid.NewGuid():N}", NormalizedName = normalizedRole });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicateRole.SaveChangesAsync());

        await using var duplicatePermission = CreateContext();
        duplicatePermission.Permissions.Add(new Permission { Key = permissionKey, Description = "Duplicate permission.", CapabilityGroup = "test" });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicatePermission.SaveChangesAsync());
    }

    [Fact]
    public async Task PostgreSQL_enforces_unique_session_token_hashes()
    {
        var tokenHash = Guid.NewGuid().ToString("N");
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        await using (var setup = CreateContext())
        {
            setup.Users.Add(user);
            await setup.SaveChangesAsync();
            setup.Sessions.Add(new Session { UserId = user.Id, TokenHash = tokenHash, SecurityVersionSnapshot = 1, ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
            await setup.SaveChangesAsync();
        }

        await using var duplicate = CreateContext();
        duplicate.Sessions.Add(new Session { UserId = user.Id, TokenHash = tokenHash, SecurityVersionSnapshot = 1, ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicate.SaveChangesAsync());
    }

    [Fact]
    public async Task PostgreSQL_enforces_unique_user_role_and_role_permission_pairs()
    {
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var permission = new Permission { Key = $"test.pair.{Guid.NewGuid():N}", Description = "Pair constraint permission.", CapabilityGroup = "test" };
        await using (var setup = CreateContext())
        {
            setup.AddRange(user, role, permission, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = permission });
            await setup.SaveChangesAsync();
        }

        await using var duplicateUserRole = CreateContext();
        duplicateUserRole.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicateUserRole.SaveChangesAsync());

        await using var duplicateRolePermission = CreateContext();
        duplicateRolePermission.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicateRolePermission.SaveChangesAsync());
    }

    [Fact]
    public async Task Authentication_events_are_immutable_after_persistence()
    {
        var eventId = Guid.NewGuid();
        await using (var setup = CreateContext())
        {
            setup.AuthenticationEvents.Add(new AuthenticationEvent
            {
                Id = eventId,
                EventType = AuthenticationEventType.LoginFailed,
                Outcome = AuthenticationEventOutcome.Failure,
                CorrelationId = "correlation-original",
                ReasonCode = "invalid-credentials"
            });
            await setup.SaveChangesAsync();
        }

        await using var mutation = CreateContext();
        var authenticationEvent = await mutation.AuthenticationEvents.SingleAsync(item => item.Id == eventId);
        mutation.Entry(authenticationEvent).Property(item => item.CorrelationId).CurrentValue = "correlation-mutated";
        await Assert.ThrowsAsync<InvalidOperationException>(() => mutation.SaveChangesAsync());
    }
}
