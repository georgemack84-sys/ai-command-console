using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class CurrentUserService(ISessionService sessions, PropriumDbContext database) : ICurrentUserService
{
    public async Task<CurrentUser?> ResolveAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default)
    {
        var result = await sessions.ValidateAsync(rawToken, cancellationToken);
        if (!result.IsValid || result.User is null) return null;
        var userId = result.User.Id;
        var roles = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .Select(assignment => assignment.Role.Name).Distinct().OrderBy(name => name).ToArrayAsync(cancellationToken);
        var permissions = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .SelectMany(assignment => assignment.Role.Permissions.Select(mapping => mapping.Permission.Key)).Distinct().OrderBy(key => key).ToArrayAsync(cancellationToken);
        return new CurrentUser(userId, result.User.Username, result.User.DisplayName, roles, permissions);
    }
}
