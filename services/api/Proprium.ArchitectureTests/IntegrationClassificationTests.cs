using Microsoft.AspNetCore.Mvc.Testing;
using Proprium.IntegrationTests;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class IntegrationClassificationTests
{
    private static readonly IntegrationClassificationPolicy Policy = new([typeof(WebApplicationFactory<Program>)]);

    [Fact]
    public void Recognized_test_assemblies_have_valid_classification()
    {
        var violations = Policy.ValidateInfrastructureIndependentAssembly(typeof(IntegrationClassificationTests).Assembly)
            .Concat(Policy.ValidateIntegrationAssembly(typeof(PlatformApiTests).Assembly))
            .ToArray();

        Assert.True(violations.Length == 0, string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void Unclassified_infrastructure_fixture_is_rejected()
    {
        var violations = FixturePolicy().ValidateIntegrationTypes([typeof(UnclassifiedInfrastructureFixture)]);

        Assert.Contains(violations, violation => violation.Contains(nameof(IIntegrationTest), StringComparison.Ordinal));
    }

    [Fact]
    public void Integration_marker_without_infrastructure_evidence_is_rejected()
    {
        var violations = FixturePolicy().ValidateIntegrationTypes([typeof(OverclassifiedFixture)]);

        Assert.Contains(violations, violation => violation.Contains("no approved infrastructure evidence", StringComparison.Ordinal));
    }

    [Fact]
    public void Conflicting_category_traits_are_rejected()
    {
        var violations = FixturePolicy().ValidateIntegrationTypes([typeof(ConflictingCategoryFixture)]);

        Assert.Contains(violations, violation => violation.Contains("Architecture, Integration", StringComparison.Ordinal));
    }

    [Fact]
    public void Explicit_integration_and_infrastructure_independent_fixtures_are_accepted()
    {
        Assert.Empty(FixturePolicy().ValidateIntegrationTypes([typeof(ValidIntegrationFixture)]));
        Assert.Empty(FixturePolicy().ValidateInfrastructureIndependentTypes([typeof(ValidUnitFixture), typeof(ValidArchitectureFixture)]));
    }

    private static IntegrationClassificationPolicy FixturePolicy() =>
        new([typeof(ApprovedInfrastructureFixture)], [typeof(ClassificationTestAttribute)]);

    private sealed class ApprovedInfrastructureFixture;
    private sealed class ClassificationTestAttribute : Attribute;

    [Trait("Category", "Integration")]
    private sealed class UnclassifiedInfrastructureFixture : IClassFixture<ApprovedInfrastructureFixture>
    {
        [ClassificationTest]
        public void Test() { }
    }

    [Trait("Category", "Integration")]
    private sealed class OverclassifiedFixture : IIntegrationTest
    {
        [ClassificationTest]
        public void Test() { }
    }

    [Trait("Category", "Architecture")]
    [Trait("Category", "Integration")]
    private sealed class ConflictingCategoryFixture : IIntegrationTest, IClassFixture<ApprovedInfrastructureFixture>
    {
        [ClassificationTest]
        public void Test() { }
    }

    [Trait("Category", "Integration")]
    private sealed class ValidIntegrationFixture : IIntegrationTest, IClassFixture<ApprovedInfrastructureFixture>
    {
        [ClassificationTest]
        public void Test() { }
    }

    [Trait("Category", "Unit")]
    private sealed class ValidUnitFixture
    {
        [ClassificationTest]
        public void Test() { }
    }

    [Trait("Category", "Architecture")]
    private sealed class ValidArchitectureFixture
    {
        [ClassificationTest]
        public void Test() { }
    }
}
