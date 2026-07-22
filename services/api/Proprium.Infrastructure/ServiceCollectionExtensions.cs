using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Proprium.Application.Caching;
using Proprium.Application.Retry;
using Proprium.Infrastructure.Caching;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Retry;
using StackExchange.Redis;

namespace Proprium.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPropriumInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<PropriumDbContext>((provider, options) => options.UseNpgsql(provider.GetRequiredService<IOptions<PostgresOptions>>().Value.ConnectionString));
        services.AddSingleton<IConnectionMultiplexer>(provider => ConnectionMultiplexer.Connect(provider.GetRequiredService<IOptions<RedisOptions>>().Value.ConnectionString));
        services.AddSingleton<IPlatformCache, RedisPlatformCache>();
        services.AddScoped<IRetryExecutor, RetryExecutor>();
        return services;
    }
}
