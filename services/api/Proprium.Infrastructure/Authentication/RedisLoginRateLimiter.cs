using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Configuration;
using StackExchange.Redis;

namespace Proprium.Infrastructure.Authentication;

public sealed class RedisLoginRateLimiter(IConnectionMultiplexer redis, InMemoryLoginRateLimiter fallback, IOptions<LoginRateLimitOptions> options) : ILoginRateLimiter
{
    private const string IncrementWithExpiry = """
        local count = redis.call('INCR', KEYS[1])
        if count == 1 then
            redis.call('PEXPIRE', KEYS[1], ARGV[1])
        end
        return { count, redis.call('PTTL', KEYS[1]) }
        """;

    private readonly byte[] key = Convert.FromBase64String(options.Value.PrivacyKeyMaterial);

    public async Task<LoginRateLimitResult> IncrementAsync(LoginRateLimitRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var source = await IncrementAsync($"authz:login:source:{Hash(request.Source)}", LoginRateLimitOptions.LockedSourceLimit);
            if (source.IsExceeded || string.IsNullOrWhiteSpace(request.Identifier)) return source;
            return await IncrementAsync($"authz:login:pair:{Hash($"{request.Source}:{request.Identifier.Trim().ToUpperInvariant()}")}", LoginRateLimitOptions.LockedPairLimit);
        }
        catch (RedisException) { return await fallback.IncrementAsync(request, cancellationToken); }
    }

    private async Task<LoginRateLimitResult> IncrementAsync(string keyName, int limit)
    {
        var database = redis.GetDatabase();
        var evaluated = await database.ScriptEvaluateAsync(IncrementWithExpiry, [keyName], [(long)options.Value.Window.TotalMilliseconds]);
        var result = (RedisResult[]?)evaluated;
        if (result is null || result.Length != 2) throw new RedisException("The login rate-limit script returned an invalid result.");
        var count = (long)result[0];
        var millisecondsRemaining = (long)result[1];
        return new LoginRateLimitResult(count > limit, Math.Max(1, (int)Math.Ceiling(millisecondsRemaining / 1_000d)));
    }

    private string Hash(string value) => Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(value)));
}
