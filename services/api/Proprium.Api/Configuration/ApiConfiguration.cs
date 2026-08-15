using System.Globalization;
using Microsoft.Extensions.Options;
using Proprium.Infrastructure.Configuration;

namespace Proprium.Api.Configuration;

public sealed class ApiConfigurationException(string setting, string expectation)
    : InvalidOperationException($"{setting} {expectation}")
{
    public string Setting { get; } = setting;
}

public sealed class LocalAdministratorOptions(bool enabled, string? username, string? password)
{
    public bool Enabled { get; } = enabled;
    public string? Username { get; } = username;
    public string? Password { get; } = password;
    public override string ToString() => $"{nameof(LocalAdministratorOptions)} {{ Enabled = {Enabled}, Username = [REDACTED], Password = [REDACTED] }}";
}

public sealed class ApiConfigurationSnapshot(
    PlatformOptions platform,
    PostgresOptions postgres,
    RedisOptions redis,
    Proprium.Infrastructure.Configuration.SessionOptions session,
    LoginRateLimitOptions loginRateLimit,
    AuthenticationRequestOptions authentication,
    LocalAdministratorOptions localAdministrator)
{
    public PlatformOptions Platform { get; } = platform;
    public PostgresOptions Postgres { get; } = postgres;
    public RedisOptions Redis { get; } = redis;
    public Proprium.Infrastructure.Configuration.SessionOptions Session { get; } = session;
    public LoginRateLimitOptions LoginRateLimit { get; } = loginRateLimit;
    public AuthenticationRequestOptions Authentication { get; } = authentication;
    public LocalAdministratorOptions LocalAdministrator { get; } = localAdministrator;
    public override string ToString() => $"{nameof(ApiConfigurationSnapshot)} {{ Values = [REDACTED] }}";
}

public static class ApiConfiguration
{
    private static readonly string[] SupportedEnvironments = ["Development", "Test", "Staging", "Production"];

    public static ApiConfigurationSnapshot Resolve(IConfiguration configuration, string environmentName)
    {
        if (!SupportedEnvironments.Contains(environmentName, StringComparer.OrdinalIgnoreCase))
            throw new ApiConfigurationException("ASPNETCORE_ENVIRONMENT", "must be Development, Test, Staging, or Production.");

        var authentication = new AuthenticationRequestOptions
        {
            AllowedOrigin = Required(configuration, "AUTH_ALLOWED_ORIGIN"),
        };
        try
        {
            authentication.AllowedOrigin = OriginValidator.Normalize(authentication.AllowedOrigin);
        }
        catch (ArgumentException)
        {
            throw new ApiConfigurationException("AUTH_ALLOWED_ORIGIN", "must be one absolute HTTP(S) origin without a path, query, fragment, user information, or wildcard.");
        }

        var localAdministrator = new LocalAdministratorOptions(
            OptionalBoolean(configuration, "LOCAL_ADMIN_ENABLED", false),
            Optional(configuration, "LOCAL_ADMIN_USERNAME"),
            Optional(configuration, "LOCAL_ADMIN_PASSWORD"));
        if (localAdministrator.Enabled)
        {
            if (!environmentName.Equals("Development", StringComparison.OrdinalIgnoreCase))
                throw new ApiConfigurationException("LOCAL_ADMIN_ENABLED", "may be true only in Development.");
            if (string.IsNullOrWhiteSpace(localAdministrator.Username))
                throw new ApiConfigurationException("LOCAL_ADMIN_USERNAME", "is required when LOCAL_ADMIN_ENABLED is true.");
            if (string.IsNullOrWhiteSpace(localAdministrator.Password))
                throw new ApiConfigurationException("LOCAL_ADMIN_PASSWORD", "is required when LOCAL_ADMIN_ENABLED is true.");
        }

        return new ApiConfigurationSnapshot(
            new PlatformOptions
            {
                Name = Required(configuration, "Platform:Name"),
                Version = Required(configuration, "Platform:Version"),
            },
            new PostgresOptions
            {
                Host = Required(configuration, "POSTGRES_HOST"),
                Port = RequiredInteger(configuration, "POSTGRES_PORT", 1, 65_535),
                Database = Required(configuration, "POSTGRES_DATABASE"),
                User = Required(configuration, "POSTGRES_USER"),
                Password = Required(configuration, "POSTGRES_PASSWORD"),
            },
            new RedisOptions
            {
                Host = Required(configuration, "REDIS_HOST"),
                Port = RequiredInteger(configuration, "REDIS_PORT", 1, 65_535),
                Password = Optional(configuration, "REDIS_PASSWORD"),
            },
            ResolveSession(configuration),
            ResolveLoginRateLimit(configuration),
            authentication,
            localAdministrator);
    }

