using Proprium.Domain.Identity;

namespace Proprium.Application.Authentication;

public enum PasswordVerificationOutcome { Failed, Success, SuccessRehashNeeded }

public interface IUserPasswordHasher
{
    string Hash(User user, string password);
    PasswordVerificationOutcome Verify(User user, string storedHash, string password);
}

public sealed record RawSessionToken(string Value);
public sealed record SessionTokenHash(string Value);
public sealed record GeneratedSessionToken(RawSessionToken RawToken, SessionTokenHash Hash);

public interface ISessionTokenGenerator
{
    GeneratedSessionToken Generate();
    SessionTokenHash Hash(RawSessionToken rawToken);
    bool IsStructurallyValid(RawSessionToken rawToken);
}

public enum SessionValidationOutcome { Valid, Missing, Malformed, Expired, Revoked, DisabledUser, SecurityVersionMismatch, Unavailable }

public sealed record SessionValidationResult(SessionValidationOutcome Outcome, User? User = null, Session? Session = null)
{
    public bool IsValid => Outcome == SessionValidationOutcome.Valid;
}

public sealed record CreatedSession(RawSessionToken RawToken, Guid SessionId, DateTimeOffset ExpiresAtUtc);

public interface ISessionService
{
    Task<CreatedSession> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<SessionValidationResult> ValidateAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default);
    Task RevokeAsync(Guid sessionId, string reasonCode, CancellationToken cancellationToken = default);
    Task RevokeCurrentAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, string reasonCode, CancellationToken cancellationToken = default);
    Task<int> ExpireStaleSessionsAsync(CancellationToken cancellationToken = default);
}
