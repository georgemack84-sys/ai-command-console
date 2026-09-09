using System.Collections.Concurrent;
using System.Threading.Channels;
using Proprium.Application.Events;

namespace Proprium.Infrastructure.Realtime;

public sealed class InMemoryRealtimeSubscriptionRegistry : IRealtimeSubscriptionRegistry
{
    private readonly ConcurrentDictionary<Guid, (Guid HouseholdId, Channel<IntegrationEventEnvelope> Channel)> _connections = new();

    public RealtimeSubscription Subscribe(Guid householdId)
    {
        var connectionId = Guid.NewGuid();
        var channel = Channel.CreateBounded<IntegrationEventEnvelope>(new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.DropOldest });
        if (!_connections.TryAdd(connectionId, (householdId, channel))) throw new InvalidOperationException("Unable to register realtime subscription.");
        return new(connectionId, householdId, channel.Reader);
    }

    public void Unsubscribe(Guid connectionId)
    {
        if (_connections.TryRemove(connectionId, out var subscription)) subscription.Channel.Writer.TryComplete();
    }

    public IReadOnlyCollection<RealtimeSubscription> GetSubscribers(Guid householdId) => _connections
        .Where(entry => entry.Value.HouseholdId == householdId)
        .Select(entry => new RealtimeSubscription(entry.Key, entry.Value.HouseholdId, entry.Value.Channel.Reader))
        .ToArray();

    public Task PublishAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (message.Scope.HouseholdId is not { } householdId) return Task.CompletedTask;
        foreach (var subscriber in _connections.Where(entry => entry.Value.HouseholdId == householdId))
            subscriber.Value.Channel.Writer.TryWrite(message);
        return Task.CompletedTask;
    }
}
