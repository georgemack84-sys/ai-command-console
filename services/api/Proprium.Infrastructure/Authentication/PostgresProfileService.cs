using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresProfileService(PropriumDbContext database, TimeProvider timeProvider) : IProfileService
{
    public async Task<ProfileUpdateResult> UpdateDisplayNameAsync(ProfileUpdateAttempt attempt, CancellationToken cancellationToken = default)
    {
        var user = await database.Users.FindAsync([attempt.UserId], cancellationToken);
        if (user is null) return new ProfileUpdateResult(false);

        user.DisplayName = attempt.DisplayName;
        user.UpdatedAtUtc = timeProvider.GetUtcNow();
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(
            AuthenticationEventType.ProfileUpdated,
            AuthenticationEventOutcome.Success,
            attempt.CorrelationId,
            user.Id,
            attempt.SessionId,
            user.NormalizedUsername));
        await database.SaveChangesAsync(cancellationToken);
        return new ProfileUpdateResult(true, user.DisplayName);
    }
}
