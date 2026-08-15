using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Proprium.Api.Configuration;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class ConfigurationSourceTests
{
    [Theory]
    [InlineData("Development")]
    [InlineData("Test")]
    [InlineData("Production")]
    public void Canonical_provider_order_is_explicit_and_environment_independent(string environmentName)
    {
        using var files = SettingsFiles.Create(environmentName);
        var prefix = $"PROPRIUM_GP32_{Guid.NewGuid():N}_";
        var environmentKey = $"{prefix}POSTGRES_PORT";
        Environment.SetEnvironmentVariable(environmentKey, "3000");
        try
        {
            var configuration = new ConfigurationManager();
            ApiConfigurationSources.Configure(
                configuration,
                files.Path,
                environmentName,
                ["--POSTGRES_PORT=5000"],
                secrets => secrets.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["POSTGRES_PORT"] = "4000",
                }),
                prefix);

            Assert.Equal("5000", configuration["POSTGRES_PORT"]);
            Assert.Equal(
                [
                    "JsonConfigurationProvider",
                    "JsonConfigurationProvider",
                    "EnvironmentVariablesConfigurationProvider",
                    "MemoryConfigurationProvider",
                    "CommandLineConfigurationProvider",
                ],
                ((IConfigurationRoot)configuration).Providers.Select(provider => provider.GetType().Name));
        }
        finally
        {
            Environment.SetEnvironmentVariable(environmentKey, null);
        }
    }

    [Theory]
    [InlineData(false, false, false, "1000")]
    [InlineData(true, false, false, "2000")]
    [InlineData(true, true, false, "3000")]
    [InlineData(true, true, true, "4000")]
    public void Lower_layers_override_higher_layers(
        bool includeEnvironmentSpecific,
        bool includeEnvironmentVariable,
        bool includeSecretProvider,
        string expected)
    {
        using var files = SettingsFiles.Create(
            "Test",
            includeEnvironmentSpecific ? "2000" : null);
        var prefix = $"PROPRIUM_GP32_{Guid.NewGuid():N}_";
        var environmentKey = $"{prefix}POSTGRES_PORT";
        if (includeEnvironmentVariable)
            Environment.SetEnvironmentVariable(environmentKey, "3000");
        try
        {
            var configuration = new ConfigurationManager();
            ApiConfigurationSources.Configure(
                configuration,
                files.Path,
                "Test",
                [],
                includeSecretProvider
                    ? secrets => secrets.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["POSTGRES_PORT"] = "4000",
                    })
                    : null,
                prefix);

            Assert.Equal(expected, configuration["POSTGRES_PORT"]);
        }
        finally
        {
            Environment.SetEnvironmentVariable(environmentKey, null);
        }
    }

    [Fact]
    public void Invalid_stronger_override_is_retained_for_validation()
    {
        using var files = SettingsFiles.Create("Test");
        var configuration = new ConfigurationManager();
        ApiConfigurationSources.Configure(
            configuration,
            files.Path,
            "Test",
            ["--POSTGRES_PORT=invalid"]);

        var error = Assert.Throws<ApiConfigurationException>(() =>
            ApiConfiguration.Resolve(configuration, "Test"));

        Assert.Equal("POSTGRES_PORT", error.Setting);
        Assert.Equal("invalid", configuration["POSTGRES_PORT"]);
    }

    [Theory]
    [InlineData("--POSTGRES_PASSWORD=synthetic-secret")]
    [InlineData("--SESSION_TOKEN_DIGEST_KEY=synthetic-key")]
    [InlineData("--unknown-setting=value")]
    public void Command_line_rejects_secret_and_unapproved_configuration(string argument)
    {
        var error = Assert.Throws<ApiConfigurationException>(() =>
            ApiConfigurationSources.ApprovedConfigurationArguments([argument]));

        Assert.DoesNotContain("synthetic-secret", error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("synthetic-key", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Operational_arguments_are_not_promoted_to_configuration()
    {
        var approved = ApiConfigurationSources.ApprovedConfigurationArguments(
            ["--write-openapi", "contract.json", "--migrate", "--POSTGRES_PORT", "6000"]);

        Assert.Equal(["--POSTGRES_PORT", "6000"], approved);
    }

    private sealed class SettingsFiles : IDisposable
    {
        private SettingsFiles(string path) => Path = path;

        public string Path { get; }

        public static SettingsFiles Create(string environmentName, string? environmentPort = null)
        {
            var path = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(),
                $"proprium-gp32-{Guid.NewGuid():N}");
            Directory.CreateDirectory(path);
            File.WriteAllText(
                System.IO.Path.Combine(path, "appsettings.json"),
                JsonSerializer.Serialize(ValidValues("1000")));
            if (environmentPort is not null)
                File.WriteAllText(
                    System.IO.Path.Combine(path, $"appsettings.{environmentName}.json"),
                    JsonSerializer.Serialize(new Dictionary<string, string?>
                    {
                        ["POSTGRES_PORT"] = environmentPort,
                    }));
            return new SettingsFiles(path);
        }

        public void Dispose() => Directory.Delete(Path, recursive: true);

        private static Dictionary<string, string?> ValidValues(string postgresPort) => new()
        {
            ["Platform:Name"] = "Proprium",
            ["Platform:Version"] = "test",
            ["POSTGRES_HOST"] = "localhost",
            ["POSTGRES_PORT"] = postgresPort,
            ["POSTGRES_DATABASE"] = "proprium",
            ["POSTGRES_USER"] = "proprium",
            ["POSTGRES_PASSWORD"] = "synthetic-database-secret",
            ["REDIS_HOST"] = "localhost",
            ["REDIS_PORT"] = "6379",
            ["REDIS_PASSWORD"] = "",
            ["SESSION_TOKEN_DIGEST_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
            ["SESSION_LIFETIME_MINUTES"] = "480",
            ["AUTH_ALLOWED_ORIGIN"] = "https://web.example.test",
            ["LOGIN_RATE_LIMIT_PRIVACY_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
            ["LOCAL_ADMIN_ENABLED"] = "false",
        };
    }
}
