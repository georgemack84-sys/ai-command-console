using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Authentication;
using Proprium.Infrastructure.Configuration;
using StackExchange.Redis;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class RedisLoginRateLimiterIntegrationTests
{
    [Fact]
    public async Task Atomic_counter_applies_the_pair_limit_and_a_bounded_expiry()
    {
        const string privacyKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
        var options = Options.Create(new LoginRateLimitOptions { PrivacyKeyMaterial = privacyKey });
        var endpoint = $"{Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1"}:{Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379"}";
        await using var redis = await ConnectionMultiplexer.ConnectAsync(endpoint);
        var fallback = new InMemoryLoginRateLimiter(options, TimeProvider.System);
        var limiter = new RedisLoginRateLimiter(redis, fallback, options);
        var source = $"198.51.100.{Random.Shared.Next(1, 255)}";
        var identifier = $"user-{Guid.NewGuid():N}";

        for (var attempt = 0; attempt < LoginRateLimitOptions.LockedPairLimit; attempt++)
            Assert.False((await limiter.IncrementAsync(new LoginRateLimitRequest(source, identifier))).IsExceeded);

        Assert.True((await limiter.IncrementAsync(new LoginRateLimitRequest(source, identifier))).IsExceeded);
        var key = $"authz:login:pair:{Hash(privacyKey, $"{source}:{identifier.ToUpperInvariant()}")}";
        var remaining = await redis.GetDatabase().KeyTimeToLiveAsync(key);
        Assert.NotNull(remaining);
        Assert.InRange(remaining!.Value, TimeSpan.Zero, options.Value.Window);
    }

    [Fact]
    public async Task Restored_redis_uses_distributed_limiting_after_a_fallback_attempt()
    {
        const string privacyKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
        var options = Options.Create(new LoginRateLimitOptions { PrivacyKeyMaterial = privacyKey });
        var request = new LoginRateLimitRequest($"198.51.100.{Random.Shared.Next(1, 255)}", $"user-{Guid.NewGuid():N}");
        var unavailableOptions = new ConfigurationOptions { AbortOnConnectFail = false, ConnectTimeout = 50, SyncTimeout = 50 };
        unavailableOptions.EndPoints.Add("redis-unavailable.invalid", 6379);
        await using (var unavailable = await ConnectionMultiplexer.ConnectAsync(unavailableOptions))
        {
            var fallback = new InMemoryLoginRateLimiter(options, TimeProvider.System);
            Assert.True((await new RedisLoginRateLimiter(unavailable, fallback, options).IncrementAsync(request)).UsedFallback);
        }

        var endpoint = $"{Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1"}:{Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379"}";
        await using var restored = await ConnectionMultiplexer.ConnectAsync(endpoint);
        var restoredFallback = new InMemoryLoginRateLimiter(options, TimeProvider.System);
        Assert.False((await new RedisLoginRateLimiter(restored, restoredFallback, options).IncrementAsync(request)).UsedFallback);
    }

    private static string Hash(string key, string value) =>
        Convert.ToHexString(HMACSHA256.HashData(Convert.FromBase64String(key), Encoding.UTF8.GetBytes(value)));
}
