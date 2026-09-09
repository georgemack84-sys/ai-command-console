using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Application.Events;
using Proprium.Domain.Billing;
using Proprium.Infrastructure.Events;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Billing;

public sealed class PostgresBillCommandService(
    PropriumDbContext database,
    TimeProvider timeProvider,
    IBillUpdatedEventMapper eventMapper,
    IBillCreatedEventMapper createdEventMapper,
    IBillPaymentStatusChangedEventMapper paymentEventMapper) : IBillCommandService
{
    public async Task<UpdateBillResult> UpdateAsync(UpdateBillCommand command, CancellationToken cancellationToken = default)
    {
        var isMember = await database.HouseholdMemberships
            .AnyAsync(membership => membership.HouseholdId == command.HouseholdId && membership.UserId == command.ActorId, cancellationToken);
        if (!isMember) return new(UpdateBillOutcome.Forbidden);

        var bill = await database.Bills.SingleOrDefaultAsync(candidate =>
            candidate.Id == command.BillId && candidate.HouseholdId == command.HouseholdId, cancellationToken);
        if (bill is null) return new(UpdateBillOutcome.NotFound);

        bill.Update(command.Amount, command.DueDate, command.Notes, command.ActorId, timeProvider.GetUtcNow());
        var dispatchContext = new EventDispatchContext(command.CorrelationId, command.CommandId, command.ActorId);
        foreach (var domainEvent in bill.DequeueDomainEvents().OfType<BillUpdatedDomainEvent>())
        {
            var integrationEvent = eventMapper.Map(domainEvent, dispatchContext);
            database.OutboxMessages.Add(OutboxMessage.From(integrationEvent, timeProvider.GetUtcNow()));
        }
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new(UpdateBillOutcome.Updated, new BillDetails(
            bill.Id, bill.HouseholdId, bill.Name, bill.Amount, bill.DueDate, bill.Notes, bill.PaymentStatus, bill.UpdatedAtUtc));
    }

    public async Task<UpdateBillResult> CreateAsync(CreateBillCommand command, CancellationToken cancellationToken = default)
    {
        if (!await IsMemberAsync(command.HouseholdId, command.ActorId, cancellationToken)) return new(UpdateBillOutcome.Forbidden);
        var bill = Bill.Create(command.HouseholdId, command.Name, command.Amount, command.DueDate, command.Notes, command.ActorId, timeProvider.GetUtcNow());
        database.Bills.Add(bill);
        await PersistEventsAsync(bill, new(command.CorrelationId, command.CommandId, command.ActorId), cancellationToken);
        return new(UpdateBillOutcome.Updated, new(bill.Id, bill.HouseholdId, bill.Name, bill.Amount, bill.DueDate, bill.Notes, bill.PaymentStatus, bill.UpdatedAtUtc));
    }

    public async Task<UpdateBillResult> SetPaymentStatusAsync(SetBillPaymentStatusCommand command, CancellationToken cancellationToken = default)
    {
        if (!await IsMemberAsync(command.HouseholdId, command.ActorId, cancellationToken)) return new(UpdateBillOutcome.Forbidden);
        var bill = await database.Bills.SingleOrDefaultAsync(item => item.Id == command.BillId && item.HouseholdId == command.HouseholdId, cancellationToken);
        if (bill is null) return new(UpdateBillOutcome.NotFound);
        bill.SetPaymentStatus(command.PaymentStatus, command.ActorId, timeProvider.GetUtcNow());
        await PersistEventsAsync(bill, new(command.CorrelationId, command.CommandId, command.ActorId), cancellationToken);
        return new(UpdateBillOutcome.Updated, new(bill.Id, bill.HouseholdId, bill.Name, bill.Amount, bill.DueDate, bill.Notes, bill.PaymentStatus, bill.UpdatedAtUtc));
    }

    private Task<bool> IsMemberAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken) => database.HouseholdMemberships.AnyAsync(membership => membership.HouseholdId == householdId && membership.UserId == actorId, cancellationToken);

    private async Task PersistEventsAsync(Bill bill, EventDispatchContext context, CancellationToken cancellationToken)
    {
        foreach (var domainEvent in bill.DequeueDomainEvents())
        {
            var integrationEvent = domainEvent switch
            {
                BillUpdatedDomainEvent updated => eventMapper.Map(updated, context),
                BillCreatedDomainEvent created => createdEventMapper.Map(created, context),
                BillPaymentStatusChangedDomainEvent payment => paymentEventMapper.Map(payment, context),
                _ => throw new InvalidOperationException($"Unsupported bill event {domainEvent.GetType().Name}.")
            };
            database.OutboxMessages.Add(OutboxMessage.From(integrationEvent, timeProvider.GetUtcNow()));
        }
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
