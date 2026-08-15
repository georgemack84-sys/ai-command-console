using NetArchTest.Rules;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class LayeringTests
{
    [Fact]
    public void Domain_must_not_depend_on_outer_layers_or_frameworks() => AssertNoDependencies(
        ArchitectureDefinitions.DomainAssembly,
        ArchitectureDefinitions.ApplicationNamespace,
        ArchitectureDefinitions.InfrastructureNamespace,
        ArchitectureDefinitions.ApiNamespace,
        ArchitectureDefinitions.ContractsNamespace,
        "Microsoft.AspNetCore",
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "StackExchange.Redis");

    [Fact]
    public void Application_must_not_depend_on_api_infrastructure_or_implementation_frameworks() => AssertNoDependencies(
        ArchitectureDefinitions.ApplicationAssembly,
        ArchitectureDefinitions.ApiNamespace,
        ArchitectureDefinitions.InfrastructureNamespace,
        "Microsoft.AspNetCore",
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "StackExchange.Redis");

    [Fact]
    public void Infrastructure_must_not_depend_on_api() => AssertNoDependencies(
        ArchitectureDefinitions.InfrastructureAssembly,
        ArchitectureDefinitions.ApiNamespace);

    [Fact]
    public void Contracts_must_remain_a_leaf_boundary() => AssertNoDependencies(
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

    private static void AssertNoDependencies(System.Reflection.Assembly assembly, params string[] forbidden)
    {
        var result = Types.InAssembly(assembly).Should().NotHaveDependencyOnAll(forbidden).GetResult();
        Assert.True(
            result.IsSuccessful,
            $"{assembly.GetName().Name} has forbidden dependencies on: {string.Join(", ", forbidden)}.");
    }
}
