using Microsoft.EntityFrameworkCore;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Persistence;

public static class AuthorizationSeeder
{
    public static async Task SeedAsync(PropriumDbContext database, CancellationToken cancellationToken = default)
    {
        var administrator = await EnsureRoleAsync(database, "Administrator", "Full Week 3 administrative access.", cancellationToken);
        var member = await EnsureRoleAsync(database, "Member", "Minimum authenticated-user access.", cancellationToken);
        var permissions = await EnsurePermissionsAsync(database, cancellationToken);
        await EnsureMappingsAsync(database, administrator, PermissionCatalog.All.Select(item => item.Key), permissions, cancellationToken);
        await EnsureMappingsAsync(database, member, ["application.authenticated.access", "identity.profile.read-self", "identity.session.manage-self"], permissions, cancellationToken);
        await database.SaveChangesAsync(cancellationToken);
    }

    private static async Task<Role> EnsureRoleAsync(PropriumDbContext database, string name, string description, CancellationToken cancellationToken)
    {
        var normalized = IdentityNormalization.NormalizeRoleName(name);
        var role = await database.Roles.SingleOrDefaultAsync(item => item.NormalizedName == normalized, cancellationToken);
        if (role is null) { role = new Role { Name = name, NormalizedName = normalized, Description = description }; database.Roles.Add(role); }
        else { role.Name = name; role.Description = description; role.UpdatedAtUtc = DateTimeOffset.UtcNow; }
        return role;
    }

    private static async Task<Dictionary<string, Permission>> EnsurePermissionsAsync(PropriumDbContext database, CancellationToken cancellationToken)
    {
        var existing = await database.Permissions.ToDictionaryAsync(item => item.Key, StringComparer.Ordinal, cancellationToken);
        foreach (var definition in PermissionCatalog.All)
        {
            if (!existing.TryGetValue(definition.Key, out var permission)) { permission = new Permission { Key = definition.Key, Description = definition.Description, CapabilityGroup = definition.CapabilityGroup }; database.Permissions.Add(permission); existing.Add(definition.Key, permission); }
            else { permission.Description = definition.Description; permission.CapabilityGroup = definition.CapabilityGroup; permission.UpdatedAtUtc = DateTimeOffset.UtcNow; }
        }
        return existing;
    }

    private static async Task EnsureMappingsAsync(PropriumDbContext database, Role role, IEnumerable<string> keys, IReadOnlyDictionary<string, Permission> permissions, CancellationToken cancellationToken)
    {
        var assigned = await database.RolePermissions.Where(item => item.RoleId == role.Id).Select(item => item.PermissionId).ToListAsync(cancellationToken);
        foreach (var key in keys) if (!assigned.Contains(permissions[key].Id)) database.RolePermissions.Add(new RolePermission { Role = role, Permission = permissions[key] });
    }
}
