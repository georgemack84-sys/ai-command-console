using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Configuration;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresSessionService(ISessionRepository repository, ISessionTokenGenerator tokenGenerator, IOptions<SessionOptions> options, TimeProvider timeProvider) : ISessionService
{
    public async Task<CreatedSession> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        var nowUtc = timeProvider.GetUtcNow();
        var generated = tokenGenerator.Generate();
        var session = SessionFactory.Create(user, generated.Hash.Value, nowUtc.Add(options.Value.Lifetime), nowUtc);
        await repository.AddAsync(session, cancellationToken);
        return new CreatedSession(generated.RawToken, session.Id, session.ExpiresAtUtc);
    }

    public async Task<SessionValidationResult> ValidateAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default)
    {
        if (!tokenGenerator.IsStructurallyValid(rawToken)) return new SessionValidationResult(SessionValidationOutcome.Malformed);
        try
        {
            var session = await repository.FindByTokenHashAsync(tokenGenerator.Hash(rawToken), cancellationToken);
            if (session is null) return new SessionValidationResult(SessionValidationOutcome.Missing);
            if (session.ExpiresAtUtc <= timeProvider.GetUtcNow()) return new SessionValidationResult(SessionValidationOutcome.Expired);
            if (session.RevokedAtUtc is not null) return new SessionValidationResult(SessionValidationOutcome.Revoked);
            if (!session.User.IsActive) return new SessionValidationResult(SessionValidationOutcome.DisabledUser);
            if (session.SecurityVersionSnapshot != session.User.SecurityVersion) return new SessionValidationResult(SessionValidationOutcome.SecurityVersionMismatch);
            return new SessionValidationResult(SessionValidationOutcome.Valid, session.User, session);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch { return new SessionValidationResult(SessionValidationOutcome.Unavailable); }
    }

    public Task RevokeAsync(Guid sessionId, string reasonCode, CancellationToken cancellationToken = default) =>
        repository.RevokeAsync(sessionId, timeProvider.GetUtcNow(), NormalizeReason(reasonCode), cancellationToken);

    public async Task RevokeCurrentAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default)
    {
        if (!tokenGenerator.IsStructurallyValid(rawToken)) return;
        var session = await repository.FindByTokenHashAsync(tokenGenerator.Hash(rawToken), cancellationToken);
        if (session is not null) await RevokeAsync(session.Id, "logout", cancellationToken);
    }

    public Task RevokeAllForUserAsync(Guid userId, string reasonCode, CancellationToken cancellationToken = default) =>
        repository.RevokeAllForUserAsync(userId, timeProvider.GetUtcNow(), NormalizeReason(reasonCode), cancellationToken);

    public Task<int> ExpireStaleSessionsAsync(CancellationToken cancellationToken = default) =>
        repository.CountExpiredAsync(timeProvider.GetUtcNow(), cancellationToken);

    private static string NormalizeReason(string reasonCode)
    {
        if (string.IsNullOrWhiteSpace(reasonCode)) throw new ArgumentException("A revocation reason is required.", nameof(reasonCode));
        return reasonCode.Trim().ToLowerInvariant();
    }
}
