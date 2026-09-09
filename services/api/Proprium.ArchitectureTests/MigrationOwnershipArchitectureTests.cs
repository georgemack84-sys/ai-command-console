using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class MigrationOwnershipArchitectureTests
{
    [Fact]
    public void ARCH_007_only_infrastructure_persistence_owns_migrations_and_model_snapshots()
    {
        var violations = ArchitectureRules.MigrationOwnershipViolations(ArchitectureDefinitions.ProductionLayers);

        Assert.True(violations.Length == 0, "ARCH-007 MIGRATION OWNERSHIP VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void ARCH_007_only_infrastructure_persistence_owns_dbcontexts()
    {
        var violations = ArchitectureRules.DbContextOwnershipViolations(ArchitectureDefinitions.ProductionLayers);

        Assert.True(violations.Length == 0, "ARCH-007 MIGRATION OWNERSHIP VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }
}
