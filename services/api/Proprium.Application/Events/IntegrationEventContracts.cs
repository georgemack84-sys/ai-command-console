using System.Text.Json;
using Proprium.Domain.Events;

namespace Proprium.Application.Events;

public sealed record IntegrationEventScope(Guid? HouseholdId, Guid? UserId, Guid? EntityId);

public sealed record IntegrationEventEnvelope(
    Guid EventId,
    string EventType,
    int EventVersion,
    DateTimeOffset OccurredAtUtc,
    string CorrelationId,
    Guid? CausationId,
    Guid? ActorId,
    IntegrationEventScope Scope,
    JsonElement Data)
{
    public void Validate()
    {
        if (EventId == Guid.Empty) throw new InvalidOperationException("An integration event identifier is required.");
        if (!EventTypeName.IsValid(EventType)) throw new InvalidOperationException("An integration event type must be namespaced and versioned.");
        if (EventVersion < 1) throw new InvalidOperationException("An integration event version must be positive.");
        if (string.IsNullOrWhiteSpace(CorrelationId)) throw new InvalidOperationException("An integration event correlation identifier is required.");
        if (Scope is null) throw new InvalidOperationException("An integration event scope is required.");
    }
}

public sealed record EventDispatchContext(string CorrelationId, Guid? CausationId, Guid? ActorId)
{
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(CorrelationId)) throw new InvalidOperationException("An event dispatch correlation identifier is required.");
    }
}

public interface IIntegrationEventMapper<in TDomainEvent> where TDomainEvent : IDomainEvent
{
    IntegrationEventEnvelope Map(TDomainEvent domainEvent, EventDispatchContext context);
}

public interface IEventPublisher
{
    Task PublishAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventHandler
{
    Task HandleAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default);
}

public interface IRealtimeSubscriptionRegistry
{
    RealtimeSubscription Subscribe(Guid householdId);
    void Unsubscribe(Guid connectionId);
    IReadOnlyCollection<RealtimeSubscription> GetSubscribers(Guid householdId);
    Task PublishAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default);
}

public sealed record RealtimeSubscription(
    Guid ConnectionId,
    Guid HouseholdId,
    System.Threading.Channels.ChannelReader<IntegrationEventEnvelope> Reader);

public interface IRealtimeSubscriptionAuthorizer
{
    Task<bool> CanSubscribeAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default);
}

public static class EventTypeName
{
    public static bool IsValid(string? value) => value is not null &&
        System.Text.RegularExpressions.Regex.IsMatch(value, "^proprium\\.(?:[a-z0-9-]+\\.){2,3}v[1-9][0-9]*$");
}
