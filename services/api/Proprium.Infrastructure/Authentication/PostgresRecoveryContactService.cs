using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresRecoveryContactService(
    PropriumDbContext database,
    IUserPasswordHasher passwords,
    ISessionTokenGenerator tokens,
    IRecoveryContactDelivery delivery,
    TimeProvider timeProvider) : IRecoveryContactService
{
    private static readonly TimeSpan VerificationLifetime = TimeSpan.FromMinutes(15);

    public async Task<RecoveryContactDetails> GetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var contact = await database.RecoveryContacts.AsNoTracking().SingleOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        var now = timeProvider.GetUtcNow();
        return contact is null
            ? new RecoveryContactDetails(null, false, false)
            : new RecoveryContactDetails(Mask(contact.Email), contact.VerifiedAtUtc is not null, contact.VerificationTokenHash is not null && contact.VerificationExpiresAtUtc > now);
    }

    public async Task<BeginRecoveryContactVerificationResult> BeginVerificationAsync(BeginRecoveryContactVerificationAttempt attempt, CancellationToken cancellationToken = default)
    {
        var user = await database.Users.SingleOrDefaultAsync(item => item.Id == attempt.UserId, cancellationToken);
        if (user is null)
        {
            await RecordAsync(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, attempt.UserId, attempt.SessionId, "current-password", cancellationToken);
            return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Unauthorized);
        }
        if (passwords.Verify(user, user.PasswordHash, attempt.CurrentPassword) is PasswordVerificationOutcome.Failed)
        {
            await RecordAsync(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, attempt.UserId, attempt.SessionId, "current-password", cancellationToken);
            return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Unauthorized);
        }

        var email = NormalizeEmail(attempt.Email);
        if (email is null)
        {
            await RecordAsync(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, user.Id, attempt.SessionId, "invalid-contact", cancellationToken);
            return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Conflict);
        }

        var existing = await database.RecoveryContacts.SingleOrDefaultAsync(item => item.UserId == user.Id, cancellationToken);
        var emailInUse = await database.RecoveryContacts.AnyAsync(item => item.UserId != user.Id && item.NormalizedEmail == email, cancellationToken);
        if (emailInUse || existing?.VerifiedAtUtc is not null)
        {
            await RecordAsync(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, user.Id, attempt.SessionId, "contact-unavailable", cancellationToken);
            return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Conflict);
        }

        var generated = tokens.Generate();
        var now = timeProvider.GetUtcNow();
        var contact = existing ?? new RecoveryContact { UserId = user.Id, User = user };
        contact.Email = email;
        contact.NormalizedEmail = email;
        contact.VerificationTokenHash = generated.Hash.Value;
        var expiresAtUtc = now.Add(VerificationLifetime);
        contact.VerificationExpiresAtUtc = expiresAtUtc;
        contact.VerifiedAtUtc = null;
        contact.UpdatedAtUtc = now;
        if (existing is null) database.RecoveryContacts.Add(contact);
        await database.SaveChangesAsync(cancellationToken);

        var delivered = await delivery.DeliverVerificationAsync(new RecoveryContactVerificationDelivery(user.Id, email, generated.RawToken, expiresAtUtc), cancellationToken);
        if (!delivered)
        {
            contact.VerificationTokenHash = null;
            contact.VerificationExpiresAtUtc = null;
            contact.UpdatedAtUtc = timeProvider.GetUtcNow();
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, user.Id, attempt.SessionId, user.NormalizedUsername, "delivery-unavailable"));
            await database.SaveChangesAsync(cancellationToken);
            return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Unavailable);
        }

        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.RecoveryContactVerificationRequested, AuthenticationEventOutcome.Success, attempt.CorrelationId, user.Id, attempt.SessionId, user.NormalizedUsername));
        await database.SaveChangesAsync(cancellationToken);
        return new BeginRecoveryContactVerificationResult(BeginRecoveryContactVerificationOutcome.Sent);
    }

    public async Task<CompleteRecoveryContactVerificationResult> CompleteVerificationAsync(CompleteRecoveryContactVerificationAttempt attempt, CancellationToken cancellationToken = default)
    {
        var contact = await database.RecoveryContacts.Include(item => item.User).SingleOrDefaultAsync(item => item.UserId == attempt.UserId, cancellationToken);
        var now = timeProvider.GetUtcNow();
        if (contact is null || contact.VerificationTokenHash is null || contact.VerificationExpiresAtUtc <= now || !tokens.IsStructurallyValid(attempt.Token) || !HashesMatch(contact.VerificationTokenHash, tokens.Hash(attempt.Token).Value))
        {
            await RecordAsync(AuthenticationEventType.RecoveryContactVerificationDenied, AuthenticationEventOutcome.Denied, attempt.CorrelationId, attempt.UserId, attempt.SessionId, "invalid-token", cancellationToken);
            return new CompleteRecoveryContactVerificationResult(CompleteRecoveryContactVerificationOutcome.Invalid);
        }

        contact.VerificationTokenHash = null;
        contact.VerificationExpiresAtUtc = null;
        contact.VerifiedAtUtc = now;
        contact.UpdatedAtUtc = now;
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.RecoveryContactVerified, AuthenticationEventOutcome.Success, attempt.CorrelationId, contact.UserId, attempt.SessionId, contact.User.NormalizedUsername));
        await database.SaveChangesAsync(cancellationToken);
        return new CompleteRecoveryContactVerificationResult(CompleteRecoveryContactVerificationOutcome.Verified);
    }

    private async Task RecordAsync(AuthenticationEventType type, AuthenticationEventOutcome outcome, string correlationId, Guid userId, Guid sessionId, string reason, CancellationToken cancellationToken)
    {
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(type, outcome, correlationId, userId, sessionId, reasonCode: reason));
        await database.SaveChangesAsync(cancellationToken);
    }

    private static string? NormalizeEmail(string email)
    {
        var normalized = email.Trim().ToUpperInvariant();
        if (normalized.Length is < 3 or > 320 || normalized.Count(character => character == '@') != 1) return null;
        var at = normalized.IndexOf('@', StringComparison.Ordinal);
        return at is 0 or -1 || at == normalized.Length - 1 || normalized.Contains(' ') ? null : normalized;
    }

    private static bool HashesMatch(string expected, string actual) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(actual));

    private static string Mask(string email)
    {
        var at = email.IndexOf('@', StringComparison.Ordinal);
        if (at <= 1) return $"*{email[at..]}";
        return $"{email[0]}***{email[at..]}";
    }
}
