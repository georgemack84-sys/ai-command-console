namespace Proprium.Domain.Identity;

public sealed class User
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string NormalizedUsername { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public long SecurityVersion { get; set; } = 1;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<UserRole> Roles { get; } = new List<UserRole>();
    public ICollection<Session> Sessions { get; } = new List<Session>();
    public ICollection<AuthenticationEvent> AuthenticationEvents { get; } = new List<AuthenticationEvent>();
}

public sealed class Role
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<UserRole> Users { get; } = new List<UserRole>();
    public ICollection<RolePermission> Permissions { get; } = new List<RolePermission>();
}

public sealed class Permission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Key { get; init; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CapabilityGroup { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<RolePermission> Roles { get; } = new List<RolePermission>();
}

public sealed class UserRole { public Guid UserId { get; init; } public Guid RoleId { get; init; } public DateTimeOffset AssignedAtUtc { get; init; } = DateTimeOffset.UtcNow; public User User { get; init; } = null!; public Role Role { get; init; } = null!; }
public sealed class RolePermission { public Guid RoleId { get; init; } public Guid PermissionId { get; init; } public DateTimeOffset AssignedAtUtc { get; init; } = DateTimeOffset.UtcNow; public Role Role { get; init; } = null!; public Permission Permission { get; init; } = null!; }

public sealed class Session
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public string TokenHash { get; init; } = string.Empty;
    public long SecurityVersionSnapshot { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAtUtc { get; init; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public DateTimeOffset? LastUsedAtUtc { get; set; }
    public string? RevocationReason { get; set; }
    public User User { get; init; } = null!;
}

public enum AuthenticationEventType { LoginSucceeded, LoginFailed, SessionCreated, Logout, SessionRevoked, SessionRejected, SecurityVersionInvalidated }
public enum AuthenticationEventOutcome { Success, Failure, Denied }

public sealed class AuthenticationEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public AuthenticationEventType EventType { get; init; }
    public AuthenticationEventOutcome Outcome { get; init; }
    public DateTimeOffset OccurredAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public Guid? UserId { get; init; }
    public Guid? SessionId { get; init; }
    public string? NormalizedUsername { get; init; }
    public string? ReasonCode { get; init; }
    public string CorrelationId { get; init; } = string.Empty;
    public string? RequestMetadata { get; init; }
    public User? User { get; init; }
    public Session? Session { get; init; }
}

public static class AuthenticationEventFactory
{
    public static AuthenticationEvent Create(AuthenticationEventType eventType, AuthenticationEventOutcome outcome, string correlationId, Guid? userId = null, Guid? sessionId = null, string? normalizedUsername = null, string? reasonCode = null) => new()
    {
        EventType = eventType,
        Outcome = outcome,
        CorrelationId = string.IsNullOrWhiteSpace(correlationId) ? throw new ArgumentException("A correlation identifier is required.", nameof(correlationId)) : correlationId,
        UserId = userId,
        SessionId = sessionId,
        NormalizedUsername = normalizedUsername,
        ReasonCode = reasonCode
    };
}
