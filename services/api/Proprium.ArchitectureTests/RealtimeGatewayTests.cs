using System.Text.Json;
using Proprium.Application.Events;
using Proprium.Infrastructure.Realtime;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class RealtimeGatewayTests
{
    [Fact]
    public async Task Gateway_delivers_only_to_the_event_household()
    {
        var registry = new InMemoryRealtimeSubscriptionRegistry();
        var gateway = new RealtimeGateway(registry);
        var recipient = registry.Subscribe(Guid.NewGuid());
        var nonRecipient = registry.Subscribe(Guid.NewGuid());
        var message = new IntegrationEventEnvelope(
            Guid.NewGuid(),
            "proprium.bill.updated.v1",
            1,
            DateTimeOffset.UtcNow,
            Guid.NewGuid().ToString("D"),
            null,
            Guid.NewGuid(),
            new IntegrationEventScope(recipient.HouseholdId, null, Guid.NewGuid()),
            JsonSerializer.SerializeToElement(new { billId = Guid.NewGuid() }));

        await gateway.HandleAsync(message);

        Assert.True(await recipient.Reader.WaitToReadAsync().AsTask());
        Assert.Equal(message, Assert.IsType<IntegrationEventEnvelope>(await recipient.Reader.ReadAsync().AsTask()));
        Assert.False(nonRecipient.Reader.TryRead(out _));
        registry.Unsubscribe(recipient.ConnectionId);
        registry.Unsubscribe(nonRecipient.ConnectionId);
    }
}
