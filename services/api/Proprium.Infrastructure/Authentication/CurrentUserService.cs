using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class CurrentUserService(ISessionService sessions, PropriumDbContext database) : ICurrentUserService
{
    public async Task<CurrentUser?> ResolveAsync(RawSessionToken rawToken, string correlationId, CancellationToken cancellationToken = default)
    {
        var result = await sessions.ValidateAsync(rawToken, cancellationToken);
        if (!result.IsValid || result.User is null)
        {
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(
                AuthenticationEventType.SessionRejected,
                AuthenticationEventOutcome.Denied,
                correlationId,
                result.User?.Id,
                result.Session?.Id,
                result.User?.NormalizedUsername,
                ReasonCode(result.Outcome)));
            await database.SaveChangesAsync(cancellationToken);
            return null;
        }
        var userId = result.User.Id;
        var roles = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .Select(assignment => assignment.Role.Name).Distinct().ToArrayAsync(cancellationToken);
        var permissions = await database.UserRoles.AsNoTracking().Where(assignment => assignment.UserId == userId)
            .SelectMany(assignment => assignment.Role.Permissions.Select(mapping => mapping.Permission.Key)).Distinct().ToArrayAsync(cancellationToken);
        return new CurrentUser(
            userId,
            result.User.Username,
            result.User.DisplayName,
            roles.OrderBy(name => name, StringComparer.Ordinal).ToArray(),
            permissions.OrderBy(key => key, StringComparer.Ordinal).ToArray());
    }

    private static string ReasonCode(SessionValidationOutcome outcome) => outcome switch
    {
        SessionValidationOutcome.Malformed => "malformed-token",
        SessionValidationOutcome.Missing => "missing-session",
        SessionValidationOutcome.Expired => "expired-session",
        SessionValidationOutcome.Revoked => "revoked-session",
        SessionValidationOutcome.DisabledUser => "disabled-user",
        SessionValidationOutcome.SecurityVersionMismatch => "security-version-mismatch",
        SessionValidationOutcome.Unavailable => "authoritative-storage-unavailable",
        _ => "unknown-rejection"
    };
}
