using Proprium.Domain.Events;

namespace Proprium.Domain.Billing;

public sealed class Household
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid OwnerUserId { get; init; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<HouseholdMembership> Members { get; } = new List<HouseholdMembership>();
    public ICollection<Bill> Bills { get; } = new List<Bill>();
}

public sealed class HouseholdMembership
{
    public Guid HouseholdId { get; init; }
    public Guid UserId { get; init; }
    public DateTimeOffset JoinedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public Household Household { get; init; } = null!;
}

public sealed class Bill
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid HouseholdId { get; init; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateOnly DueDate { get; private set; }
    public string? Notes { get; private set; }
    public BillPaymentStatus PaymentStatus { get; private set; } = BillPaymentStatus.Unpaid;
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;
    public Household Household { get; init; } = null!;
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public static Bill Create(Guid householdId, string name, decimal amount, DateOnly dueDate, string? notes, Guid actorId, DateTimeOffset occurredAtUtc)
    {
        if (householdId == Guid.Empty) throw new ArgumentException("A household is required.", nameof(householdId));
        if (string.IsNullOrWhiteSpace(name) || name.Length > 256) throw new ArgumentException("A bill name is required and cannot exceed 256 characters.", nameof(name));
        var bill = new Bill { HouseholdId = householdId, Name = name.Trim() };
        bill.Update(amount, dueDate, notes, actorId, occurredAtUtc);
        bill._domainEvents.Clear();
        bill._domainEvents.Add(new BillCreatedDomainEvent(Guid.NewGuid(), householdId, bill.Id, bill.Name, amount, dueDate, actorId, occurredAtUtc));
        return bill;
    }

    public void Update(decimal amount, DateOnly dueDate, string? notes, Guid actorId, DateTimeOffset occurredAtUtc)
    {
        if (amount < 0) throw new ArgumentOutOfRangeException(nameof(amount), "A bill amount cannot be negative.");
        if (actorId == Guid.Empty) throw new ArgumentException("An actor is required.", nameof(actorId));
        if (notes?.Length > 1_000) throw new ArgumentOutOfRangeException(nameof(notes), "Bill notes cannot exceed 1000 characters.");

        Amount = amount;
        DueDate = dueDate;
        Notes = notes;
        UpdatedAtUtc = occurredAtUtc;
        _domainEvents.Add(new BillUpdatedDomainEvent(Guid.NewGuid(), HouseholdId, Id, Amount, DueDate, actorId, occurredAtUtc));
    }

    public void SetPaymentStatus(BillPaymentStatus paymentStatus, Guid actorId, DateTimeOffset occurredAtUtc)
    {
        if (actorId == Guid.Empty) throw new ArgumentException("An actor is required.", nameof(actorId));
        if (PaymentStatus == paymentStatus) return;
        PaymentStatus = paymentStatus;
        UpdatedAtUtc = occurredAtUtc;
        _domainEvents.Add(new BillPaymentStatusChangedDomainEvent(Guid.NewGuid(), HouseholdId, Id, PaymentStatus, actorId, occurredAtUtc));
    }

    public IReadOnlyCollection<IDomainEvent> DequeueDomainEvents()
    {
        var events = _domainEvents.ToArray();
        _domainEvents.Clear();
        return events;
    }
}

public enum BillPaymentStatus { Unpaid, Paid }

public sealed record BillCreatedDomainEvent(Guid EventId, Guid HouseholdId, Guid BillId, string Name, decimal Amount, DateOnly DueDate, Guid ActorId, DateTimeOffset OccurredAtUtc) : IDomainEvent;

public sealed record BillPaymentStatusChangedDomainEvent(Guid EventId, Guid HouseholdId, Guid BillId, BillPaymentStatus PaymentStatus, Guid ActorId, DateTimeOffset OccurredAtUtc) : IDomainEvent;

public sealed record BillUpdatedDomainEvent(
    Guid EventId,
    Guid HouseholdId,
    Guid BillId,
    decimal Amount,
    DateOnly DueDate,
    Guid ActorId,
    DateTimeOffset OccurredAtUtc) : IDomainEvent;
