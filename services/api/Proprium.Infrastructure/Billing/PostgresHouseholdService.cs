using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Billing;

public sealed class PostgresHouseholdService(PropriumDbContext database, TimeProvider timeProvider) : IHouseholdQueryService, IHouseholdCommandService
{
    public async Task<IReadOnlyCollection<HouseholdSummary>> ListForUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await database.HouseholdMemberships
            .Where(membership => membership.UserId == userId)
            .OrderBy(membership => membership.Household.Name)
            .Select(membership => new HouseholdSummary(
                membership.HouseholdId,
                membership.Household.Name,
                membership.Household.OwnerUserId == userId))
            .ToArrayAsync(cancellationToken);

    public async Task<RenameHouseholdResult> RenameAsync(RenameHouseholdCommand command, CancellationToken cancellationToken = default)
    {
        var household = await database.Households.SingleOrDefaultAsync(item => item.Id == command.HouseholdId, cancellationToken);
        if (household is null) return new(RenameHouseholdOutcome.NotFound);
        if (household.OwnerUserId != command.ActorId) return new(RenameHouseholdOutcome.Forbidden);
        household.Name = command.Name.Trim();
        household.UpdatedAtUtc = timeProvider.GetUtcNow();
        await database.SaveChangesAsync(cancellationToken);
        return new(RenameHouseholdOutcome.Renamed, new(household.Id, household.Name, true));
    }
}
