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

    public byte[] GetPrivacyKey()
    {
        try
        {
            var key = Convert.FromBase64String(PrivacyKeyMaterial);
            if (key.Length < 32) throw new InvalidOperationException("LOGIN_RATE_LIMIT_PRIVACY_KEY must decode to at least 32 bytes.");
            return key;
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException("LOGIN_RATE_LIMIT_PRIVACY_KEY must be a base64-encoded key.", exception);
        }
    }
}
