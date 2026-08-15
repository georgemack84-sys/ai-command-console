using Proprium.ArchitectureTests.Fixtures.Infrastructure;

namespace Proprium.ArchitectureTests.Fixtures.Domain;

public sealed class DomainDependencyViolation
{
    public InfrastructureDependency Dependency { get; } = new();
}
