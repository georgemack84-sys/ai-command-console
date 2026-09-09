namespace Proprium.Infrastructure.Events;

public sealed class EventRuntimeStatus(TimeProvider timeProvider)
{
    private readonly object gate = new();
    private DateTimeOffset lastSuccessfulOutboxBatchAtUtc = timeProvider.GetUtcNow();
    private DateTimeOffset? lastOutboxFailureAtUtc;

    public EventRuntimeSnapshot Snapshot()
    {
        lock (gate) return new(lastSuccessfulOutboxBatchAtUtc, lastOutboxFailureAtUtc);
    }

    public void RecordOutboxSuccess()
    {
        lock (gate) lastSuccessfulOutboxBatchAtUtc = timeProvider.GetUtcNow();
    }

    public void RecordOutboxFailure()
    {
        lock (gate) lastOutboxFailureAtUtc = timeProvider.GetUtcNow();
    }
}

public sealed record EventRuntimeSnapshot(DateTimeOffset LastSuccessfulOutboxBatchAtUtc, DateTimeOffset? LastOutboxFailureAtUtc);
