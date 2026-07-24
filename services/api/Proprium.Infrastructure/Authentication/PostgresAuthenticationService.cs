using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresAuthenticationService(PropriumDbContext database, IUserPasswordHasher passwordHasher, ISessionTokenGenerator tokenGenerator, IOptions<SessionOptions> sessions, TimeProvider timeProvider) : IAuthenticationService
{
    private static readonly string DummyHash = new PasswordHasher<User>().HashPassword(new User(), "dummy-password-not-a-user-secret");

    public async Task<LoginResult> LoginAsync(LoginAttempt attempt, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(attempt.Username) || string.IsNullOrWhiteSpace(attempt.Password)) return LoginResult.Rejected();
        var normalized = IdentityNormalization.NormalizeUsername(attempt.Username);
        var user = await database.Users.SingleOrDefaultAsync(item => item.NormalizedUsername == normalized, cancellationToken);
        if (user is null)
        {
            passwordHasher.Verify(new User(), DummyHash, attempt.Password);
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.LoginFailed, AuthenticationEventOutcome.Failure, attempt.CorrelationId, normalizedUsername: normalized, reasonCode: "unknown-principal"));
            await database.SaveChangesAsync(cancellationToken);
            return LoginResult.Rejected();
        }

        var verification = passwordHasher.Verify(user, user.PasswordHash, attempt.Password);
        if (!user.IsActive || verification == PasswordVerificationOutcome.Failed)
        {
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.LoginFailed, AuthenticationEventOutcome.Failure, attempt.CorrelationId, user.Id, normalizedUsername: normalized, reasonCode: user.IsActive ? "password-mismatch" : "disabled-principal"));
            await database.SaveChangesAsync(cancellationToken);
            return LoginResult.Rejected();
        }

        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        if (verification == PasswordVerificationOutcome.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasher.Hash(user, attempt.Password);
            user.SecurityVersion++;
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.SecurityVersionInvalidated, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, normalizedUsername: normalized, reasonCode: "password-rehash"));
        }
        var nowUtc = timeProvider.GetUtcNow();
        var generated = tokenGenerator.Generate();
        var session = SessionFactory.Create(user, generated.Hash.Value, nowUtc.Add(sessions.Value.Lifetime), nowUtc);
        database.Sessions.Add(session);
        database.AuthenticationEvents.AddRange(
            AuthenticationEventFactory.Create(AuthenticationEventType.LoginSucceeded, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, normalizedUsername: normalized),
            AuthenticationEventFactory.Create(AuthenticationEventType.SessionCreated, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, session.Id));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new LoginResult(true, generated.RawToken);
    }

    public async Task LogoutAsync(RawSessionToken? sessionToken, string correlationId, CancellationToken cancellationToken = default)
    {
        if (sessionToken is null || !tokenGenerator.IsStructurallyValid(sessionToken)) return;
        var hash = tokenGenerator.Hash(sessionToken);
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var session = await database.Sessions.AsNoTracking().SingleOrDefaultAsync(item => item.TokenHash == hash.Value, cancellationToken);
        if (session is null || session.RevokedAtUtc is not null)
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var nowUtc = timeProvider.GetUtcNow();
        var revoked = await database.Sessions.Where(item => item.Id == session.Id && item.RevokedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.RevokedAtUtc, nowUtc).SetProperty(item => item.RevocationReason, "logout"), cancellationToken);
        if (revoked == 1)
        {
            database.AuthenticationEvents.AddRange(
                AuthenticationEventFactory.Create(AuthenticationEventType.Logout, AuthenticationEventOutcome.Success, correlationId, session.UserId, session.Id),
                AuthenticationEventFactory.Create(AuthenticationEventType.SessionRevoked, AuthenticationEventOutcome.Success, correlationId, session.UserId, session.Id, reasonCode: "logout"));
            await database.SaveChangesAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }
}
