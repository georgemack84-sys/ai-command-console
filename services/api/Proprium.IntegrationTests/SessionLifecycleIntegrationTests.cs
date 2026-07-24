using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Authentication;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class SessionLifecycleIntegrationTests
{
    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    [Fact]
    public async Task PostgreSQL_session_lifecycle_persists_only_a_hash_and_revokes_idempotently()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test", SecurityVersion = 3 };
        database.Users.Add(user);
        await database.SaveChangesAsync();

        var service = new PostgresSessionService(
            new PostgresSessionRepository(database),
            new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray()),
            Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }),
            TimeProvider.System);

        var created = await service.CreateAsync(user);
        var stored = await database.Sessions.SingleAsync(session => session.Id == created.SessionId);
        Assert.NotEqual(created.RawToken.Value, stored.TokenHash);
        Assert.Equal(3, stored.SecurityVersionSnapshot);
        Assert.Equal(SessionValidationOutcome.Valid, (await service.ValidateAsync(created.RawToken)).Outcome);

        await service.RevokeCurrentAsync(created.RawToken);
        await service.RevokeCurrentAsync(created.RawToken);
        Assert.Equal(SessionValidationOutcome.Revoked, (await service.ValidateAsync(created.RawToken)).Outcome);
    }

    [Fact]
    public async Task PostgreSQL_session_validation_rejects_expired_disabled_and_security_version_mismatch_state()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        database.Users.Add(user);
        await database.SaveChangesAsync();
        var generator = new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray());
        var service = new PostgresSessionService(new PostgresSessionRepository(database), generator, Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }), TimeProvider.System);

        var active = await service.CreateAsync(user);
        await database.Users.Where(item => item.Id == user.Id).ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsActive, false));
        Assert.Equal(SessionValidationOutcome.DisabledUser, (await service.ValidateAsync(active.RawToken)).Outcome);

        await database.Users.Where(item => item.Id == user.Id).ExecuteUpdateAsync(setters => setters.SetProperty(item => item.IsActive, true).SetProperty(item => item.SecurityVersion, item => item.SecurityVersion + 1));
        Assert.Equal(SessionValidationOutcome.SecurityVersionMismatch, (await service.ValidateAsync(active.RawToken)).Outcome);

        var expiredToken = generator.Generate();
        database.Sessions.Add(SessionFactory.Create(user, expiredToken.Hash.Value, DateTimeOffset.UtcNow.AddMinutes(-1), DateTimeOffset.UtcNow.AddHours(-1)));
        await database.SaveChangesAsync();
        Assert.Equal(SessionValidationOutcome.Expired, (await service.ValidateAsync(expiredToken.RawToken)).Outcome);
    }

    [Fact]
    public async Task Revoke_all_and_stale_session_count_preserve_authoritative_records()
    {
        await using var database = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        database.Users.Add(user);
        await database.SaveChangesAsync();
        var generator = new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray());
        var service = new PostgresSessionService(new PostgresSessionRepository(database), generator, Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }), TimeProvider.System);
        var first = await service.CreateAsync(user);
        var second = await service.CreateAsync(user);
        var expired = generator.Generate();
        database.Sessions.Add(SessionFactory.Create(user, expired.Hash.Value, DateTimeOffset.UtcNow.AddMinutes(-1), DateTimeOffset.UtcNow.AddHours(-1)));
        await database.SaveChangesAsync();

        Assert.True(await service.ExpireStaleSessionsAsync() >= 1);
        await service.RevokeAllForUserAsync(user.Id, "security-maintenance");
        Assert.Equal(SessionValidationOutcome.Revoked, (await service.ValidateAsync(first.RawToken)).Outcome);
        Assert.Equal(SessionValidationOutcome.Revoked, (await service.ValidateAsync(second.RawToken)).Outcome);
        Assert.Equal(3, await database.Sessions.CountAsync(session => session.UserId == user.Id));
    }

    [Fact]
    public async Task Concurrent_session_revocation_is_idempotent()
    {
        await using var setup = CreateContext();
        var user = new User { Username = $"user-{Guid.NewGuid():N}", NormalizedUsername = $"USER-{Guid.NewGuid():N}", PasswordHash = "test" };
        setup.Users.Add(user);
        await setup.SaveChangesAsync();
        var generator = new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray());
        var creator = new PostgresSessionService(new PostgresSessionRepository(setup), generator, Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }), TimeProvider.System);
        var created = await creator.CreateAsync(user);

        await Task.WhenAll(Enumerable.Range(0, 4).Select(async _ =>
        {
            await using var concurrent = CreateContext();
            var service = new PostgresSessionService(new PostgresSessionRepository(concurrent), generator, Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }), TimeProvider.System);
            await service.RevokeCurrentAsync(created.RawToken);
        }));

        await using var verification = CreateContext();
        var revoked = await verification.Sessions.SingleAsync(session => session.Id == created.SessionId);
        Assert.NotNull(revoked.RevokedAtUtc);
        Assert.Equal("logout", revoked.RevocationReason);
    }
}
