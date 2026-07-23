using System.Text.Json;
using Proprium.Application.Caching;
using StackExchange.Redis;

namespace Proprium.Infrastructure.Caching;

public sealed class RedisPlatformCache(IConnectionMultiplexer connection) : IPlatformCache
{
    private readonly IDatabase _database = connection.GetDatabase();
    public async Task<CacheReadResult<T>> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var value = await _database.StringGetAsync(key).WaitAsync(cancellationToken);
            if (!value.HasValue) return CacheReadResult<T>.Failure(CacheOperationStatus.Miss);
            try { return CacheReadResult<T>.Success(JsonSerializer.Deserialize<T>(value!)!); }
            catch (JsonException) { return CacheReadResult<T>.Failure(CacheOperationStatus.SerializationFailure); }
        }
        catch (OperationCanceledException) { return CacheReadResult<T>.Failure(CacheOperationStatus.Cancelled); }
        catch (RedisException) { return CacheReadResult<T>.Failure(CacheOperationStatus.Unavailable); }
    }
    public async Task<CacheWriteResult> SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        try { await _database.StringSetAsync(key, JsonSerializer.Serialize(value), expiry).WaitAsync(cancellationToken); return new(CacheOperationStatus.Success); }
        catch (JsonException) { return new(CacheOperationStatus.SerializationFailure); }
        catch (OperationCanceledException) { return new(CacheOperationStatus.Cancelled); }
        catch (RedisException) { return new(CacheOperationStatus.Unavailable); }
    }
    public async Task<CacheRemoveResult> RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try { await _database.KeyDeleteAsync(key).WaitAsync(cancellationToken); return new(CacheOperationStatus.Success); }
        catch (OperationCanceledException) { return new(CacheOperationStatus.Cancelled); }
        catch (RedisException) { return new(CacheOperationStatus.Unavailable); }
    }
}
