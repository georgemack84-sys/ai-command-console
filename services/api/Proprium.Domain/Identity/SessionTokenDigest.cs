using System.Security.Cryptography;
using System.Text;

namespace Proprium.Domain.Identity;

public static class SessionTokenDigest
{
    public static string Compute(string rawToken, ReadOnlySpan<byte> key)
    {
        if (string.IsNullOrWhiteSpace(rawToken)) throw new ArgumentException("A session token is required.", nameof(rawToken));
        if (key.Length < 32) throw new ArgumentException("A session token digest key must contain at least 32 bytes.", nameof(key));

        return Convert.ToHexString(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
    }
}
