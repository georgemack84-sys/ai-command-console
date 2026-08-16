using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Identity;
using Proprium.Domain.Identity;
using Proprium.Application.Caching;
using Proprium.Application.Retry;
using Proprium.Infrastructure.Caching;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Retry;
using Proprium.Application.Identity;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Authentication;
using StackExchange.Redis;

namespace Proprium.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPropriumInfrastructure(this IServiceCollection services)
    {
        services.AddDbContext<PropriumDbContext>((provider, options) => options.UseNpgsql(provider.GetRequiredService<IOptions<PostgresOptions>>().Value.BuildConnectionString()));
        services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            var configuration = provider.GetRequiredService<IOptions<RedisOptions>>().Value.BuildConfiguration();
            return ConnectionMultiplexer.Connect(configuration);
        });
        services.AddSingleton<IPlatformCache, RedisPlatformCache>();
        services.AddSingleton<IRetryFailureClassifier, PostgresRetryClassifier>();
        services.AddSingleton<IRetryExecutor, RetryExecutor>();
        services.AddScoped<IRetryAttemptFactory<ISessionPersistenceAttempt>, SessionPersistenceAttemptFactory>();
        services.AddScoped<ISecurityVersionInvalidator, SecurityVersionInvalidator>();
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddScoped<IUserPasswordHasher, UserPasswordHasher>();
        services.AddSingleton<ISessionTokenGenerator>(provider => new SessionTokenGenerator(provider.GetRequiredService<IOptions<SessionOptions>>().Value.GetTokenDigestKey()));
        services.AddScoped<ISessionRepository, PostgresSessionRepository>();
        services.AddScoped<ISessionService, PostgresSessionService>();
        services.AddScoped<IAuthenticationService, PostgresAuthenticationService>();
        services.AddScoped<IPasswordChangeService, PostgresPasswordChangeService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<InMemoryLoginRateLimiter>();
        services.AddSingleton<ILoginRateLimiter, RedisLoginRateLimiter>();
        services.AddScoped<IPermissionResolver, PostgresPermissionResolver>();
        services.AddScoped<LocalAdministratorInitializer>();
        return services;
    }
}
