namespace Proprium.Application.Authentication;

public sealed record PermissionContext(IReadOnlyList<string> Permissions)
{
    public bool Contains(string permission) => Permissions.Contains(permission, StringComparer.Ordinal);
}

public sealed record AuthenticatedRequest(Guid UserId, string Username, string DisplayName, Guid SessionId, long SecurityVersion, IReadOnlyList<string> Roles, PermissionContext Permissions);

public interface IPermissionResolver
{
    Task<PermissionContext> ResolveAsync(Guid userId, long securityVersion, CancellationToken cancellationToken = default);
}

public sealed record PermissionCacheEntry(IReadOnlyList<string> Permissions);
