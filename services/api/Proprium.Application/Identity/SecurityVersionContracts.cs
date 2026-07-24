namespace Proprium.Application.Identity;

public interface ISecurityVersionInvalidator
{
    Task IncrementAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AssignRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default);
    Task RemoveRoleAsync(Guid userId, Guid roleId, CancellationToken cancellationToken = default);
    Task ReplaceRolePermissionsAsync(Guid roleId, IReadOnlyCollection<Guid> permissionIds, CancellationToken cancellationToken = default);
}
