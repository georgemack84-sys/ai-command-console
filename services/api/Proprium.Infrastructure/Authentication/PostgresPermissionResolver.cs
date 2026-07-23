using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresPermissionResolver(PropriumDbContext database) : IPermissionResolver
{
    public async Task<PermissionContext> ResolveAsync(Guid userId, long securityVersion, CancellationToken cancellationToken = default)
    {
        if (securityVersion <= 0) throw new ArgumentOutOfRangeException(nameof(securityVersion));
        var permissions = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .SelectMany(assignment => assignment.Role.Permissions.Select(mapping => mapping.Permission.Key))
            .Distinct().ToArrayAsync(cancellationToken);
        var canonical = PermissionCatalog.All.Select(item => item.Key).ToHashSet(StringComparer.Ordinal);
        if (permissions.Any(permission => !canonical.Contains(permission)))
            throw new InvalidOperationException("A role assignment contains an unknown permission.");
        return new PermissionContext(permissions.OrderBy(permission => permission, StringComparer.Ordinal).ToArray());
    }
}
