using System.Text.Json;
using Proprium.Application.Events;

namespace Proprium.Infrastructure.Events;

public sealed class OutboxMessage
{
    public Guid Id { get; init; }
    public string EventType { get; init; } = string.Empty;
    public int EventVersion { get; init; }
    public string PayloadJson { get; init; } = string.Empty;
    public string CorrelationId { get; init; } = string.Empty;
    public Guid? CausationId { get; init; }
    public Guid? ActorId { get; init; }
    public Guid? HouseholdId { get; init; }
    public DateTimeOffset OccurredAtUtc { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public DateTimeOffset? ProcessedAtUtc { get; set; }
    public int Attempts { get; set; }
    public string? LastError { get; set; }

    public static OutboxMessage From(IntegrationEventEnvelope envelope, DateTimeOffset createdAtUtc)
    {
        envelope.Validate();
        return new()
        {
            Id = envelope.EventId,
            EventType = envelope.EventType,
            EventVersion = envelope.EventVersion,
            PayloadJson = JsonSerializer.Serialize(envelope),
            CorrelationId = envelope.CorrelationId,
            CausationId = envelope.CausationId,
            ActorId = envelope.ActorId,
            HouseholdId = envelope.Scope.HouseholdId,
            OccurredAtUtc = envelope.OccurredAtUtc,
            CreatedAtUtc = createdAtUtc,
        };
    }
}
