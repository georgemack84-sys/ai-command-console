using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class ArchitectureExceptionRegistryTests
{
    [Fact]
    public void ARCH_010_exceptions_are_specific_complete_and_unexpired()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var violations = ArchitectureExceptionRegistry.Violations(ArchitectureExceptionRegistry.All, today);

        Assert.True(violations.Length == 0, "ARCH-010 EXCEPTION GOVERNANCE VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void ARCH_010_rejects_broad_incomplete_and_expired_exceptions()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var violations = ArchitectureExceptionRegistry.Violations(
            [new ArchitectureException("ARCH-005", "Proprium.Api.*", "", "", today.AddDays(1), today.AddDays(-1))],
            today);

        Assert.NotEmpty(violations);
    }
}
