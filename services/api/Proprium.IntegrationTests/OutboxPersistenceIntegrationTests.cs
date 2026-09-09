using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Proprium.Application.Billing;
using Proprium.Application.Events;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Billing;
using Proprium.Infrastructure.Events;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class OutboxPersistenceIntegrationTests : IIntegrationTest
{
    [Fact]
    public async Task Bill_update_commits_the_state_change_and_outbox_event_together()
    {
        var actor = new User { Username = $"outbox-{Guid.NewGuid():N}", NormalizedUsername = $"OUTBOX-{Guid.NewGuid():N}", PasswordHash = "test" };
        var household = new Household { OwnerUserId = actor.Id, Name = "Outbox household" };
        var bill = new Bill { HouseholdId = household.Id, Name = "Internet" };
        await using var database = CreateContext();
        database.AddRange(actor, household, new HouseholdMembership { HouseholdId = household.Id, UserId = actor.Id }, bill);
        await database.SaveChangesAsync();

        var commandId = Guid.NewGuid();
        var result = await new PostgresBillCommandService(database, TimeProvider.System, new BillUpdatedIntegrationEventMapper(), new BillCreatedIntegrationEventMapper(), new BillPaymentStatusChangedIntegrationEventMapper())
            .UpdateAsync(new UpdateBillCommand(commandId, household.Id, bill.Id, 229.00m, new DateOnly(2026, 10, 9), "Updated plan", actor.Id, Guid.NewGuid().ToString("D")));

        Assert.Equal(UpdateBillOutcome.Updated, result.Outcome);
        var persistedBill = await database.Bills.SingleAsync(item => item.Id == bill.Id);
        var outbox = await database.OutboxMessages.SingleAsync(item => item.HouseholdId == household.Id);
        Assert.Equal(229.00m, persistedBill.Amount);
        Assert.Equal("proprium.bill.updated.v1", outbox.EventType);
        Assert.Equal(commandId, outbox.CausationId);
    }

    [Fact]
    public async Task Processor_retries_a_failed_delivery_and_marks_the_recovery_processed()
    {
        var envelope = new IntegrationEventEnvelope(Guid.NewGuid(), "proprium.bill.updated.v1", 1, DateTimeOffset.UtcNow,
            Guid.NewGuid().ToString("D"), Guid.NewGuid(), Guid.NewGuid(), new IntegrationEventScope(Guid.NewGuid(), null, Guid.NewGuid()), System.Text.Json.JsonSerializer.SerializeToElement(new { }));
        await using (var setup = CreateContext())
        {
            setup.OutboxMessages.Add(OutboxMessage.From(envelope, DateTimeOffset.UnixEpoch));
            await setup.SaveChangesAsync();
        }

        var publisher = new FailOncePublisher();
        var processor = new OutboxProcessor(new ContextFactory(), publisher, TimeProvider.System, new EventRuntimeStatus(TimeProvider.System), NullLogger<OutboxProcessor>.Instance);
        await processor.ProcessPendingAsync();
        await using (var failed = CreateContext())
        {
            var pending = await failed.OutboxMessages.SingleAsync(item => item.Id == envelope.EventId);
            Assert.Equal(1, pending.Attempts);
            Assert.Null(pending.ProcessedAtUtc);
        }

        await processor.ProcessPendingAsync();
        await using var completed = CreateContext();
        var published = await completed.OutboxMessages.SingleAsync(item => item.Id == envelope.EventId);
        Assert.Equal(2, publisher.Attempts);
        Assert.NotNull(published.ProcessedAtUtc);
        Assert.Null(published.LastError);
    }

    private static PropriumDbContext CreateContext() => new(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(ConnectionString()).Options);

    private static string ConnectionString() => $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";

    private sealed class ContextFactory : IDbContextFactory<PropriumDbContext>
    {
        public PropriumDbContext CreateDbContext() => CreateContext();
        public Task<PropriumDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default) => Task.FromResult(CreateContext());
    }

    private sealed class FailOncePublisher : IEventPublisher
    {
        public int Attempts { get; private set; }
        public Task PublishAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default)
        {
            Attempts++;
            if (Attempts == 1) throw new InvalidOperationException("Simulated delivery failure.");
            return Task.CompletedTask;
        }
    }
}
