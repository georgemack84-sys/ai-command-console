using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresPasswordResetService(
    PropriumDbContext database,
    IUserPasswordHasher passwords,
    ISessionTokenGenerator tokens,
    IRecoveryContactDelivery delivery,
    IOptions<RecoveryContactEmailOptions> emailOptions,
    TimeProvider timeProvider) : IPasswordResetService
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(15);

    public async Task RequestAsync(RequestPasswordResetAttempt attempt, CancellationToken cancellationToken = default)
    {
        if (attempt.IsRateLimited)
        {
            await RecordSuppressedAsync(attempt.CorrelationId, "rate-limited", cancellationToken);
            return;
        }
        var email = NormalizeEmail(attempt.Email);
        if (email is null)
        {
            await RecordSuppressedAsync(attempt.CorrelationId, "invalid-contact", cancellationToken);
            return;
        }

        var contact = await database.RecoveryContacts.Include(item => item.User)
            .SingleOrDefaultAsync(item => item.NormalizedEmail == email && item.VerifiedAtUtc != null && item.User.IsActive, cancellationToken);
        if (contact is null)
        {
            await RecordSuppressedAsync(attempt.CorrelationId, "unavailable-contact", cancellationToken);
            return;
        }

        var now = timeProvider.GetUtcNow();
        var generated = tokens.Generate();
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var activeTokens = await database.PasswordResetTokens.Where(item => item.UserId == contact.UserId && item.ConsumedAtUtc == null && item.SupersededAtUtc == null && item.ExpiresAtUtc > now).ToListAsync(cancellationToken);
        foreach (var token in activeTokens) token.SupersededAtUtc = now;
        var reset = new PasswordResetToken { UserId = contact.UserId, User = contact.User, TokenHash = generated.Hash.Value, RequestedAtUtc = now, ExpiresAtUtc = now.Add(Lifetime) };
        database.PasswordResetTokens.Add(reset);
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.PasswordResetRequested, AuthenticationEventOutcome.Success, attempt.CorrelationId, contact.UserId, normalizedUsername: contact.User.NormalizedUsername));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var sent = await delivery.DeliverPasswordResetAsync(new PasswordResetDelivery(contact.UserId, contact.Email, generated.RawToken, reset.ExpiresAtUtc, emailOptions.Value.PublicApplicationOrigin ?? string.Empty), cancellationToken);
        if (sent) return;

        reset.SupersededAtUtc = timeProvider.GetUtcNow();
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.PasswordResetSuppressed, AuthenticationEventOutcome.Denied, attempt.CorrelationId, contact.UserId, normalizedUsername: contact.User.NormalizedUsername, reasonCode: "delivery-unavailable"));
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> CompleteAsync(CompletePasswordResetAttempt attempt, CancellationToken cancellationToken = default)
    {
        if (!tokens.IsStructurallyValid(attempt.Token)) return false;
        var now = timeProvider.GetUtcNow();
        var tokenHash = tokens.Hash(attempt.Token).Value;
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var reset = await database.PasswordResetTokens.Include(item => item.User).SingleOrDefaultAsync(item => item.TokenHash == tokenHash, cancellationToken);
        if (reset is null || reset.ConsumedAtUtc is not null || reset.SupersededAtUtc is not null || reset.ExpiresAtUtc <= now || !reset.User.IsActive)
        {
            await transaction.RollbackAsync(cancellationToken);
            return false;
        }

        reset.User.PasswordHash = passwords.Hash(reset.User, attempt.NewPassword);
        reset.User.SecurityVersion++;
        reset.User.UpdatedAtUtc = now;
        reset.ConsumedAtUtc = now;
        var sessions = await database.Sessions.Where(item => item.UserId == reset.UserId && item.RevokedAtUtc == null).ToListAsync(cancellationToken);
        foreach (var session in sessions) { session.RevokedAtUtc = now; session.RevocationReason = "password-reset"; }
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.PasswordResetSucceeded, AuthenticationEventOutcome.Success, attempt.CorrelationId, reset.UserId, normalizedUsername: reset.User.NormalizedUsername));
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.SecurityVersionInvalidated, AuthenticationEventOutcome.Success, attempt.CorrelationId, reset.UserId, normalizedUsername: reset.User.NormalizedUsername, reasonCode: "password-reset"));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private async Task RecordSuppressedAsync(string correlationId, string reason, CancellationToken cancellationToken)
    {
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.PasswordResetSuppressed, AuthenticationEventOutcome.Denied, correlationId, reasonCode: reason));
        await database.SaveChangesAsync(cancellationToken);
    }

    private static string? NormalizeEmail(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        if (normalized.Length is < 3 or > 320 || normalized.Count(character => character == '@') != 1) return null;
        var at = normalized.IndexOf('@', StringComparison.Ordinal);
        return at is 0 or -1 || at == normalized.Length - 1 || normalized.Contains(' ') ? null : normalized;
    }
}
