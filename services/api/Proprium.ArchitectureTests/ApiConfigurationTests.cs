using System.Net;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Proprium.Api.Configuration;
using Proprium.Infrastructure.Configuration;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class ApiConfigurationTests
{
    [Fact]
    public void Canonical_values_resolve_to_typed_configuration()
    {
        var resolved = Resolve(ValidValues());

        Assert.Equal("Proprium", resolved.Platform.Name);
        Assert.Equal("test", resolved.Platform.Version);
        Assert.Equal("localhost", resolved.Postgres.Host);
        Assert.Equal(55432, resolved.Postgres.Port);
        Assert.Equal("proprium", resolved.Postgres.Database);
        Assert.Equal("proprium", resolved.Postgres.User);
        Assert.Equal("sensitive-database-value", resolved.Postgres.Password);
        Assert.Equal("localhost", resolved.Redis.Host);
        Assert.Equal(6379, resolved.Redis.Port);
        Assert.Null(resolved.Redis.Password);
    }

    [Theory]
    [InlineData("POSTGRES_HOST", null)]
    [InlineData("POSTGRES_HOST", "")]
    [InlineData("POSTGRES_HOST", "   ")]
    [InlineData("POSTGRES_DATABASE", "   ")]
    [InlineData("POSTGRES_USER", "")]
    [InlineData("POSTGRES_PASSWORD", null)]
    [InlineData("REDIS_HOST", "   ")]
    [InlineData("Platform:Name", "   ")]
    public void Required_values_reject_missing_empty_and_whitespace(string key, string? value)
    {
        var values = ValidValues();
        values[key] = value;

        var error = Assert.Throws<ApiConfigurationException>(() => Resolve(values));
        Assert.Equal(key, error.Setting);
    }

    [Theory]
    [InlineData("POSTGRES_PORT", "not-an-integer")]
    [InlineData("POSTGRES_PORT", "0")]
    [InlineData("POSTGRES_PORT", "65536")]
    [InlineData("REDIS_PORT", "not-an-integer")]
    [InlineData("REDIS_PORT", "0")]
    [InlineData("REDIS_PORT", "65536")]
    [InlineData("SESSION_LIFETIME_MINUTES", "4")]
    [InlineData("LOGIN_RATE_LIMIT_FALLBACK_CAPACITY", "99")]
    public void Malformed_or_out_of_range_numbers_fail_with_the_setting_name(string key, string value)
    {
        var values = ValidValues();
        values[key] = value;

        var error = Assert.Throws<ApiConfigurationException>(() => Resolve(values));
        Assert.Equal(key, error.Setting);
        Assert.Contains("must be an integer", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Invalid_origin_fails_before_startup()
    {
        var values = ValidValues();
        values["AUTH_ALLOWED_ORIGIN"] = "not-a-url";

        var error = Assert.Throws<ApiConfigurationException>(() => Resolve(values));
        Assert.Equal("AUTH_ALLOWED_ORIGIN", error.Setting);
        Assert.DoesNotContain("not-a-url", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Documented_optional_values_have_deterministic_defaults()
    {
        var values = ValidValues();
        values.Remove("REDIS_PASSWORD");
        values.Remove("LOGIN_RATE_LIMIT_SOURCE");
        values.Remove("LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE");
        values.Remove("LOGIN_RATE_LIMIT_WINDOW_MINUTES");
        values.Remove("LOGIN_RATE_LIMIT_FALLBACK_CAPACITY");
        values.Remove("LOCAL_ADMIN_ENABLED");

        var resolved = Resolve(values);

        Assert.Null(resolved.Redis.Password);
        Assert.Equal(10, resolved.LoginRateLimit.SourceLimit);
        Assert.Equal(5, resolved.LoginRateLimit.IdentifierSourceLimit);
        Assert.Equal(5, resolved.LoginRateLimit.WindowMinutes);
        Assert.Equal(10_000, resolved.LoginRateLimit.FallbackCapacity);
        Assert.False(resolved.LocalAdministrator.Enabled);
    }

    [Fact]
    public void Environment_variables_override_tracked_values_and_command_line_overrides_environment()
    {
        var prefix = $"PROPRIUM_GP03_{Guid.NewGuid():N}_";
        var environmentKey = $"{prefix}POSTGRES_PORT";
        Environment.SetEnvironmentVariable(environmentKey, "6000");
        try
        {
            var builder = new ConfigurationBuilder()
                .AddInMemoryCollection(ValidValues())
                .AddEnvironmentVariables(prefix);
            Assert.Equal(6000, ApiConfiguration.Resolve(builder.Build(), "Test").Postgres.Port);

            builder.AddCommandLine(["--POSTGRES_PORT=7000"]);
            Assert.Equal(7000, ApiConfiguration.Resolve(builder.Build(), "Test").Postgres.Port);
        }
        finally
        {
            Environment.SetEnvironmentVariable(environmentKey, null);
        }
    }

    [Fact]
    public void Secret_validation_reports_the_name_without_the_value()
    {
        const string secretValue = "actual-sensitive-value-for-test";
        var values = ValidValues();
        values["SESSION_TOKEN_DIGEST_KEY"] = secretValue;

        var error = Assert.Throws<ApiConfigurationException>(() => Resolve(values));
        Assert.Equal("SESSION_TOKEN_DIGEST_KEY", error.Setting);
        Assert.Contains("SESSION_TOKEN_DIGEST_KEY", error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain(secretValue, error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Provider_builders_preserve_special_characters_without_manual_concatenation()
    {
        const string postgresSecret = "fake;password='with spaces'";
        var postgres = new PostgresOptions
        {
            Host = "database.example.test",
            Port = 5432,
            Database = "proprium",
            User = "service-user",
            Password = postgresSecret,
        };
        var postgresConnection = new NpgsqlConnectionStringBuilder(postgres.BuildConnectionString());

        Assert.Equal(postgres.Host, postgresConnection.Host);
        Assert.Equal(postgres.Port, postgresConnection.Port);
        Assert.Equal(postgres.Database, postgresConnection.Database);
        Assert.Equal(postgres.User, postgresConnection.Username);
        Assert.Equal(postgresSecret, postgresConnection.Password);

        const string redisSecret = "fake,password=still-a-value";
        var redis = new RedisOptions
        {
            Host = "cache.example.test",
            Port = 6380,
            Password = redisSecret,
        };
        var redisConfiguration = redis.BuildConfiguration();
        var redisEndpoint = Assert.IsType<DnsEndPoint>(Assert.Single(redisConfiguration.EndPoints));

        Assert.Equal(redisSecret, redisConfiguration.Password);
        Assert.Equal(redis.Host, redisEndpoint.Host);
        Assert.Equal(redis.Port, redisEndpoint.Port);
        Assert.False(redisConfiguration.AbortOnConnectFail);
    }

    [Fact]
    public void Local_administrator_is_conditional_and_development_only()
    {
        var missingCredentials = ValidValues();
        missingCredentials["LOCAL_ADMIN_ENABLED"] = "true";
        Assert.Equal("LOCAL_ADMIN_USERNAME", Assert.Throws<ApiConfigurationException>(() => Resolve(missingCredentials, "Development")).Setting);

        var production = ValidValues();
        production["LOCAL_ADMIN_ENABLED"] = "true";
        production["LOCAL_ADMIN_USERNAME"] = "operator";
        production["LOCAL_ADMIN_PASSWORD"] = "sensitive-test-value";
        Assert.Equal("LOCAL_ADMIN_ENABLED", Assert.Throws<ApiConfigurationException>(() => Resolve(production, "Production")).Setting);
    }

    [Fact]
    public void Unknown_environment_names_fail_deterministically() =>
        Assert.Equal("ASPNETCORE_ENVIRONMENT", Assert.Throws<ApiConfigurationException>(() => Resolve(ValidValues(), "DeveloperLaptop")).Setting);

    private static ApiConfigurationSnapshot Resolve(Dictionary<string, string?> values, string environment = "Test") =>
        ApiConfiguration.Resolve(new ConfigurationBuilder().AddInMemoryCollection(values).Build(), environment);

    private static Dictionary<string, string?> ValidValues() => new()
    {
        ["Platform:Name"] = "Proprium",
        ["Platform:Version"] = "test",
        ["POSTGRES_HOST"] = "localhost",
        ["POSTGRES_PORT"] = "55432",
        ["POSTGRES_DATABASE"] = "proprium",
        ["POSTGRES_USER"] = "proprium",
        ["POSTGRES_PASSWORD"] = "sensitive-database-value",
        ["REDIS_HOST"] = "localhost",
        ["REDIS_PORT"] = "6379",
        ["REDIS_PASSWORD"] = "",
        ["SESSION_TOKEN_DIGEST_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        ["SESSION_LIFETIME_MINUTES"] = "480",
        ["AUTH_ALLOWED_ORIGIN"] = "https://web.example.test",
        ["LOGIN_RATE_LIMIT_PRIVACY_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        ["LOGIN_RATE_LIMIT_SOURCE"] = "10",
        ["LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE"] = "5",
        ["LOGIN_RATE_LIMIT_WINDOW_MINUTES"] = "5",
        ["LOGIN_RATE_LIMIT_FALLBACK_CAPACITY"] = "10000",
        ["LOCAL_ADMIN_ENABLED"] = "false",
        ["LOCAL_ADMIN_USERNAME"] = "",
        ["LOCAL_ADMIN_PASSWORD"] = "",
    };
}
