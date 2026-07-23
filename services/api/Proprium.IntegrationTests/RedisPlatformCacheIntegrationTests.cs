using Proprium.Application.Authentication;
using Proprium.Application.Caching;
using Proprium.Infrastructure.Caching;
using StackExchange.Redis;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class RedisPlatformCacheIntegrationTests
{
    [Fact]
    public async Task Json_null_cache_value_is_reported_as_a_serialization_failure()
    {
        var endpoint = $"{Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1"}:{Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379"}";
        await using var redis = await ConnectionMultiplexer.ConnectAsync(endpoint);
        var database = redis.GetDatabase();
        var key = $"test:cache:null:{Guid.NewGuid():N}";
        await database.StringSetAsync(key, "null");
        try
        {
            var result = await new RedisPlatformCache(redis).GetAsync<PermissionCacheEntry>(key);
            Assert.Equal(CacheOperationStatus.SerializationFailure, result.Status);
        }
        finally
        {
            await database.KeyDeleteAsync(key);
        }
    }
}
