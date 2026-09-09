using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Proprium.Application.Events;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Events;

public sealed class OutboxProcessor(
    IDbContextFactory<PropriumDbContext> databaseFactory,
    IEventPublisher publisher,
    TimeProvider timeProvider,
    EventRuntimeStatus runtimeStatus,
    ILogger<OutboxProcessor> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(2);
    private const int BatchSize = 50;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ProcessPendingAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception exception)
            {
                runtimeStatus.RecordOutboxFailure();
                logger.LogError(exception, "Outbox processor batch failed.");
            }
        }
    }

    public async Task ProcessPendingAsync(CancellationToken cancellationToken = default)
    {
        await using var database = await databaseFactory.CreateDbContextAsync(cancellationToken);
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var messages = await database.OutboxMessages.FromSqlInterpolated($"""
            SELECT * FROM outbox_messages
            WHERE "ProcessedAtUtc" IS NULL
            ORDER BY "CreatedAtUtc"
            LIMIT {BatchSize}
            FOR UPDATE SKIP LOCKED
            """).ToListAsync(cancellationToken);
        foreach (var message in messages)
        {
            try
            {
                var envelope = JsonSerializer.Deserialize<IntegrationEventEnvelope>(message.PayloadJson)
                    ?? throw new InvalidOperationException("Outbox payload did not contain an integration event.");
                await publisher.PublishAsync(envelope, cancellationToken);
                message.ProcessedAtUtc = timeProvider.GetUtcNow();
                message.LastError = null;
                logger.LogInformation("Published outbox event {EventId} {EventType}", message.Id, message.EventType);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception exception)
            {
                message.Attempts++;
                message.LastError = exception.Message.Length <= 2_000 ? exception.Message : exception.Message[..2_000];
                logger.LogWarning(exception, "Outbox event {EventId} {EventType} failed on attempt {Attempt}", message.Id, message.EventType, message.Attempts);
            }
        }
        if (messages.Count > 0) await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        runtimeStatus.RecordOutboxSuccess();
    }
}
