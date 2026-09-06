using Proprium.Infrastructure.Persistence;

namespace Proprium.ArchitectureTests.Fixtures.Api;

public sealed class EndpointPersistenceDependencyViolation
{
    public void UsePersistence(PropriumDbContext database) => ArgumentNullException.ThrowIfNull(database);
}
