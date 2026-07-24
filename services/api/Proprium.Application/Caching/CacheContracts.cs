namespace Proprium.Application.Caching;

public enum CacheOperationStatus { Success, Miss, Unavailable, SerializationFailure, Cancelled }

public sealed record CacheReadResult<T>(CacheOperationStatus Status, T Value)
{
    public static CacheReadResult<T> Success(T value) => value is null ? throw new ArgumentNullException(nameof(value)) : new(CacheOperationStatus.Success, value);
    public static CacheReadResult<T> Failure(CacheOperationStatus status) => status == CacheOperationStatus.Success ? throw new ArgumentOutOfRangeException(nameof(status)) : new(status, default!);
}

public sealed record CacheWriteResult(CacheOperationStatus Status) { public bool IsSuccess => Status == CacheOperationStatus.Success; }
public sealed record CacheRemoveResult(CacheOperationStatus Status) { public bool IsSuccess => Status == CacheOperationStatus.Success; }

public interface IPlatformCache
{
    Task<CacheReadResult<T>> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task<CacheWriteResult> SetAsync<T>(string key, T value, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task<CacheRemoveResult> RemoveAsync(string key, CancellationToken cancellationToken = default);
}
