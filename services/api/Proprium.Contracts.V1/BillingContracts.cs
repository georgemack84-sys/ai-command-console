namespace Proprium.Contracts.V1;

public sealed record UpdateBillRequest(decimal Amount, DateOnly DueDate, string? Notes);
public sealed record CreateBillRequest(string Name, decimal Amount, DateOnly DueDate, string? Notes);
public sealed record SetBillPaymentStatusRequest(string PaymentStatus);

public sealed record BillResponse(
    Guid Id,
    Guid HouseholdId,
    string Name,
    decimal Amount,
    DateOnly DueDate,
    string? Notes,
    string PaymentStatus,
    DateTimeOffset UpdatedAtUtc);