    public static IServiceCollection AddPropriumConfiguration(this IServiceCollection services, ApiConfigurationSnapshot snapshot)
    {
        services.AddSingleton<IOptions<PlatformOptions>>(Options.Create(snapshot.Platform));
        services.AddSingleton<IOptions<PostgresOptions>>(Options.Create(snapshot.Postgres));
        services.AddSingleton<IOptions<RedisOptions>>(Options.Create(snapshot.Redis));
        services.AddSingleton<IOptions<Proprium.Infrastructure.Configuration.SessionOptions>>(Options.Create(snapshot.Session));
        services.AddSingleton<IOptions<LoginRateLimitOptions>>(Options.Create(snapshot.LoginRateLimit));
        services.AddSingleton<IOptions<AuthenticationRequestOptions>>(Options.Create(snapshot.Authentication));
        services.AddSingleton(snapshot.LocalAdministrator);
        return services;
    }

    private static LoginRateLimitOptions ResolveLoginRateLimit(IConfiguration configuration)
    {
        var options = new LoginRateLimitOptions
        {
            SourceLimit = OptionalInteger(configuration, "LOGIN_RATE_LIMIT_SOURCE", LoginRateLimitOptions.LockedSourceLimit, 1, LoginRateLimitOptions.LockedSourceLimit),
            IdentifierSourceLimit = OptionalInteger(configuration, "LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE", LoginRateLimitOptions.LockedPairLimit, 1, LoginRateLimitOptions.LockedPairLimit),
            WindowMinutes = OptionalInteger(configuration, "LOGIN_RATE_LIMIT_WINDOW_MINUTES", LoginRateLimitOptions.LockedWindowMinutes, 1, LoginRateLimitOptions.LockedWindowMinutes),
            FallbackCapacity = OptionalInteger(configuration, "LOGIN_RATE_LIMIT_FALLBACK_CAPACITY", 10_000, 100, 100_000),
            PrivacyKeyMaterial = Required(configuration, "LOGIN_RATE_LIMIT_PRIVACY_KEY"),
        };
        if (options.SourceLimit != LoginRateLimitOptions.LockedSourceLimit)
            throw new ApiConfigurationException("LOGIN_RATE_LIMIT_SOURCE", $"must equal the locked value {LoginRateLimitOptions.LockedSourceLimit}.");
        if (options.IdentifierSourceLimit != LoginRateLimitOptions.LockedPairLimit)
            throw new ApiConfigurationException("LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE", $"must equal the locked value {LoginRateLimitOptions.LockedPairLimit}.");
        if (options.WindowMinutes != LoginRateLimitOptions.LockedWindowMinutes)
            throw new ApiConfigurationException("LOGIN_RATE_LIMIT_WINDOW_MINUTES", $"must equal the locked value {LoginRateLimitOptions.LockedWindowMinutes}.");
        ValidateBase64Key(options.PrivacyKeyMaterial, "LOGIN_RATE_LIMIT_PRIVACY_KEY");
        return options;
    }

    private static Proprium.Infrastructure.Configuration.SessionOptions ResolveSession(IConfiguration configuration)
    {
        var options = new Proprium.Infrastructure.Configuration.SessionOptions
        {
            TokenDigestKey = Required(configuration, "SESSION_TOKEN_DIGEST_KEY"),
            LifetimeMinutes = RequiredInteger(configuration, "SESSION_LIFETIME_MINUTES", 5, 43_200),
        };
        ValidateBase64Key(options.TokenDigestKey, "SESSION_TOKEN_DIGEST_KEY");
        return options;
    }

    private static string Required(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value)) throw new ApiConfigurationException(key, "is required and may not be empty.");
        return value;
    }

    private static string? Optional(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        return string.IsNullOrEmpty(value) ? null : value;
    }

    private static int RequiredInteger(IConfiguration configuration, string key, int minimum, int maximum) =>
        ParseInteger(Required(configuration, key), key, minimum, maximum);

    private static int OptionalInteger(IConfiguration configuration, string key, int defaultValue, int minimum, int maximum)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value) ? defaultValue : ParseInteger(value, key, minimum, maximum);
    }

    private static int ParseInteger(string value, string key, int minimum, int maximum)
    {
        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) || parsed < minimum || parsed > maximum)
            throw new ApiConfigurationException(key, $"must be an integer from {minimum} through {maximum}.");
        return parsed;
    }

    private static bool OptionalBoolean(IConfiguration configuration, string key, bool defaultValue)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value)) return defaultValue;
        if (!bool.TryParse(value, out var parsed)) throw new ApiConfigurationException(key, "must be true or false.");
        return parsed;
    }

    private static void ValidateBase64Key(string value, string key)
    {
        try
        {
            if (Convert.FromBase64String(value).Length < 32) throw new FormatException();
        }
        catch (FormatException)
        {
            throw new ApiConfigurationException(key, "must be a base64-encoded key with at least 32 bytes.");
        }
    }
}
