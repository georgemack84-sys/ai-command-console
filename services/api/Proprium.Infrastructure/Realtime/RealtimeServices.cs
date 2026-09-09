using Microsoft.EntityFrameworkCore;
using Proprium.Application.Events;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Realtime;

public sealed class PostgresRealtimeSubscriptionAuthorizer(PropriumDbContext database) : IRealtimeSubscriptionAuthorizer
{
    public Task<bool> CanSubscribeAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default) =>
        database.HouseholdMemberships.AnyAsync(member => member.HouseholdId == householdId && member.UserId == actorId, cancellationToken);
}

public sealed class RealtimeGateway(IRealtimeSubscriptionRegistry registry) : IIntegrationEventHandler
{
    public async Task HandleAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await registry.PublishAsync(message, cancellationToken);
    }
}
