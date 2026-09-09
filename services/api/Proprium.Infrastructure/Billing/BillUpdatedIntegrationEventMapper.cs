using System.Text.Json;
using Proprium.Application.Billing;
using Proprium.Application.Events;
using Proprium.Domain.Billing;

namespace Proprium.Infrastructure.Billing;

public sealed class BillUpdatedIntegrationEventMapper : IBillUpdatedEventMapper
{
    public IntegrationEventEnvelope Map(BillUpdatedDomainEvent domainEvent, EventDispatchContext context)
    {
        context.Validate();
        return new(
            domainEvent.EventId,
            BillingEventTypes.BillUpdatedV1,
            1,
            domainEvent.OccurredAtUtc,
            context.CorrelationId,
            context.CausationId,
            domainEvent.ActorId,
            new IntegrationEventScope(domainEvent.HouseholdId, null, domainEvent.BillId),
            JsonSerializer.SerializeToElement(new
            {
                billId = domainEvent.BillId,
                amount = domainEvent.Amount,
                dueDate = domainEvent.DueDate,
            }));
    }
}

public sealed class BillCreatedIntegrationEventMapper : IBillCreatedEventMapper
{
    public IntegrationEventEnvelope Map(BillCreatedDomainEvent domainEvent, EventDispatchContext context) => BillIntegrationEnvelope.Create(domainEvent.EventId, BillingEventTypes.BillCreatedV1, domainEvent.HouseholdId, domainEvent.BillId, domainEvent.ActorId, domainEvent.OccurredAtUtc, context, new { billId = domainEvent.BillId, name = domainEvent.Name, amount = domainEvent.Amount, dueDate = domainEvent.DueDate });
}

public sealed class BillPaymentStatusChangedIntegrationEventMapper : IBillPaymentStatusChangedEventMapper
{
    public IntegrationEventEnvelope Map(BillPaymentStatusChangedDomainEvent domainEvent, EventDispatchContext context) => BillIntegrationEnvelope.Create(domainEvent.EventId, domainEvent.PaymentStatus == BillPaymentStatus.Paid ? BillingEventTypes.BillPaidV1 : BillingEventTypes.BillUnpaidV1, domainEvent.HouseholdId, domainEvent.BillId, domainEvent.ActorId, domainEvent.OccurredAtUtc, context, new { billId = domainEvent.BillId, paymentStatus = domainEvent.PaymentStatus.ToString() });
}

file static class BillIntegrationEnvelope
{
    public static IntegrationEventEnvelope Create(Guid eventId, string eventType, Guid householdId, Guid billId, Guid actorId, DateTimeOffset occurredAtUtc, EventDispatchContext context, object data)
    {
        context.Validate();
        return new(eventId, eventType, 1, occurredAtUtc, context.CorrelationId, context.CausationId, actorId, new IntegrationEventScope(householdId, null, billId), JsonSerializer.SerializeToElement(data));
    }
}
