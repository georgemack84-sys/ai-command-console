using System.Reflection;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Retry;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class DependencyResolutionArchitectureTests
{
    [Fact]
    public void ARCH_006_public_production_contracts_expose_no_container_types()
    {
        var productionAssemblies = ArchitectureDefinitions.ProductionLayers.Select(layer => layer.Assembly).ToArray();
        var offenders = ArchitectureRules.ContainerSignatureViolations(
            productionAssemblies
                .SelectMany(assembly => assembly.ExportedTypes)
                .Except(ArchitectureExceptionRegistry.ApprovedTypes("ARCH-006", productionAssemblies)));

        Assert.True(
            offenders.Length == 0,
            "ARCH-006 PUBLIC CONTAINER BOUNDARY VIOLATION" + Environment.NewLine +
            "Only RetryExecutor may expose its scoped-retry dependency." + Environment.NewLine +
            string.Join(Environment.NewLine, offenders));
    }

    [Fact]
    public void Domain_and_application_expose_no_generic_service_resolvers()
    {
        var offenders = new[]
        {
            ArchitectureDefinitions.DomainAssembly,
            ArchitectureDefinitions.ApplicationAssembly,
        }.SelectMany(ArchitectureRules.GenericResolverViolations).ToArray();

        Assert.True(offenders.Length == 0, string.Join(Environment.NewLine, offenders));
    }

    [Fact]
    public void Retry_executor_is_the_only_runtime_type_that_owns_a_scope_factory()
    {
        var owners = typeof(ServiceCollectionExtensions).Assembly.GetTypes()
            .Where(type => type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .SelectMany(constructor => constructor.GetParameters())
                .Any(parameter => parameter.ParameterType == typeof(Microsoft.Extensions.DependencyInjection.IServiceScopeFactory)))
            .ToArray();

        Assert.Equal([typeof(RetryExecutor)], owners);
        Assert.Equal(
            [typeof(RetryExecutor)],
            ArchitectureExceptionRegistry.ApprovedTypes(
                "ARCH-006",
                ArchitectureDefinitions.ProductionLayers.Select(layer => layer.Assembly)));
    }

    [Fact]
    public void ARCH_005_only_explicit_composition_boundaries_may_call_the_service_locator()
    {
        var productionAssemblies = ArchitectureDefinitions.ProductionLayers.Select(layer => layer.Assembly).ToArray();
        var approvedOwners = new HashSet<Type>
        {
            typeof(global::Program),
            ArchitectureDefinitions.ApiAssembly.GetType("Proprium.Api.Configuration.OpenApiToolingConfiguration", throwOnError: true)
                ?? throw new InvalidOperationException("OpenAPI tooling configuration type was not found."),
            typeof(ServiceCollectionExtensions),
        };
        approvedOwners.UnionWith(ArchitectureExceptionRegistry.ApprovedTypes("ARCH-005", productionAssemblies));
        var violations = ArchitectureRules.ServiceLocatorCallViolations(
            productionAssemblies,
            approvedOwners);

        Assert.True(violations.Length == 0, "ARCH-005 SERVICE LOCATOR VIOLATION" + Environment.NewLine + string.Join(Environment.NewLine, violations));
    }
}
