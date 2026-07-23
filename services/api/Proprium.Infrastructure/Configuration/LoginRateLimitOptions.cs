using System.ComponentModel.DataAnnotations;

namespace Proprium.Infrastructure.Configuration;

public sealed class LoginRateLimitOptions
{
    public const int LockedSourceLimit = 10;
    public const int LockedPairLimit = 5;
    public const int LockedWindowMinutes = 5;

    [Range(1, LockedSourceLimit)] public int SourceLimit { get; set; } = LockedSourceLimit;
    [Range(1, LockedPairLimit)] public int IdentifierSourceLimit { get; set; } = LockedPairLimit;
    [Range(1, LockedWindowMinutes)] public int WindowMinutes { get; set; } = LockedWindowMinutes;
    [Range(100, 100_000)] public int FallbackCapacity { get; set; } = 10_000;
    [Required] public string PrivacyKeyMaterial { get; set; } = string.Empty;
    public TimeSpan Window => TimeSpan.FromMinutes(WindowMinutes);
}
