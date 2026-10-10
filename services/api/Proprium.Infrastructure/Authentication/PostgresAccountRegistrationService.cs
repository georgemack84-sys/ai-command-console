using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using Proprium.Application.Authentication;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresAccountRegistrationService(
    PropriumDbContext database,
    IUserPasswordHasher passwordHasher,
    ISessionTokenGenerator tokenGenerator,
    IOptions<SessionOptions> sessions,
    TimeProvider timeProvider) : IAccountRegistrationService
{
    public async Task<AccountRegistrationResult> RegisterAsync(AccountRegistrationAttempt attempt, CancellationToken cancellationToken = default)
    {
        var username = attempt.Username.Trim();
        var displayName = attempt.DisplayName.Trim();
        var normalizedUsername = IdentityNormalization.NormalizeUsername(username);
        if (await database.Users.AnyAsync(user => user.NormalizedUsername == normalizedUsername, cancellationToken))
            return AccountRegistrationResult.UsernameTaken();

        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var member = await database.Roles.SingleAsync(role => role.NormalizedName == "MEMBER", cancellationToken);
            var nowUtc = timeProvider.GetUtcNow();
            var user = new User
            {
                Username = username,
                NormalizedUsername = normalizedUsername,
                DisplayName = displayName,
                UpdatedAtUtc = nowUtc,
            };
            user.PasswordHash = passwordHasher.Hash(user, attempt.Password);
            var household = new Household
            {
                OwnerUserId = user.Id,
                Name = $"{displayName}'s household",
                UpdatedAtUtc = nowUtc,
            };
            var generated = tokenGenerator.Generate();
            var session = SessionFactory.Create(user, generated.Hash.Value, nowUtc.Add(sessions.Value.Lifetime), nowUtc);

            database.AddRange(
                user,
                household,
                new HouseholdMembership { Household = household, UserId = user.Id },
                new UserRole { User = user, Role = member },
                session,
                AuthenticationEventFactory.Create(AuthenticationEventType.AccountRegistered, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, normalizedUsername: normalizedUsername),
                AuthenticationEventFactory.Create(AuthenticationEventType.SessionCreated, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, session.Id));
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new AccountRegistrationResult(true, SessionToken: generated.RawToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(cancellationToken);
            database.ChangeTracker.Clear();
            return AccountRegistrationResult.UsernameTaken();
        }
    }
}
