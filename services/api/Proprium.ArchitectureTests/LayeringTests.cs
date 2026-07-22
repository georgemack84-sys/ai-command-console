using NetArchTest.Rules;
using Proprium.Api;
using Proprium.Application;
using Proprium.Contracts.V1;
using Proprium.Domain;
using Proprium.Infrastructure;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class LayeringTests
{
    [Fact]
    public void Domain_does_not_depend_on_outer_layers()
    {
        var result = Types.InAssembly(typeof(DomainAssemblyMarker).Assembly).Should().NotHaveDependencyOnAll("Proprium.Application", "Proprium.Infrastructure", "Proprium.Api", "Proprium.Contracts.V1").GetResult();
        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Application_does_not_depend_on_api_or_infrastructure()
    {
        var result = Types.InAssembly(typeof(ApplicationAssemblyMarker).Assembly).Should().NotHaveDependencyOnAll("Proprium.Api", "Proprium.Infrastructure").GetResult();
        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Contracts_are_a_leaf_boundary()
    {
        var result = Types.InAssembly(typeof(PlatformInfoResponse).Assembly).Should().NotHaveDependencyOnAll("Proprium.Api", "Proprium.Application", "Proprium.Domain", "Proprium.Infrastructure").GetResult();
        Assert.True(result.IsSuccessful);
    }

    [Fact]
    public void Api_contains_no_controllers()
    {
        var controllerTypes = typeof(Program).Assembly.GetTypes().Where(type => type.Name.EndsWith("Controller", StringComparison.Ordinal));
        Assert.Empty(controllerTypes);
    }
}
