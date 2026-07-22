using System.ComponentModel.DataAnnotations;

namespace Proprium.Infrastructure.Configuration;

public sealed class PostgresOptions
{
    [Required] public string Host { get; set; } = string.Empty;
    [Range(1, 65535)] public int Port { get; set; }
    [Required] public string Database { get; set; } = string.Empty;
    [Required] public string User { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
    public string ConnectionString => $"Host={Host};Port={Port};Database={Database};Username={User};Password={Password}";
}

public sealed class RedisOptions
{
    [Required] public string Host { get; set; } = string.Empty;
    [Range(1, 65535)] public int Port { get; set; }
    public string? Password { get; set; }
    public string ConnectionString => string.IsNullOrEmpty(Password) ? $"{Host}:{Port}" : $"{Host}:{Port},password={Password}";
}
