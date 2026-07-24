using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
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
