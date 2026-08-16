using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Application.Caching;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Authentication;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class PermissionResolutionIntegrationTests : IIntegrationTest
{
    [Fact]
    public async Task Version_keyed_cache_hit_does_not_outlive_a_security_version_change()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var permission = await database.Permissions.SingleAsync(item => item.Key == "identity.profile.read-self");
        database.AddRange(user, role, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = permission });
        await database.SaveChangesAsync();

        var cache = new MemoryCache();
        var resolver = new PostgresPermissionResolver(database, cache);
        Assert.Equal([permission.Key], (await resolver.ResolveAsync(user.Id, 1)).Permissions);

        await database.RolePermissions.Where(item => item.RoleId == role.Id).ExecuteDeleteAsync();

        Assert.Equal([permission.Key], (await resolver.ResolveAsync(user.Id, 1)).Permissions);
        Assert.Empty((await resolver.ResolveAsync(user.Id, 2)).Permissions);
        Assert.Contains($"authz:permissions:{user.Id:D}:1", cache.Keys);
        Assert.Contains($"authz:permissions:{user.Id:D}:2", cache.Keys);
    }

    [Fact]
    public async Task Unavailable_or_corrupt_permission_cache_falls_back_to_postgresql()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
        var permission = await database.Permissions.SingleAsync(item => item.Key == "identity.profile.read-self");
        database.AddRange(user, role, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = permission });
        await database.SaveChangesAsync();

        var cache = new MemoryCache { ReadStatus = CacheOperationStatus.Unavailable };
        var resolver = new PostgresPermissionResolver(database, cache);
        Assert.Equal([permission.Key], (await resolver.ResolveAsync(user.Id, 1)).Permissions);

        cache.ReadStatus = CacheOperationStatus.Success;
        cache.SetRaw($"authz:permissions:{user.Id:D}:2", new PermissionCacheEntry(["unknown.permission"]));
        Assert.Equal([permission.Key], (await resolver.ResolveAsync(user.Id, 2)).Permissions);
    }

    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    private sealed class MemoryCache : IPlatformCache
    {
        private readonly Dictionary<string, object> entries = new(StringComparer.Ordinal);

        public CacheOperationStatus ReadStatus { get; set; } = CacheOperationStatus.Miss;
        public ICollection<string> Keys => entries.Keys;

        public Task<CacheReadResult<T>> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            if (ReadStatus != CacheOperationStatus.Success) return Task.FromResult(CacheReadResult<T>.Failure(ReadStatus));
            return entries.TryGetValue(key, out var value) && value is T typed
                ? Task.FromResult(CacheReadResult<T>.Success(typed))
                : Task.FromResult(CacheReadResult<T>.Failure(CacheOperationStatus.Miss));
        }

        public Task<CacheWriteResult> SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(value);
            entries[key] = value;
            ReadStatus = CacheOperationStatus.Success;
            return Task.FromResult(new CacheWriteResult(CacheOperationStatus.Success));
        }

        public Task<CacheRemoveResult> RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            entries.Remove(key);
            return Task.FromResult(new CacheRemoveResult(CacheOperationStatus.Success));
        }

        public void SetRaw(string key, object value) => entries[key] = value;
    }
}
