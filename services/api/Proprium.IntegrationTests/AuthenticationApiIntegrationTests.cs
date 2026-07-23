using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Contracts.V1;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class AuthenticationApiIntegrationTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private HttpClient CreateAuthenticationClient(bool handleCookies = false)
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = handleCookies });
        client.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost");
        client.DefaultRequestHeaders.Add("X-Proprium-CSRF", "integration-test-csrf");
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
            var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant() };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
            var role = new Role { Name = $"role-{Guid.NewGuid():N}", NormalizedName = $"ROLE-{Guid.NewGuid():N}" };
            var permission = new Permission { Key = $"test.auth.{Guid.NewGuid():N}", Description = "Authentication integration permission.", CapabilityGroup = "test" };
            database.AddRange(user, role, permission, new UserRole { User = user, Role = role }, new RolePermission { Role = role, Permission = permission });
            await database.SaveChangesAsync();
        }

        var client = CreateAuthenticationClient(handleCookies: true);
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, password));
        Assert.Equal(HttpStatusCode.NoContent, login.StatusCode);
        Assert.Equal(0, login.Content.Headers.ContentLength ?? 0);
        Assert.Contains(login.Headers.GetValues("Set-Cookie"), value => value.StartsWith("proprium_session=", StringComparison.Ordinal) && value.Contains("httponly", StringComparison.OrdinalIgnoreCase) && value.Contains("samesite=lax", StringComparison.OrdinalIgnoreCase));

        var current = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, current.StatusCode);
        var payload = await current.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.Equal(username, payload?.Username);
        Assert.Single(payload?.Roles ?? []);
        Assert.Single(payload?.Permissions ?? []);

        var logout = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Contains(logout.Headers.GetValues("Set-Cookie"), value => value.StartsWith("proprium_session=", StringComparison.Ordinal));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);

        await using var evidence = CreateContext();
        var eventTypes = await evidence.AuthenticationEvents.Where(item => item.NormalizedUsername == username.ToUpperInvariant() || item.User!.NormalizedUsername == username.ToUpperInvariant()).Select(item => item.EventType).ToArrayAsync();
        Assert.Contains(AuthenticationEventType.LoginSucceeded, eventTypes);
        Assert.Contains(AuthenticationEventType.SessionCreated, eventTypes);
        Assert.Contains(AuthenticationEventType.Logout, eventTypes);
        Assert.Contains(AuthenticationEventType.SessionRevoked, eventTypes);
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
        var unknown = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest($"unknown-{Guid.NewGuid():N}", password));
        var disabled = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(disabledUsername, password));
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, disabled.StatusCode);
        Assert.False(unknown.Headers.Contains("Set-Cookie"));
        Assert.False(disabled.Headers.Contains("Set-Cookie"));
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
    public async Task Login_rejects_missing_or_invalid_origin_and_csrf_headers()
    {
        var request = new LoginRequest("any-user", "any-password");
        Assert.Equal(HttpStatusCode.BadRequest, (await factory.CreateClient().PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);

        var wrongOrigin = factory.CreateClient();
        wrongOrigin.DefaultRequestHeaders.Add("Origin", "https://untrusted.example");
        wrongOrigin.DefaultRequestHeaders.Add("X-Proprium-CSRF", "test");
        Assert.Equal(HttpStatusCode.BadRequest, (await wrongOrigin.PostAsJsonAsync("/api/v1/auth/login", request)).StatusCode);
    }
}
