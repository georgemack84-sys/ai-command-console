using NetArchTest.Rules;
using Proprium.ArchitectureTests.Fixtures.Domain;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class ArchitectureRuleContractTests
{
    [Fact]
    public void NetArchTest_detects_a_controlled_forbidden_dependency()
    {
        var result = Types.InAssembly(typeof(DomainDependencyViolation).Assembly)
            .That().ResideInNamespace("Proprium.ArchitectureTests.Fixtures.Domain")
            .Should().NotHaveDependencyOnAll("Proprium.ArchitectureTests.Fixtures.Infrastructure")
            .GetResult();

        Assert.False(result.IsSuccessful);
    }

    [Fact]
    public void Namespace_rule_detects_a_controlled_misplaced_type()
    {
        var violations = ArchitectureRules.NamespaceViolations(
            [typeof(DomainDependencyViolation)],
            "Proprium.Domain");

        Assert.Contains(typeof(DomainDependencyViolation).FullName, violations);
    }

    [Fact]
    public void Container_signature_rule_rejects_service_provider_but_allows_typed_dependencies()
    {
        Assert.NotEmpty(ArchitectureRules.ContainerSignatureViolations([typeof(ServiceLocatorFixture)]));
        Assert.Empty(ArchitectureRules.ContainerSignatureViolations([typeof(ExplicitDependencyFixture)]));
    }

    [Fact]
    public void Generic_resolver_rule_rejects_runtime_resolution_but_allows_normal_generic_contracts()
    {
        Assert.NotEmpty(ArchitectureRules.GenericResolverViolations([typeof(IServiceResolverFixture)]));
        Assert.Empty(ArchitectureRules.GenericResolverViolations([typeof(IRepositoryFixture)]));
    }

    public sealed class ServiceLocatorFixture(IServiceProvider services)
    {
        public IServiceProvider Services { get; } = services;
    }

    public sealed class ExplicitDependencyFixture(TimeProvider timeProvider)
    {
        public TimeProvider TimeProvider { get; } = timeProvider;
    }

    public interface IServiceResolverFixture
    {
        T Resolve<T>();
    }

    public interface IRepositoryFixture
    {
        T Find<T>(Guid id);
    }
}
