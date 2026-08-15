using Proprium.Application.Authentication;
using Proprium.Application.Caching;
using Proprium.Infrastructure.Caching;
using StackExchange.Redis;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class RedisPlatformCacheIntegrationTests : IIntegrationTest
{
    [Fact]
    public async Task Cache_write_read_expiration_miss_and_remove_are_distinct()
    {
        var endpoint = $"{Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1"}:{Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379"}";
        await using var redis = await ConnectionMultiplexer.ConnectAsync(endpoint);
        var cache = new RedisPlatformCache(redis);
        var key = $"test:cache:lifecycle:{Guid.NewGuid():N}";
        try
        {
            Assert.Equal(CacheOperationStatus.Miss, (await cache.GetAsync<string>(key)).Status);
            Assert.Equal(CacheOperationStatus.Success, (await cache.SetAsync(key, "value", TimeSpan.FromMilliseconds(150))).Status);
            var read = await cache.GetAsync<string>(key);
            Assert.Equal(CacheOperationStatus.Success, read.Status);
            Assert.Equal("value", read.Value);

            await Task.Delay(300);
            Assert.Equal(CacheOperationStatus.Miss, (await cache.GetAsync<string>(key)).Status);

            Assert.Equal(CacheOperationStatus.Success, (await cache.SetAsync(key, "value", TimeSpan.FromMinutes(1))).Status);
            Assert.Equal(CacheOperationStatus.Success, (await cache.RemoveAsync(key)).Status);
            Assert.Equal(CacheOperationStatus.Miss, (await cache.GetAsync<string>(key)).Status);
        }
        finally
        {
            await redis.GetDatabase().KeyDeleteAsync(key);
        }
    }

    [Fact]
    public async Task Unreachable_Redis_is_unavailable_not_a_miss()
    {
        var configuration = new ConfigurationOptions
        {
            AbortOnConnectFail = false,
            AsyncTimeout = 250,
            ConnectRetry = 0,
            ConnectTimeout = 250,
            SyncTimeout = 250
        };
        configuration.EndPoints.Add(Environment.GetEnvironmentVariable("REDIS_HOST") ?? "127.0.0.1", 1);
        await using var redis = await ConnectionMultiplexer.ConnectAsync(configuration);

        var result = await new RedisPlatformCache(redis).GetAsync<string>($"test:cache:unavailable:{Guid.NewGuid():N}");

        Assert.Equal(CacheOperationStatus.Unavailable, result.Status);
        Assert.Null(result.Value);
    }

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
