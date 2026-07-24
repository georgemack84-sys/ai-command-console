using System.ComponentModel.DataAnnotations;

namespace Proprium.Api.Configuration;

public sealed class PlatformOptions
{
    public const string SectionName = "Platform";

    [Required, MinLength(1)] public string Name { get; init; } = "Proprium";
    [Required, MinLength(1)] public string Version { get; init; } = "0.1.0";
}
