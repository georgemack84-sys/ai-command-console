using Proprium.Application.Events;
using Proprium.Domain.Billing;
using Proprium.Infrastructure.Billing;
using Proprium.Infrastructure.Events;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class OutboxContractTests
{
    [Fact]
    public void Bill_event_maps_to_a_versioned_durable_outbox_contract()
    {
        var occurredAt = DateTimeOffset.UtcNow;
        var domainEvent = new BillUpdatedDomainEvent(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            229.00m,
            new DateOnly(2026, 10, 9),
            Guid.NewGuid(),
            occurredAt);
        var commandId = Guid.NewGuid();
        var envelope = new BillUpdatedIntegrationEventMapper().Map(domainEvent,
            new EventDispatchContext(Guid.NewGuid().ToString("D"), commandId, domainEvent.ActorId));

        var outbox = OutboxMessage.From(envelope, occurredAt.AddSeconds(1));

        Assert.Equal(domainEvent.EventId, outbox.Id);
        Assert.Equal("proprium.bill.updated.v1", outbox.EventType);
        Assert.Equal(commandId, outbox.CausationId);
        Assert.Equal(domainEvent.HouseholdId, outbox.HouseholdId);
        Assert.Contains(domainEvent.BillId.ToString(), outbox.PayloadJson, StringComparison.Ordinal);
    }
}
