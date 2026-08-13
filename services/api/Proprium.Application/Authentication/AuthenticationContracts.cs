using Proprium.Domain.Identity;
using Proprium.Application.Retry;

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

public static class SessionRejectionReason
{
    public static string From(SessionValidationOutcome outcome) => outcome switch
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

public sealed record SessionValidationResult(SessionValidationOutcome Outcome, User? User = null, Session? Session = null)
{
    public bool IsValid => Outcome == SessionValidationOutcome.Valid;
}

public sealed record CreatedSession(RawSessionToken RawToken, Guid SessionId, DateTimeOffset ExpiresAtUtc);

public interface ISessionRepository
{
    Task AddAsync(Session session, CancellationToken cancellationToken = default);
    Task<Session?> FindByTokenHashAsync(SessionTokenHash tokenHash, CancellationToken cancellationToken = default);
    Task RevokeAsync(Guid sessionId, DateTimeOffset revokedAtUtc, string reasonCode, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, DateTimeOffset revokedAtUtc, string reasonCode, CancellationToken cancellationToken = default);
    Task<int> CountExpiredAsync(DateTimeOffset nowUtc, CancellationToken cancellationToken = default);
}

public interface ISessionPersistenceAttempt : IRetryAttemptDependencies
{
    ISessionRepository Sessions { get; }
}

public interface ISessionService
{
    Task<CreatedSession> CreateAsync(User user, CancellationToken cancellationToken = default);
    Task<SessionValidationResult> ValidateAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default);
    Task RevokeAsync(Guid sessionId, string reasonCode, CancellationToken cancellationToken = default);
    Task RevokeCurrentAsync(RawSessionToken rawToken, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(Guid userId, string reasonCode, CancellationToken cancellationToken = default);
    Task<int> ExpireStaleSessionsAsync(CancellationToken cancellationToken = default);
}

public sealed record LoginAttempt(string Username, string Password, string CorrelationId);
public sealed record LoginResult(bool Succeeded, RawSessionToken? SessionToken = null)
{
    public static LoginResult Rejected() => new(false);
}

public interface IAuthenticationService
{
    Task<LoginResult> LoginAsync(LoginAttempt attempt, CancellationToken cancellationToken = default);
    Task LogoutAsync(RawSessionToken? sessionToken, string correlationId, CancellationToken cancellationToken = default);
}

public interface IPasswordChangeService
{
    Task ChangeAsync(Guid userId, string newPassword, string correlationId, CancellationToken cancellationToken = default);
}

public sealed record CurrentUser(Guid UserId, string Username, string DisplayName, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);

public interface ICurrentUserService
{
    Task<CurrentUser?> ResolveAsync(RawSessionToken rawToken, string correlationId, CancellationToken cancellationToken = default);
}
