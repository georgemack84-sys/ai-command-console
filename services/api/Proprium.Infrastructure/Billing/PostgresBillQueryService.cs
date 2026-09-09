using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Billing;

public sealed class PostgresBillQueryService(PropriumDbContext database) : IBillQueryService
{
    public async Task<ListBillsResult> ListAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default)
    {
        var isMember = await database.HouseholdMemberships
            .AnyAsync(membership => membership.HouseholdId == householdId && membership.UserId == actorId, cancellationToken);
        if (!isMember) return new(ListBillsOutcome.Forbidden, []);

        var bills = await database.Bills.AsNoTracking()
            .Where(bill => bill.HouseholdId == householdId)
            .OrderBy(bill => bill.DueDate)
            .Select(bill => new BillDetails(bill.Id, bill.HouseholdId, bill.Name, bill.Amount, bill.DueDate, bill.Notes, bill.PaymentStatus, bill.UpdatedAtUtc))
            .ToArrayAsync(cancellationToken);
        return new(ListBillsOutcome.Listed, bills);
    }
}
