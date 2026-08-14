using Proprium.Api.Configuration;
using Proprium.Application.Authentication;
using Proprium.Contracts.V1;
using Proprium.Infrastructure.Configuration;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class SecretDisplayTests
{
    [Fact]
    public void Authentication_values_redact_secret_material_from_string_representation()
    {
        const string secret = "sensitive-fixture-value";
        var values = new object[]
        {
            new LoginRequest("operator", secret),
            new LoginAttempt("operator", secret, "correlation"),
            new RawSessionToken(secret),
            new SessionTokenHash(secret),
            new GeneratedSessionToken(new RawSessionToken(secret), new SessionTokenHash(secret)),
            new CreatedSession(new RawSessionToken(secret), Guid.Empty, DateTimeOffset.UnixEpoch),
            new LoginResult(true, new RawSessionToken(secret)),
        };

        foreach (var value in values)
        {
            Assert.DoesNotContain(secret, value.ToString(), StringComparison.Ordinal);
            Assert.Contains("[REDACTED]", value.ToString(), StringComparison.Ordinal);
        }
    }

    [Fact]
    public void Configuration_values_redact_secret_material_from_string_representation()
    {
        const string secret = "sensitive-fixture-value";
        var localAdministrator = new LocalAdministratorOptions(true, "operator", secret);
        var snapshot = new ApiConfigurationSnapshot(
            new PlatformOptions(),
            new PostgresOptions { Password = secret },
            new RedisOptions { Password = secret },
            new SessionOptions { TokenDigestKey = secret },
            new LoginRateLimitOptions { PrivacyKeyMaterial = secret },
            new AuthenticationRequestOptions(),
            localAdministrator);

        foreach (var value in new object[] { localAdministrator, snapshot })
        {
            Assert.DoesNotContain(secret, value.ToString(), StringComparison.Ordinal);
            Assert.DoesNotContain("operator", value.ToString(), StringComparison.Ordinal);
            Assert.Contains("[REDACTED]", value.ToString(), StringComparison.Ordinal);
        }
    }
}
