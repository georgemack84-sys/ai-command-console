using System.Globalization;
using Microsoft.Extensions.Options;
using Proprium.Infrastructure.Configuration;

namespace Proprium.Api.Configuration;

public enum ConfigurationFailureCategory
{
    Missing,
    Malformed,
    OutOfRange,
    Incompatible,
}

public sealed record ConfigurationValidationError(
    string Setting,
    ConfigurationFailureCategory Category,
    string Message,
    bool IsSecret = false)
{
    public override string ToString() => $"{Setting} [{CategoryLabel(Category)}] {Message}";

    private static string CategoryLabel(ConfigurationFailureCategory category) => category switch
    {
        ConfigurationFailureCategory.Missing => "MISSING",
        ConfigurationFailureCategory.Malformed => "MALFORMED",
        ConfigurationFailureCategory.OutOfRange => "OUT_OF_RANGE",
        ConfigurationFailureCategory.Incompatible => "INCOMPATIBLE",
        _ => throw new ArgumentOutOfRangeException(nameof(category), category, "Unknown configuration failure category."),
    };
}

public sealed class ApiConfigurationException : InvalidOperationException
{
    public ApiConfigurationException(string setting, string expectation)
        : this(setting, ConfigurationFailureCategory.Malformed, expectation)
    {
    }

    public ApiConfigurationException(
        string setting,
        ConfigurationFailureCategory category,
        string expectation,
        bool isSecret = false)
        : this([new ConfigurationValidationError(setting, category, expectation, isSecret)])
    {
    }

    public ApiConfigurationException(IReadOnlyList<ConfigurationValidationError> errors)
        : base(CreateMessage(errors))
    {
        if (errors.Count == 0)
            throw new ArgumentException("At least one configuration validation error is required.", nameof(errors));

        Errors = errors.ToArray();
    }

    public IReadOnlyList<ConfigurationValidationError> Errors { get; }
    public string Setting => Errors[0].Setting;
    public ConfigurationFailureCategory Category => Errors[0].Category;

    private static string CreateMessage(IReadOnlyList<ConfigurationValidationError> errors) =>
        errors.Count == 1
            ? errors[0].ToString()
            : $"Configuration validation failed:{Environment.NewLine}{string.Join(Environment.NewLine, errors.Select(error => $"- {error}"))}";
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
        var validation = new StartupConfigurationValidation(configuration);
        if (!SupportedEnvironments.Contains(environmentName, StringComparer.OrdinalIgnoreCase))
            validation.Malformed("ASPNETCORE_ENVIRONMENT", "must be Development, Test, Staging, or Production.");

        var platform = new PlatformOptions
        {
            Name = validation.Required("Platform:Name"),
            Version = validation.Required("Platform:Version"),
        };
        var postgres = new PostgresOptions
        {
            Host = validation.Required("POSTGRES_HOST"),
            Port = validation.RequiredInteger("POSTGRES_PORT", 1, 65_535),
            Database = validation.Required("POSTGRES_DATABASE"),
            User = validation.Required("POSTGRES_USER"),
            Password = validation.Required("POSTGRES_PASSWORD", isSecret: true),
        };
        var redis = new RedisOptions
        {
            Host = validation.Required("REDIS_HOST"),
            Port = validation.RequiredInteger("REDIS_PORT", 1, 65_535),
            Password = validation.Optional("REDIS_PASSWORD"),
        };
        var session = ResolveSession(validation);
        var authentication = ResolveAuthentication(validation);
        var loginRateLimit = ResolveLoginRateLimit(validation);
        var localAdministrator = ResolveLocalAdministrator(validation, environmentName);

        validation.ThrowIfInvalid();

