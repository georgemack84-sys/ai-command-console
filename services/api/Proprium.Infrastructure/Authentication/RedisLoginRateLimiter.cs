using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Configuration;
using StackExchange.Redis;

namespace Proprium.Infrastructure.Authentication;

public sealed class RedisLoginRateLimiter(IConnectionMultiplexer redis, InMemoryLoginRateLimiter fallback, IOptions<LoginRateLimitOptions> options) : ILoginRateLimiter
{
    private readonly byte[] key = Convert.FromBase64String(options.Value.PrivacyKeyMaterial);

    public async Task<LoginRateLimitResult> IncrementAsync(LoginRateLimitRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var source = await IncrementAsync($"authz:login:source:{Hash(request.Source)}", LoginRateLimitOptions.LockedSourceLimit);
            if (source.IsExceeded || string.IsNullOrWhiteSpace(request.Identifier)) return source;
            return await IncrementAsync($"authz:login:pair:{Hash($"{request.Source}:{request.Identifier.Trim().ToUpperInvariant()}")}", LoginRateLimitOptions.LockedPairLimit);
        }
        catch (RedisConnectionException) { return await fallback.IncrementAsync(request, cancellationToken); }
        catch (RedisTimeoutException) { return await fallback.IncrementAsync(request, cancellationToken); }
    }

    private async Task<LoginRateLimitResult> IncrementAsync(string keyName, int limit)
    {
        var database = redis.GetDatabase();
        var count = await database.StringIncrementAsync(keyName);
        if (count == 1) await database.KeyExpireAsync(keyName, options.Value.Window);
        return new LoginRateLimitResult(count > limit, Math.Max(1, (int)options.Value.Window.TotalSeconds));
    }

    private string Hash(string value) => Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(value)));
}
