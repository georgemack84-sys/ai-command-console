using NetArchTest.Rules;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class EndpointArchitectureTests
{
    [Fact]
    public void ARCH_008_endpoint_modules_reside_in_the_api_endpoints_namespace()
    {
        var endpointTypes = EndpointTypes();
        var violations = ArchitectureRules.NamespaceViolations(endpointTypes, "Proprium.Api.Endpoints");

        Assert.True(violations.Length == 0, "ARCH-008 ENDPOINT ORGANIZATION VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void ARCH_008_endpoint_modules_do_not_expose_infrastructure_types_in_public_contracts()
    {
        var violations = ArchitectureRules.EndpointPublicSignatureViolations(EndpointTypes());

        Assert.True(violations.Length == 0, "ARCH-008 ENDPOINT ORGANIZATION VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void ARCH_004_endpoint_modules_do_not_depend_on_infrastructure()
    {
        var result = Types.InAssembly(ArchitectureDefinitions.ApiAssembly)
            .That().ResideInNamespace("Proprium.Api.Endpoints")
            .Should().NotHaveDependencyOnAll(ArchitectureDefinitions.InfrastructureNamespace)
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            "ARCH-004 API COMPOSITION BOUNDARY VIOLATION" + Environment.NewLine +
            "Endpoint modules must depend on Application contracts, not Infrastructure types.");
    }

    private static Type[] EndpointTypes() => ArchitectureDefinitions.ApiAssembly.GetTypes()
        .Where(type => type.Namespace == "Proprium.Api.Endpoints" &&
            type.Name.EndsWith("Endpoints", StringComparison.Ordinal))
        .ToArray();
}
