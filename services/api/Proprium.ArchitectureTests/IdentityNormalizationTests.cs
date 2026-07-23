using Proprium.Domain.Identity;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class IdentityNormalizationTests
{
    [Fact]
    public void Username_and_role_names_use_trimmed_invariant_uppercase()
    {
        Assert.Equal("IUSER", IdentityNormalization.NormalizeUsername(" iuser "));
        Assert.Equal("ADMINISTRATOR", IdentityNormalization.NormalizeRoleName(" administrator "));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Blank_identity_values_are_rejected(string value)
    {
        Assert.Throws<ArgumentException>(() => IdentityNormalization.NormalizeUsername(value));
        Assert.Throws<ArgumentException>(() => IdentityNormalization.NormalizeRoleName(value));
    }
}
