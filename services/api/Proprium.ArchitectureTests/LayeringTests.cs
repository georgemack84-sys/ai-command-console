using NetArchTest.Rules;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class LayeringTests
{
    [Fact]
    public void Domain_must_not_depend_on_outer_layers_or_frameworks() => AssertNoDependencies(
        "ARCH-001",
        "DOMAIN INDEPENDENCE",
        "Domain may not depend on outer layers or delivery/persistence frameworks.",
        ArchitectureDefinitions.DomainAssembly,
        ArchitectureDefinitions.ApplicationNamespace,
        ArchitectureDefinitions.InfrastructureNamespace,
        ArchitectureDefinitions.ApiNamespace,
        ArchitectureDefinitions.ContractsNamespace,
        "Microsoft.AspNetCore",
        "Microsoft.Extensions.Configuration",
        "Microsoft.Extensions.Options",
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "StackExchange.Redis");

    [Fact]
    public void Application_must_not_depend_on_api_infrastructure_or_implementation_frameworks() => AssertNoDependencies(
        "ARCH-002",
        "APPLICATION INDEPENDENCE",
        "Application may depend on Domain contracts, not API or Infrastructure implementations.",
        ArchitectureDefinitions.ApplicationAssembly,
        ArchitectureDefinitions.ApiNamespace,
        ArchitectureDefinitions.InfrastructureNamespace,
        "Microsoft.AspNetCore",
        "Microsoft.Extensions.Configuration",
        "Microsoft.Extensions.Options",
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "StackExchange.Redis");

    [Fact]
    public void Infrastructure_must_not_depend_on_api() => AssertNoDependencies(
        "ARCH-003",
        "INFRASTRUCTURE BOUNDARY",
        "Infrastructure may implement inward contracts but may not depend on API delivery code.",
        ArchitectureDefinitions.InfrastructureAssembly,
        ArchitectureDefinitions.ApiNamespace);

    [Fact]
    public void Contracts_must_remain_a_leaf_boundary() => AssertNoDependencies(
        "ARCH-001",
        "CONTRACTS INDEPENDENCE",
        "Contracts are a leaf boundary and may not depend on production layers.",
        ArchitectureDefinitions.ContractsAssembly,
        ArchitectureDefinitions.ApiNamespace,
        ArchitectureDefinitions.ApplicationNamespace,
        ArchitectureDefinitions.DomainNamespace,
        ArchitectureDefinitions.InfrastructureNamespace);

    [Fact]
    public void Production_types_must_use_their_owning_layer_namespace()
    {
        var violations = ArchitectureDefinitions.ProductionLayers
            .SelectMany(layer => ArchitectureRules.NamespaceViolations(
                    layer.Assembly,
                    layer.Namespace,
                    layer.Assembly == ArchitectureDefinitions.ApiAssembly ? [typeof(Program)] : [])
                .Select(type => $"{type} is outside {layer.Namespace}."))
            .ToArray();

        Assert.True(violations.Length == 0, string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void Api_contains_no_controllers()
    {
        var controllerTypes = ArchitectureDefinitions.ApiAssembly.GetTypes()
            .Where(type => type.Name.EndsWith("Controller", StringComparison.Ordinal));

        Assert.Empty(controllerTypes);
    }

    private static void AssertNoDependencies(
        string rule,
        string name,
        string expectedBoundary,
        System.Reflection.Assembly assembly,
        params string[] forbidden)
    {
        var violations = forbidden
            .SelectMany(boundary => Types.InAssembly(assembly).Should().NotHaveDependencyOnAll(boundary).GetResult().FailingTypes
                .Select(type => $"{type.FullName} depends on forbidden boundary {boundary}."))
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();

        Assert.True(
            violations.Length == 0,
            $"{rule} {name} VIOLATION" + Environment.NewLine +
            string.Join(Environment.NewLine, violations) + Environment.NewLine +
            $"Expected boundary: {expectedBoundary}");
    }
}
