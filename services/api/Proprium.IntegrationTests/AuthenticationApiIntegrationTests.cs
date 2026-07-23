using System.Net;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Proprium.Contracts.V1;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Authentication;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class AuthenticationApiIntegrationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private sealed class RehashConflictPasswordHasher(Action onRehash) : IUserPasswordHasher
    {
        public string Hash(User user, string password)
        {
            onRehash();
            return "replacement-hash";
        }

        public PasswordVerificationOutcome Verify(User user, string storedHash, string password) => PasswordVerificationOutcome.SuccessRehashNeeded;
    }

    private HttpClient CreateAuthenticationClient(bool handleCookies = false)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = handleCookies });
        client.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost");
        client.DefaultRequestHeaders.Add("X-Proprium-CSRF", "1");
        return client;
    }

    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }

    [Fact]
    public async Task Login_current_user_and_logout_use_authoritative_server_side_sessions()
    {
        var username = $"user-{Guid.NewGuid():N}";
        var password = "correct-password";
        await using (var database = CreateContext())
        {
            var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant(), DisplayName = "Integration Test User" };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            var role = new Role { Name = $"Zeta-{Guid.NewGuid():N}", NormalizedName = $"ZETA-{Guid.NewGuid():N}" };
            var secondRole = new Role { Name = $"alpha-{Guid.NewGuid():N}", NormalizedName = $"ALPHA-{Guid.NewGuid():N}" };
            var profilePermission = await database.Permissions.SingleAsync(item => item.Key == "identity.profile.read-self");
            var userReadPermission = await database.Permissions.SingleAsync(item => item.Key == "identity.user.read");
            var roleReadPermission = await database.Permissions.SingleAsync(item => item.Key == "identity.role.read");
            database.AddRange(
                user,
                role,
                secondRole,
                new UserRole { User = user, Role = role },
                new UserRole { User = user, Role = secondRole },
                new RolePermission { Role = role, Permission = userReadPermission },
                new RolePermission { Role = role, Permission = profilePermission },
                new RolePermission { Role = secondRole, Permission = roleReadPermission });
            await database.SaveChangesAsync();
        }

        var client = CreateAuthenticationClient(handleCookies: true);
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, password));
        Assert.Equal(HttpStatusCode.NoContent, login.StatusCode);
        Assert.Equal(0, login.Content.Headers.ContentLength ?? 0);
        Assert.Equal("no-store", login.Headers.CacheControl?.ToString());
        Assert.Contains(login.Headers.GetValues("Set-Cookie"), value => value.StartsWith("proprium_session=", StringComparison.Ordinal) && value.Contains("httponly", StringComparison.OrdinalIgnoreCase) && value.Contains("samesite=lax", StringComparison.OrdinalIgnoreCase));
        var issuedCookie = login.Headers.GetValues("Set-Cookie").Single(value => value.StartsWith("proprium_session=", StringComparison.Ordinal)).Split(';')[0];

        var current = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
        Assert.Equal("no-store", current.Headers.CacheControl?.ToString());
        var payload = await current.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.Equal(username, payload?.Username);
        Assert.Equal("Integration Test User", payload?.DisplayName);
        Assert.Equal(new[] { "Zeta", "alph" }, (payload?.Roles ?? []).Select(value => value[..4]).ToArray());
        Assert.Equal(new[] { "identity.profile.read-self", "identity.role.read", "identity.user.read" }, payload?.Permissions);

        var logout = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal("no-store", logout.Headers.CacheControl?.ToString());
        Assert.Contains(logout.Headers.GetValues("Set-Cookie"), value => value.StartsWith("proprium_session=", StringComparison.Ordinal));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);
        var replay = factory.CreateClient();
        replay.DefaultRequestHeaders.Add("Cookie", issuedCookie);
        Assert.Equal(HttpStatusCode.Unauthorized, (await replay.GetAsync("/api/v1/auth/me")).StatusCode);

        await using var evidence = CreateContext();
        var eventTypes = await evidence.AuthenticationEvents.Where(item => item.NormalizedUsername == username.ToUpperInvariant() || item.User!.NormalizedUsername == username.ToUpperInvariant()).Select(item => item.EventType).ToArrayAsync();
        Assert.Contains(AuthenticationEventType.LoginSucceeded, eventTypes);
        Assert.Contains(AuthenticationEventType.SessionCreated, eventTypes);
        Assert.Contains(AuthenticationEventType.Logout, eventTypes);
        Assert.Contains(AuthenticationEventType.SessionRevoked, eventTypes);
        Assert.Contains(AuthenticationEventType.SessionRejected, eventTypes);
    }

    [Fact]
    public async Task Unknown_and_disabled_users_receive_the_same_generic_login_response()
    {
        var password = "correct-password";
        var disabledUsername = $"disabled-{Guid.NewGuid():N}";
        await using (var database = CreateContext())
        {
            var user = new User { Username = disabledUsername, NormalizedUsername = disabledUsername.ToUpperInvariant(), IsActive = false };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            database.Users.Add(user);
            await database.SaveChangesAsync();
        }

        var client = CreateAuthenticationClient();
        var unknownUsername = $"unknown-{Guid.NewGuid():N}";
        var unknown = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(unknownUsername, password));
        var disabled = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(disabledUsername, password));
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, disabled.StatusCode);
        Assert.False(unknown.Headers.Contains("Set-Cookie"));
        Assert.False(disabled.Headers.Contains("Set-Cookie"));

        await using var evidence = CreateContext();
        Assert.Equal(2, await evidence.AuthenticationEvents.CountAsync(item => item.EventType == AuthenticationEventType.LoginFailed && (item.NormalizedUsername == disabledUsername.ToUpperInvariant() || item.NormalizedUsername == unknownUsername.ToUpperInvariant())));
    }

    [Fact]
    public async Task Malformed_session_cookie_is_rejected_and_records_safe_evidence()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Cookie", "proprium_session=not-a-valid-session-token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);

        await using var evidence = CreateContext();
        Assert.True(await evidence.AuthenticationEvents.AnyAsync(item => item.EventType == AuthenticationEventType.SessionRejected && item.ReasonCode == "malformed-token" && item.UserId == null && item.SessionId == null));
    }

    [Fact]
    public async Task Login_upgrades_an_outdated_password_hash_before_issuing_a_session()
    {
        var username = $"rehash-{Guid.NewGuid():N}";
        var password = "correct-password";
        await using (var database = CreateContext())
        {
            var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant() };
            user.PasswordHash = new PasswordHasher<User>(Options.Create(new PasswordHasherOptions { IterationCount = 1_000 })).HashPassword(user, password);
            database.Users.Add(user);
            await database.SaveChangesAsync();
        }

        var response = await CreateAuthenticationClient().PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, password));
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        await using var verification = CreateContext();
        var userAfterLogin = await verification.Users.SingleAsync(item => item.NormalizedUsername == username.ToUpperInvariant());
        Assert.Equal(PasswordVerificationResult.Success, new PasswordHasher<User>().VerifyHashedPassword(userAfterLogin, userAfterLogin.PasswordHash, password));
        Assert.True(await verification.Sessions.AnyAsync(session => session.UserId == userAfterLogin.Id));
    }

    [Fact]
    public async Task Rehash_concurrency_failure_rolls_back_session_and_authentication_events()
    {
        var username = $"rehash-conflict-{Guid.NewGuid():N}";
        await using var database = CreateContext();
        var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant(), DisplayName = "Rehash Conflict", PasswordHash = "outdated-hash" };
        database.Users.Add(user);
        await database.SaveChangesAsync();

        var service = new PostgresAuthenticationService(
            database,
            new RehashConflictPasswordHasher(() =>
            {
                using var concurrent = CreateContext();
                concurrent.Users.Where(item => item.Id == user.Id).ExecuteUpdate(setters => setters.SetProperty(item => item.SecurityVersion, item => item.SecurityVersion + 1));
            }),
            new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray()),
            Options.Create(new Proprium.Infrastructure.Configuration.SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }),
            TimeProvider.System);

        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => service.LoginAsync(new LoginAttempt(username, "correct-password", Guid.NewGuid().ToString("N"))));

        await using var verification = CreateContext();
        Assert.False(await verification.Sessions.AnyAsync(session => session.UserId == user.Id));
        Assert.False(await verification.AuthenticationEvents.AnyAsync(item => item.UserId == user.Id));
        Assert.Equal("outdated-hash", await verification.Users.Where(item => item.Id == user.Id).Select(item => item.PasswordHash).SingleAsync());
    }

    [Fact]
    public async Task Login_rejects_missing_or_invalid_origin_and_csrf_headers()
    {
        var request = new LoginRequest("any-user", "any-password");
        Assert.Equal(HttpStatusCode.Forbidden, (await factory.CreateClient().PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);

        var wrongOrigin = factory.CreateClient();
        wrongOrigin.DefaultRequestHeaders.Add("Origin", "https://untrusted.example");
        wrongOrigin.DefaultRequestHeaders.Add("X-Proprium-CSRF", "1");
        Assert.Equal(HttpStatusCode.Forbidden, (await wrongOrigin.PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);

        var invalidCsrf = factory.CreateClient();
        invalidCsrf.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost");
        invalidCsrf.DefaultRequestHeaders.Add("X-Proprium-CSRF", "unexpected");
        Assert.Equal(HttpStatusCode.Forbidden, (await invalidCsrf.PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);

        var duplicateCsrf = factory.CreateClient();
        duplicateCsrf.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost");
        duplicateCsrf.DefaultRequestHeaders.Add("X-Proprium-CSRF", new[] { "1", "1" });
        Assert.Equal(HttpStatusCode.Forbidden, (await duplicateCsrf.PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);
    }

    [Fact]
    public async Task Login_rejects_unknown_json_members()
    {
        var client = CreateAuthenticationClient();
        using var content = new StringContent("{\"username\":\"any-user\",\"password\":\"any-password\",\"unexpected\":true}", Encoding.UTF8, "application/json");
        var response = await client.PostAsync("/api/v1/auth/login", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Login_correctness_does_not_depend_on_redis()
    {
        var username = $"redis-independent-{Guid.NewGuid():N}";
        const string password = "correct-password";
        await using (var database = CreateContext())
        {
            var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant() };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            database.Users.Add(user);
            await database.SaveChangesAsync();
        }

        await using var unavailableRedisFactory = factory.WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["REDIS_HOST"] = "redis-unavailable.invalid",
            ["REDIS_PORT"] = "6379"
        })));
        var client = unavailableRedisFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost");
        client.DefaultRequestHeaders.Add("X-Proprium-CSRF", "1");
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, password))).StatusCode);
    }
}
