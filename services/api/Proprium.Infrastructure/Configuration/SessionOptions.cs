using System.ComponentModel.DataAnnotations;

namespace Proprium.Infrastructure.Configuration;

public sealed class SessionOptions
{
    [Required] public string TokenDigestKey { get; set; } = string.Empty;
    [Range(5, 43_200)] public int LifetimeMinutes { get; set; } = 480;
    public TimeSpan Lifetime => TimeSpan.FromMinutes(LifetimeMinutes);

    public byte[] GetTokenDigestKey()
    {
        try
        {
            var key = Convert.FromBase64String(TokenDigestKey);
            if (key.Length < 32) throw new InvalidOperationException("SESSION_TOKEN_DIGEST_KEY must decode to at least 32 bytes.");
            return key;
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException("SESSION_TOKEN_DIGEST_KEY must be a base64-encoded key.", exception);
        }
    }
}
