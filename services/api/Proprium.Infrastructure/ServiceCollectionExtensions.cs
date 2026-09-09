using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Application.Billing;
using Proprium.Application.Caching;
using Proprium.Application.Events;
using Proprium.Application.Identity;
using Proprium.Application.Retry;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Authentication;
using Proprium.Infrastructure.Billing;
using Proprium.Infrastructure.Caching;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Events;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Realtime;
using Proprium.Infrastructure.Retry;
using StackExchange.Redis;

namespace Proprium.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPropriumInfrastructure(this IServiceCollection services)
    {
        services.AddDbContextFactory<PropriumDbContext>((provider, options) => options.UseNpgsql(provider.GetRequiredService<IOptions<PostgresOptions>>().Value.BuildConnectionString()));
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
        services.AddScoped<IAuthenticationAuditRecorder, PostgresAuthenticationAuditRecorder>();
        services.AddScoped<IPasswordChangeService, PostgresPasswordChangeService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IBillCommandService, PostgresBillCommandService>();
        services.AddScoped<IBillQueryService, PostgresBillQueryService>();
        services.AddSingleton<IBillUpdatedEventMapper, BillUpdatedIntegrationEventMapper>();
        services.AddSingleton<IBillCreatedEventMapper, BillCreatedIntegrationEventMapper>();
        services.AddSingleton<IBillPaymentStatusChangedEventMapper, BillPaymentStatusChangedIntegrationEventMapper>();
        services.AddSingleton<InMemoryRealtimeSubscriptionRegistry>();
        services.AddSingleton<IRealtimeSubscriptionRegistry>(provider => provider.GetRequiredService<InMemoryRealtimeSubscriptionRegistry>());
        services.AddSingleton<IIntegrationEventHandler, RealtimeGateway>();
        services.AddSingleton<IEventPublisher, InProcessEventPublisher>();
        services.AddSingleton<EventRuntimeStatus>();
        services.AddScoped<IRealtimeSubscriptionAuthorizer, PostgresRealtimeSubscriptionAuthorizer>();
        services.AddHostedService<OutboxProcessor>();
        services.AddSingleton<InMemoryLoginRateLimiter>();
        services.AddSingleton<ILoginRateLimiter, RedisLoginRateLimiter>();
        services.AddScoped<IPermissionResolver, PostgresPermissionResolver>();
        services.AddScoped<LocalAdministratorInitializer>();
        return services;
    }
}
