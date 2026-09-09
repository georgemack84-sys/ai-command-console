using System.Text.Json;
using Proprium.Application.Events;
using Proprium.Domain.Events;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class EventFoundationTests
{
    [Fact]
    public void Integration_event_envelope_accepts_a_versioned_namespaced_contract()
    {
        var envelope = new IntegrationEventEnvelope(
            Guid.NewGuid(),
            "proprium.bill.updated.v1",
            1,
            DateTimeOffset.UtcNow,
            Guid.NewGuid().ToString("D"),
            Guid.NewGuid(),
            Guid.NewGuid(),
            new IntegrationEventScope(Guid.NewGuid(), null, Guid.NewGuid()),
            JsonSerializer.SerializeToElement(new { billId = Guid.NewGuid(), amount = 229.00m }));

        envelope.Validate();
    }

    [Fact]
    public void Integration_event_envelope_rejects_an_unversioned_contract()
    {
        var envelope = new IntegrationEventEnvelope(
            Guid.NewGuid(),
            "bill.updated",
            1,
            DateTimeOffset.UtcNow,
            "correlation",
            null,
            null,
            new IntegrationEventScope(null, null, null),
            JsonSerializer.SerializeToElement(new { }));

        Assert.Throws<InvalidOperationException>(envelope.Validate);
    }

    [Fact]
    public void Domain_event_contract_stays_transport_neutral()
    {
        IDomainEvent domainEvent = new FixtureDomainEvent(Guid.NewGuid(), DateTimeOffset.UtcNow);

        Assert.NotEqual(Guid.Empty, domainEvent.EventId);
    }

    private sealed record FixtureDomainEvent(Guid EventId, DateTimeOffset OccurredAtUtc) : IDomainEvent;
}
