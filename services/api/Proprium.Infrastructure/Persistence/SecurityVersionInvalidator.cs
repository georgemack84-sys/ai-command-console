using Microsoft.EntityFrameworkCore;
using Proprium.Application.Identity;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Persistence;

public sealed class SecurityVersionInvalidator(PropriumDbContext database) : ISecurityVersionInvalidator
{
    public async Task IncrementAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var affected = await database.Users.Where(user => user.Id == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(user => user.SecurityVersion, user => user.SecurityVersion + 1), cancellationToken);
        if (affected != 1) throw new InvalidOperationException("The user to invalidate does not exist.");
    }

    public async Task AssignRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        if (await database.UserRoles.AnyAsync(item => item.UserId == userId && item.RoleId == roleId, cancellationToken)) return;
        database.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId });
        await database.SaveChangesAsync(cancellationToken);
        await IncrementAsync(userId, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task RemoveRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var affected = await database.UserRoles.Where(item => item.UserId == userId && item.RoleId == roleId).ExecuteDeleteAsync(cancellationToken);
        if (affected == 0) return;
        await IncrementAsync(userId, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task ReplaceRolePermissionsAsync(Guid roleId, IReadOnlyCollection<Guid> permissionIds, CancellationToken cancellationToken = default)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var userIds = await database.UserRoles.Where(item => item.RoleId == roleId).Select(item => item.UserId).ToArrayAsync(cancellationToken);
        var current = await database.RolePermissions.Where(item => item.RoleId == roleId).ToListAsync(cancellationToken);
        var requested = permissionIds.Distinct().ToHashSet();
        var currentIds = current.Select(item => item.PermissionId).ToHashSet();
        if (currentIds.SetEquals(requested))
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        database.RolePermissions.RemoveRange(current.Where(item => !requested.Contains(item.PermissionId)));
        database.RolePermissions.AddRange(requested.Except(currentIds).Select(permissionId => new RolePermission { RoleId = roleId, PermissionId = permissionId }));
        await database.SaveChangesAsync(cancellationToken);
        if (userIds.Length > 0)
        {
            var updated = await database.Users.Where(user => userIds.Contains(user.Id)).ExecuteUpdateAsync(setters => setters.SetProperty(user => user.SecurityVersion, user => user.SecurityVersion + 1), cancellationToken);
            if (updated != userIds.Length) throw new InvalidOperationException("Not every affected user was invalidated.");
        }
        await transaction.CommitAsync(cancellationToken);
    }
}
