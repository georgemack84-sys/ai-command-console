namespace Proprium.Domain.Identity;

public static class SessionFactory
{
    public static Session Create(User user, string tokenDigest, DateTimeOffset expiresAtUtc, DateTimeOffset? createdAtUtc = null)
    {
        ArgumentNullException.ThrowIfNull(user);
        if (user.SecurityVersion <= 0) throw new InvalidOperationException("A session requires a valid user security version.");
        if (string.IsNullOrWhiteSpace(tokenDigest)) throw new ArgumentException("A session token digest is required.", nameof(tokenDigest));
        if (tokenDigest.Length > 128) throw new ArgumentException("A session token digest exceeds the supported length.", nameof(tokenDigest));

        var createdAt = createdAtUtc ?? DateTimeOffset.UtcNow;
        if (createdAt.Offset != TimeSpan.Zero || expiresAtUtc.Offset != TimeSpan.Zero)
            throw new ArgumentException("Session timestamps must be UTC.");
        if (expiresAtUtc <= createdAt) throw new ArgumentException("A session expiry must be later than creation.", nameof(expiresAtUtc));

        return new Session
        {
            UserId = user.Id,
            TokenHash = tokenDigest,
            SecurityVersionSnapshot = user.SecurityVersion,
            CreatedAtUtc = createdAt,
            ExpiresAtUtc = expiresAtUtc
        };
    }
}
