namespace Proprium.Api.Configuration;

public static class ApiConfigurationSources
{
    private static readonly HashSet<string> ApprovedCommandLineKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "urls",
        "POSTGRES_PORT",
        "REDIS_PORT",
        "Logging:LogLevel:Default",
    };

    private static readonly IReadOnlyDictionary<string, bool> OperationalArguments =
        new Dictionary<string, bool>(StringComparer.Ordinal)
        {
            ["health-probe"] = true,
            ["export-permissions"] = true,
            ["write-openapi"] = true,
            ["migrate"] = false,
        };

    private static readonly HashSet<string> FrameworkHostArguments = new(StringComparer.OrdinalIgnoreCase)
    {
        "applicationName",
        "contentRoot",
        "environment",
    };

    private static readonly string[] SecretKeyTerms =
    [
        "PASSWORD",
        "SECRET",
        "TOKEN",
        "PRIVATE",
        "SIGNING",
        "CERTIFICATE",
        "CREDENTIAL",
        "CONNECTION_STRING",
    ];

    public static string[] ApprovedConfigurationArguments(IReadOnlyList<string> arguments)
    {
        var approved = new List<string>();
        for (var index = 0; index < arguments.Count; index++)
        {
            var argument = arguments[index];
            if (!argument.StartsWith("--", StringComparison.Ordinal))
                throw new ApiConfigurationException("COMMAND_LINE", "contains an unsupported positional argument.");

            var separator = argument.IndexOf('=');
            var key = argument[2..(separator < 0 ? argument.Length : separator)];
            if (FrameworkHostArguments.Contains(key))
            {
                if (separator < 0 && index + 1 < arguments.Count &&
                    !arguments[index + 1].StartsWith("--", StringComparison.Ordinal))
                    index++;
                continue;
            }
            if (OperationalArguments.TryGetValue(key, out var consumesValue))
            {
                if (consumesValue && separator < 0 && index + 1 < arguments.Count &&
                    !arguments[index + 1].StartsWith("--", StringComparison.Ordinal))
                    index++;
                continue;
            }

            if (SecretKeyTerms.Any(term => key.Contains(term, StringComparison.OrdinalIgnoreCase)))
                throw new ApiConfigurationException(
                    key,
                    ConfigurationFailureCategory.Incompatible,
                    "may not be supplied through command line.",
                    isSecret: true);
            if (!ApprovedCommandLineKeys.Contains(key))
                throw new ApiConfigurationException(
                    key,
                    ConfigurationFailureCategory.Incompatible,
                    "is not an approved command-line override.");

            approved.Add(argument);
            if (separator >= 0) continue;
            if (index + 1 >= arguments.Count || arguments[index + 1].StartsWith("--", StringComparison.Ordinal))
                throw new ApiConfigurationException(
                    key,
                    ConfigurationFailureCategory.Missing,
                    "requires a value.");
            approved.Add(arguments[++index]);
        }

        return approved.ToArray();
    }

    public static void Configure(
        ConfigurationManager configuration,
        string contentRootPath,
        string environmentName,
        IReadOnlyList<string> approvedCommandLineArguments,
        Action<IConfigurationBuilder>? addSecretProvider = null,
        string? environmentVariablePrefix = null)
    {
        configuration.Sources.Clear();
        configuration.SetBasePath(contentRootPath);
        configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: false);
        configuration.AddJsonFile($"appsettings.{environmentName}.json", optional: true, reloadOnChange: false);
        configuration.AddEnvironmentVariables(environmentVariablePrefix);
        addSecretProvider?.Invoke(configuration);
        if (approvedCommandLineArguments.Count > 0)
            configuration.AddCommandLine(approvedCommandLineArguments.ToArray());
    }
}
