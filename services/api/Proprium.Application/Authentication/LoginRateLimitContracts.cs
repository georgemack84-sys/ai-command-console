namespace Proprium.Application.Authentication;

public sealed record LoginRateLimitRequest(string Source, string? Identifier);
public sealed record LoginRateLimitResult(bool IsExceeded, int RetryAfterSeconds);
public interface ILoginRateLimiter { Task<LoginRateLimitResult> IncrementAsync(LoginRateLimitRequest request, CancellationToken cancellationToken = default); }
