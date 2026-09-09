using Proprium.Domain.Billing;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class BillingDomainEventTests
{
    [Fact]
    public void Updating_a_bill_emits_a_complete_domain_event()
    {
        var householdId = Guid.NewGuid();
        var bill = new Bill { HouseholdId = householdId, Name = "Internet" };
        var actorId = Guid.NewGuid();
        var dueDate = new DateOnly(2026, 10, 9);
        var occurredAt = DateTimeOffset.UtcNow;

        bill.Update(229.00m, dueDate, "Updated plan", actorId, occurredAt);

        var domainEvent = Assert.IsType<BillUpdatedDomainEvent>(Assert.Single(bill.DomainEvents));
        Assert.Equal(householdId, domainEvent.HouseholdId);
        Assert.Equal(bill.Id, domainEvent.BillId);
        Assert.Equal(229.00m, domainEvent.Amount);
        Assert.Equal(actorId, domainEvent.ActorId);
        Assert.Equal(occurredAt, domainEvent.OccurredAtUtc);
    }

    [Fact]
    public void Invalid_bill_mutation_emits_no_event()
    {
        var bill = new Bill { HouseholdId = Guid.NewGuid(), Name = "Internet" };

        Assert.Throws<ArgumentOutOfRangeException>(() => bill.Update(-1m, new DateOnly(2026, 10, 9), null, Guid.NewGuid(), DateTimeOffset.UtcNow));
        Assert.Empty(bill.DomainEvents);
    }

    [Fact]
    public void Creating_and_paying_a_bill_emit_distinct_facts()
    {
        var householdId = Guid.NewGuid();
        var actorId = Guid.NewGuid();
        var bill = Bill.Create(householdId, "Electric", 120m, new DateOnly(2026, 10, 9), null, actorId, DateTimeOffset.UtcNow);

        Assert.IsType<BillCreatedDomainEvent>(Assert.Single(bill.DomainEvents));
        bill.DequeueDomainEvents();
        bill.SetPaymentStatus(BillPaymentStatus.Paid, actorId, DateTimeOffset.UtcNow);

        var payment = Assert.IsType<BillPaymentStatusChangedDomainEvent>(Assert.Single(bill.DomainEvents));
        Assert.Equal(BillPaymentStatus.Paid, payment.PaymentStatus);
    }
}
