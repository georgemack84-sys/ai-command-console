using Proprium.Application.Events;

namespace Proprium.Application.Billing;

public sealed record UpdateBillCommand(
    Guid CommandId,
    Guid HouseholdId,
    Guid BillId,
    decimal Amount,
    DateOnly DueDate,
    string? Notes,
    Guid ActorId,
    string CorrelationId);

public sealed record CreateBillCommand(Guid CommandId, Guid HouseholdId, string Name, decimal Amount, DateOnly DueDate, string? Notes, Guid ActorId, string CorrelationId);

public sealed record SetBillPaymentStatusCommand(Guid CommandId, Guid HouseholdId, Guid BillId, Proprium.Domain.Billing.BillPaymentStatus PaymentStatus, Guid ActorId, string CorrelationId);

public sealed record BillDetails(
    Guid Id,
    Guid HouseholdId,
    string Name,
    decimal Amount,
    DateOnly DueDate,
    string? Notes,
    Proprium.Domain.Billing.BillPaymentStatus PaymentStatus,
    DateTimeOffset UpdatedAtUtc);

public enum UpdateBillOutcome { Updated, NotFound, Forbidden }

public sealed record UpdateBillResult(UpdateBillOutcome Outcome, BillDetails? Bill = null);

public enum ListBillsOutcome { Listed, Forbidden }

public sealed record ListBillsResult(ListBillsOutcome Outcome, IReadOnlyCollection<BillDetails> Bills);

public interface IBillCommandService
{
    Task<UpdateBillResult> UpdateAsync(UpdateBillCommand command, CancellationToken cancellationToken = default);
    Task<UpdateBillResult> CreateAsync(CreateBillCommand command, CancellationToken cancellationToken = default);
    Task<UpdateBillResult> SetPaymentStatusAsync(SetBillPaymentStatusCommand command, CancellationToken cancellationToken = default);
}

public interface IBillQueryService
{
    Task<ListBillsResult> ListAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default);
}

public interface IBillUpdatedEventMapper : IIntegrationEventMapper<Proprium.Domain.Billing.BillUpdatedDomainEvent>;
public interface IBillCreatedEventMapper : IIntegrationEventMapper<Proprium.Domain.Billing.BillCreatedDomainEvent>;
public interface IBillPaymentStatusChangedEventMapper : IIntegrationEventMapper<Proprium.Domain.Billing.BillPaymentStatusChangedDomainEvent>;

public static class BillingEventTypes
{
    public const string BillUpdatedV1 = "proprium.bill.updated.v1";
    public const string BillCreatedV1 = "proprium.bill.created.v1";
    public const string BillPaidV1 = "proprium.bill.paid.v1";
    public const string BillUnpaidV1 = "proprium.bill.unpaid.v1";
}