        return new ApiConfigurationSnapshot(
            platform,
            postgres,
            redis,
            session,
            loginRateLimit,
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

    private static AuthenticationRequestOptions ResolveAuthentication(StartupConfigurationValidation validation)
    {
        const string key = "AUTH_ALLOWED_ORIGIN";
        var origin = validation.Required(key);
        if (validation.IsValid(key))
        {
            try
            {
                origin = OriginValidator.Normalize(origin);
            }
            catch (ArgumentException)
            {
                validation.Malformed(key, "must be one absolute HTTP(S) origin without a path, query, fragment, user information, or wildcard.");
            }
        }

        return new AuthenticationRequestOptions { AllowedOrigin = origin };
    }

    private static LocalAdministratorOptions ResolveLocalAdministrator(
        StartupConfigurationValidation validation,
        string environmentName)
    {
        var enabled = validation.OptionalBoolean("LOCAL_ADMIN_ENABLED", false);
        var username = validation.Optional("LOCAL_ADMIN_USERNAME");
        var password = validation.Optional("LOCAL_ADMIN_PASSWORD");
        if (enabled)
        {
            if (!environmentName.Equals("Development", StringComparison.OrdinalIgnoreCase))
                validation.Incompatible("LOCAL_ADMIN_ENABLED", "may be true only in Development.");
            if (string.IsNullOrWhiteSpace(username))
                validation.Missing("LOCAL_ADMIN_USERNAME", "is required when LOCAL_ADMIN_ENABLED is true.");
            if (string.IsNullOrWhiteSpace(password))
                validation.Missing("LOCAL_ADMIN_PASSWORD", "is required when LOCAL_ADMIN_ENABLED is true.", isSecret: true);
        }

        return new LocalAdministratorOptions(enabled, username, password);
    }

    private static LoginRateLimitOptions ResolveLoginRateLimit(StartupConfigurationValidation validation)
    {
        var options = new LoginRateLimitOptions
        {
            SourceLimit = validation.OptionalInteger("LOGIN_RATE_LIMIT_SOURCE", LoginRateLimitOptions.LockedSourceLimit, 1, int.MaxValue),
            IdentifierSourceLimit = validation.OptionalInteger("LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE", LoginRateLimitOptions.LockedPairLimit, 1, int.MaxValue),
            WindowMinutes = validation.OptionalInteger("LOGIN_RATE_LIMIT_WINDOW_MINUTES", LoginRateLimitOptions.LockedWindowMinutes, 1, int.MaxValue),
            FallbackCapacity = validation.OptionalInteger("LOGIN_RATE_LIMIT_FALLBACK_CAPACITY", 10_000, 100, 100_000),
            PrivacyKeyMaterial = validation.Required("LOGIN_RATE_LIMIT_PRIVACY_KEY", isSecret: true),
        };
        validation.ValidateLockedValue("LOGIN_RATE_LIMIT_SOURCE", options.SourceLimit, LoginRateLimitOptions.LockedSourceLimit);
        validation.ValidateLockedValue("LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE", options.IdentifierSourceLimit, LoginRateLimitOptions.LockedPairLimit);
        validation.ValidateLockedValue("LOGIN_RATE_LIMIT_WINDOW_MINUTES", options.WindowMinutes, LoginRateLimitOptions.LockedWindowMinutes);
        validation.ValidateBase64Key(options.PrivacyKeyMaterial, "LOGIN_RATE_LIMIT_PRIVACY_KEY");
        return options;
    }

    private static Proprium.Infrastructure.Configuration.SessionOptions ResolveSession(StartupConfigurationValidation validation)
    {
        var options = new Proprium.Infrastructure.Configuration.SessionOptions
        {
            TokenDigestKey = validation.Required("SESSION_TOKEN_DIGEST_KEY", isSecret: true),
            LifetimeMinutes = validation.RequiredInteger("SESSION_LIFETIME_MINUTES", 5, 43_200),
        };
        validation.ValidateBase64Key(options.TokenDigestKey, "SESSION_TOKEN_DIGEST_KEY");
        return options;
    }

    private sealed class StartupConfigurationValidation(IConfiguration configuration)
    {
        private readonly List<ConfigurationValidationError> errors = [];
        private readonly HashSet<string> invalidSettings = new(StringComparer.OrdinalIgnoreCase);

        public string Required(string key, bool isSecret = false)
        {
            var value = configuration[key];
            if (!string.IsNullOrWhiteSpace(value)) return value;

            Missing(key, "is required and may not be empty.", isSecret);
            return string.Empty;
        }

        public string? Optional(string key)
        {
            var value = configuration[key];
            return string.IsNullOrEmpty(value) ? null : value;
        }

        public int RequiredInteger(string key, int minimum, int maximum)
        {
            var value = Required(key);
            return IsValid(key) ? ParseInteger(value, key, minimum, maximum, minimum) : minimum;
        }

        public int OptionalInteger(string key, int defaultValue, int minimum, int maximum)
        {
            var value = configuration[key];
            return string.IsNullOrWhiteSpace(value)
                ? defaultValue
                : ParseInteger(value, key, minimum, maximum, defaultValue);
        }

        public bool OptionalBoolean(string key, bool defaultValue)
        {
            var value = configuration[key];
            if (string.IsNullOrWhiteSpace(value)) return defaultValue;
            if (bool.TryParse(value, out var parsed)) return parsed;

            Malformed(key, "must be true or false.");
            return defaultValue;
        }

        public void ValidateBase64Key(string value, string key)
        {
            if (!IsValid(key)) return;

            try
            {
                if (Convert.FromBase64String(value).Length < 32) throw new FormatException();
            }
            catch (FormatException)
            {
                Malformed(key, "must be a base64-encoded key with at least 32 bytes.", isSecret: true);
            }
        }

        public void ValidateLockedValue(string key, int actual, int expected)
        {
            if (IsValid(key) && actual != expected)
                Incompatible(key, $"must equal the locked value {expected}.");
        }

        public bool IsValid(string key) => !invalidSettings.Contains(key);

        public void Missing(string key, string message, bool isSecret = false) =>
            Add(key, ConfigurationFailureCategory.Missing, message, isSecret);

        public void Malformed(string key, string message, bool isSecret = false) =>
            Add(key, ConfigurationFailureCategory.Malformed, message, isSecret);

        public void Incompatible(string key, string message) =>
            Add(key, ConfigurationFailureCategory.Incompatible, message, isSecret: false);

        public void ThrowIfInvalid()
        {
            if (errors.Count > 0) throw new ApiConfigurationException(errors);
        }

        private int ParseInteger(string value, string key, int minimum, int maximum, int fallback)
        {
            if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
            {
                Malformed(key, "must be an integer.");
                return fallback;
            }

            if (parsed < minimum || parsed > maximum)
            {
                Add(key, ConfigurationFailureCategory.OutOfRange, $"must be from {minimum} through {maximum}.", isSecret: false);
                return fallback;
            }

            return parsed;
        }

        private void Add(string key, ConfigurationFailureCategory category, string message, bool isSecret)
        {
            errors.Add(new ConfigurationValidationError(key, category, message, isSecret));
            invalidSettings.Add(key);
        }
    }
}
