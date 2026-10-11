using System.ComponentModel.DataAnnotations;
using Npgsql;
using StackExchange.Redis;

namespace Proprium.Infrastructure.Configuration;

public sealed class PostgresOptions
{
    [Required] public string Host { get; init; } = string.Empty;
    [Range(1, 65535)] public int Port { get; init; }
    [Required] public string Database { get; init; } = string.Empty;
    [Required] public string User { get; init; } = string.Empty;
    [Required] public string Password { get; init; } = string.Empty;

    public string BuildConnectionString() => new NpgsqlConnectionStringBuilder
    {
        Host = Host,
        Port = Port,
        Database = Database,
        Username = User,
        Password = Password,
    }.ConnectionString;

    public override string ToString() => $"{nameof(PostgresOptions)} {{ Host = {Host}, Port = {Port}, Database = {Database}, User = [REDACTED], Password = [REDACTED] }}";
}

public sealed class RedisOptions
{
    [Required] public string Host { get; init; } = string.Empty;
    [Range(1, 65535)] public int Port { get; init; }
    public string? Password { get; init; }

    public ConfigurationOptions BuildConfiguration()
    {
        var configuration = new ConfigurationOptions
        {
            AbortOnConnectFail = false,
            Password = Password,
        };
        configuration.EndPoints.Add(Host, Port);
        return configuration;
    }

    public override string ToString() => $"{nameof(RedisOptions)} {{ Host = {Host}, Port = {Port}, Password = [REDACTED] }}";
}

public sealed class RecoveryContactEmailOptions
{
    public string? Host { get; init; }
    public int Port { get; init; }
    public string? Username { get; init; }
    public string? Password { get; init; }
    public string? FromAddress { get; init; }
    public string? FromDisplayName { get; init; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host);

    public override string ToString() => $"{nameof(RecoveryContactEmailOptions)} {{ Values = [REDACTED] }}";
}
