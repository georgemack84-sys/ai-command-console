using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Configuration;

namespace Proprium.Infrastructure.Authentication;

public sealed class InMemoryLoginRateLimiter(IOptions<LoginRateLimitOptions> options, TimeProvider timeProvider) : ILoginRateLimiter
{
    private sealed class Counter { public object Gate { get; } = new(); public int Count; public DateTimeOffset ExpiresAtUtc; }
    private readonly ConcurrentDictionary<string, Counter> counters = new(StringComparer.Ordinal);
    private readonly byte[] key = options.Value.GetPrivacyKey();

    public Task<LoginRateLimitResult> IncrementAsync(LoginRateLimitRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var source = Hash($"source:{request.Source.Trim()}");
        var sourceResult = Increment(source, LoginRateLimitOptions.LockedSourceLimit);
        if (sourceResult.IsExceeded) return Task.FromResult(sourceResult);
        if (string.IsNullOrWhiteSpace(request.Identifier)) return Task.FromResult(sourceResult);
        return Task.FromResult(Increment(Hash($"pair:{request.Source.Trim()}:{request.Identifier.Trim().ToUpperInvariant()}"), LoginRateLimitOptions.LockedPairLimit));
    }

    private LoginRateLimitResult Increment(string counterKey, int limit)
    {
        var now = timeProvider.GetUtcNow();
        if (counters.Count >= options.Value.FallbackCapacity) counters.TryRemove(counters.Keys.First(), out _);
        var counter = counters.GetOrAdd(counterKey, _ => new Counter { ExpiresAtUtc = now.Add(options.Value.Window) });
        lock (counter.Gate)
        {
            if (counter.ExpiresAtUtc <= now) { counter.Count = 0; counter.ExpiresAtUtc = now.Add(options.Value.Window); }
            counter.Count++;
            return new LoginRateLimitResult(counter.Count > limit, Math.Max(1, (int)Math.Ceiling((counter.ExpiresAtUtc - now).TotalSeconds)));
        }
    }

    private string Hash(string value) => Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(value)));
}
