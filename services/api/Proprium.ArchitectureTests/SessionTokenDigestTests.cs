using Proprium.Domain.Identity;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class SessionTokenDigestTests
{
    [Fact]
    public void Hmac_digest_is_deterministic_bounded_and_never_the_raw_token()
    {
        var key = Enumerable.Range(0, 32).Select(item => (byte)item).ToArray();
        var digest = SessionTokenDigest.Compute("raw-session-token", key);

        Assert.Equal(digest, SessionTokenDigest.Compute("raw-session-token", key));
        Assert.NotEqual("raw-session-token", digest);
        Assert.Matches("^[a-f0-9]{64}$", digest);
    }

    [Fact]
    public void Blank_tokens_and_short_keys_are_rejected()
    {
        Assert.Throws<ArgumentException>(() => SessionTokenDigest.Compute("", new byte[32]));
        Assert.Throws<ArgumentException>(() => SessionTokenDigest.Compute("token", new byte[31]));
    }
}
