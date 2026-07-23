using Proprium.Application.Caching;
using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresPermissionResolver(PropriumDbContext database, IPlatformCache cache) : IPermissionResolver
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromSeconds(60);

    public async Task<PermissionContext> ResolveAsync(Guid userId, long securityVersion, CancellationToken cancellationToken = default)
    {
        if (securityVersion <= 0) throw new ArgumentOutOfRangeException(nameof(securityVersion));
        var cacheKey = $"authz:permissions:{userId:D}:{securityVersion}";
        var cached = await cache.GetAsync<PermissionCacheEntry>(cacheKey, cancellationToken);
        if (cached.Status == CacheOperationStatus.Success && IsCanonical(cached.Value.Permissions))
            return CreateContext(cached.Value.Permissions);

        var permissions = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .SelectMany(assignment => assignment.Role.Permissions.Select(mapping => mapping.Permission.Key))
            .Distinct().ToArrayAsync(cancellationToken);
        if (!IsCanonical(permissions))
            throw new InvalidOperationException("A role assignment contains an unknown permission.");

        var context = CreateContext(permissions);
        await cache.SetAsync(cacheKey, new PermissionCacheEntry(context.Permissions), CacheLifetime, cancellationToken);
        return context;
    }

    private static bool IsCanonical(IReadOnlyList<string>? permissions)
    {
        if (permissions is null || permissions.Count > PermissionCatalog.All.Count) return false;
        var canonical = PermissionCatalog.All.Select(item => item.Key).ToHashSet(StringComparer.Ordinal);
        return permissions.All(canonical.Contains) && permissions.Distinct(StringComparer.Ordinal).Count() == permissions.Count;
    }

    private static PermissionContext CreateContext(IEnumerable<string> permissions) =>
        new(permissions.OrderBy(permission => permission, StringComparer.Ordinal).ToArray());
}
