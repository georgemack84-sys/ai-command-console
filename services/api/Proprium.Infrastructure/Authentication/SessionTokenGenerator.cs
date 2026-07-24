using System.Security.Cryptography;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Authentication;

public sealed class SessionTokenGenerator(byte[] digestKey) : ISessionTokenGenerator
{
    public const int EntropyBytes = 32;
    public const int EncodedLength = 43;

    private readonly byte[] digestKey = digestKey.Length >= 32
        ? digestKey.ToArray()
        : throw new ArgumentException("A session token digest key must contain at least 32 bytes.", nameof(digestKey));

    public GeneratedSessionToken Generate()
    {
        var rawToken = new RawSessionToken(Encode(RandomNumberGenerator.GetBytes(EntropyBytes)));
        return new GeneratedSessionToken(rawToken, Hash(rawToken));
    }

    public SessionTokenHash Hash(RawSessionToken rawToken)
    {
        if (!IsStructurallyValid(rawToken)) throw new ArgumentException("The session token is malformed.", nameof(rawToken));
        return new SessionTokenHash(SessionTokenDigest.Compute(rawToken.Value, digestKey));
    }

    public bool IsStructurallyValid(RawSessionToken rawToken) => rawToken is { Value.Length: EncodedLength } && rawToken.Value.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_');

    private static string Encode(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
