using Microsoft.Extensions.Diagnostics.HealthChecks;
using Proprium.Infrastructure.Events;
using Proprium.Infrastructure.Persistence;
using StackExchange.Redis;

namespace Proprium.Infrastructure.Health;

public sealed class PostgresReadinessHealthCheck(PropriumDbContext database) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        => await database.Database.CanConnectAsync(cancellationToken) ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy("PostgreSQL is unavailable.");
}

public sealed class RedisReadinessHealthCheck(IConnectionMultiplexer redis) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        => await redis.GetDatabase().PingAsync().WaitAsync(cancellationToken) >= TimeSpan.Zero ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy("Redis is unavailable.");
}

public sealed class OutboxProcessorReadinessHealthCheck(EventRuntimeStatus runtimeStatus, TimeProvider timeProvider) : IHealthCheck
{
    private static readonly TimeSpan MaximumStaleness = TimeSpan.FromSeconds(30);

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var snapshot = runtimeStatus.Snapshot();
        var age = timeProvider.GetUtcNow() - snapshot.LastSuccessfulOutboxBatchAtUtc;
        return Task.FromResult(age <= MaximumStaleness
            ? HealthCheckResult.Healthy($"Outbox processor last completed a batch {age.TotalSeconds:F0} seconds ago.")
            : HealthCheckResult.Unhealthy("Outbox processor has not completed a batch within 30 seconds."));
    }
}
