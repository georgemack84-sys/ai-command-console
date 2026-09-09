using Proprium.ArchitectureTests.Fixtures.Api;
using Proprium.ArchitectureTests.Fixtures.Domain;

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
    public void Container_signature_rule_rejects_each_public_container_surface_but_allows_typed_dependencies()
    {
        Assert.NotEmpty(ArchitectureRules.ContainerSignatureViolations([typeof(ServiceLocatorFixture)]));
        Assert.NotEmpty(ArchitectureRules.ContainerSignatureViolations([typeof(MethodContainerFixture)]));
        Assert.NotEmpty(ArchitectureRules.ContainerSignatureViolations([typeof(FieldContainerFixture)]));
        Assert.Empty(ArchitectureRules.ContainerSignatureViolations([typeof(ExplicitDependencyFixture)]));
    }

    [Fact]
    public void Generic_resolver_rule_rejects_runtime_resolution_but_allows_normal_generic_contracts()
    {
        Assert.NotEmpty(ArchitectureRules.GenericResolverViolations([typeof(IServiceResolverFixture)]));
        Assert.Empty(ArchitectureRules.GenericResolverViolations([typeof(IRepositoryFixture)]));
    }

    [Fact]
    public void Migration_ownership_rule_rejects_a_migration_outside_infrastructure_persistence()
    {
        var violations = ArchitectureRules.MigrationOwnershipViolations(
            [(typeof(RogueMigrationFixture).Assembly, "controlled fixture")]);

        Assert.NotEmpty(violations);
    }

    [Fact]
    public void Endpoint_persistence_rule_rejects_an_endpoint_that_depends_on_a_dbcontext()
    {
        var result = Types.InAssembly(typeof(EndpointPersistenceDependencyViolation).Assembly)
            .That().ResideInNamespace("Proprium.ArchitectureTests.Fixtures.Api")
            .Should().NotHaveDependencyOnAll(ArchitectureDefinitions.InfrastructureNamespace)
            .GetResult();

        Assert.False(result.IsSuccessful);
        Assert.Contains(result.FailingTypes, type => type.FullName == typeof(EndpointPersistenceDependencyViolation).FullName);
    }

    [Fact]
    public void Service_locator_call_rule_rejects_runtime_resolution()
    {
        var violations = ArchitectureRules.ServiceLocatorCallViolations(
            [typeof(ServiceLocatorFixture).Assembly],
            new HashSet<Type>());

        Assert.Contains(violations, violation => violation.Contains(nameof(IServiceProvider.GetService), StringComparison.Ordinal));
    }

    public sealed class ServiceLocatorFixture
    {
        private readonly IServiceProvider services;

        public ServiceLocatorFixture(IServiceProvider services) => this.services = services;

        public IServiceProvider Services => services;

        public object? Resolve() => services.GetService(typeof(TimeProvider));
    }

    public sealed class ExplicitDependencyFixture(TimeProvider timeProvider)
    {
        public TimeProvider TimeProvider { get; } = timeProvider;
    }

    public sealed class MethodContainerFixture
    {
        public IServiceProvider Resolve(IServiceProvider services) => services;
    }

    public sealed class FieldContainerFixture
    {
        public IServiceProvider Services = null!;
    }

    public interface IServiceResolverFixture
    {
        T Resolve<T>();
    }

    public interface IRepositoryFixture
    {
        T Find<T>(Guid id);
    }

    public sealed class RogueMigrationFixture : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder) { }

        protected override void Down(MigrationBuilder migrationBuilder) { }
    }
}
