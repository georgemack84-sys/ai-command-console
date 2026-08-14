using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class LocalAdministratorPolicyTests
{
    [Fact]
    public void Enabled_initializer_is_rejected_outside_development() =>
        Assert.Throws<InvalidOperationException>(() => LocalAdministratorPolicy.EnsurePermitted(true, false));

    [Fact]
    public void Disabled_initializer_is_safe_outside_development() =>
        LocalAdministratorPolicy.EnsurePermitted(false, false);
}
