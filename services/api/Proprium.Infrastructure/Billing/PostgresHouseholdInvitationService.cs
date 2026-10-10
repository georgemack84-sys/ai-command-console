using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Billing;

public sealed class PostgresHouseholdInvitationService(PropriumDbContext database, TimeProvider timeProvider) : IHouseholdInvitationService
{
    public async Task<IReadOnlyCollection<HouseholdInvitationDetails>> ListPendingForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow();
        return await database.HouseholdInvitations
            .Where(item => item.TargetUserId == userId && item.Status == HouseholdInvitationStatus.Pending && item.ExpiresAtUtc > now)
            .OrderBy(item => item.ExpiresAtUtc)
            .Join(database.Households, item => item.HouseholdId, household => household.Id, (item, household) => new { item, household })
            .Join(database.Users, value => value.item.InviterUserId, user => user.Id, (value, user) => new HouseholdInvitationDetails(value.item.Id, value.item.HouseholdId, value.household.Name, user.DisplayName, value.item.ExpiresAtUtc))
            .ToArrayAsync(cancellationToken);
    }

    public async Task<CreateHouseholdInvitationResult> CreateAsync(Guid householdId, Guid actorId, string targetUsername, CancellationToken cancellationToken = default)
    {
        var household = await database.Households.SingleOrDefaultAsync(item => item.Id == householdId, cancellationToken);
        if (household is null || household.OwnerUserId != actorId) return new(CreateHouseholdInvitationOutcome.Forbidden);
        var target = await database.Users.SingleOrDefaultAsync(item => item.NormalizedUsername == IdentityNormalization.NormalizeUsername(targetUsername.Trim()), cancellationToken);
        if (target is null || target.Id == actorId) return new(CreateHouseholdInvitationOutcome.TargetUnavailable);
        if (await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == householdId && item.UserId == target.Id, cancellationToken)) return new(CreateHouseholdInvitationOutcome.AlreadyMember);
        var now = timeProvider.GetUtcNow();
        if (await database.HouseholdInvitations.AnyAsync(item => item.HouseholdId == householdId && item.TargetUserId == target.Id && item.Status == HouseholdInvitationStatus.Pending && item.ExpiresAtUtc > now, cancellationToken)) return new(CreateHouseholdInvitationOutcome.AlreadyPending);
        var invitation = new HouseholdInvitation { HouseholdId = householdId, InviterUserId = actorId, TargetUserId = target.Id, ExpiresAtUtc = now.AddDays(7) };
        database.Add(invitation);
        database.Add(Audit(householdId, invitation.Id, actorId, target.Id, HouseholdInvitationAuditAction.Created, "created", now));
        await database.SaveChangesAsync(cancellationToken);
        var inviter = await database.Users.SingleAsync(item => item.Id == actorId, cancellationToken);
        return new(CreateHouseholdInvitationOutcome.Created, new(invitation.Id, household.Id, household.Name, inviter.DisplayName, invitation.ExpiresAtUtc));
    }

    public async Task<ResolveHouseholdInvitationResult> AcceptAsync(Guid invitationId, Guid actorId, CancellationToken cancellationToken = default)
    {
        var invitation = await database.HouseholdInvitations.SingleOrDefaultAsync(item => item.Id == invitationId, cancellationToken);
        if (invitation is null) return new(ResolveHouseholdInvitationOutcome.NotFound);
        if (invitation.TargetUserId != actorId) return new(ResolveHouseholdInvitationOutcome.Forbidden);
        if (invitation.Status == HouseholdInvitationStatus.Accepted) return new(ResolveHouseholdInvitationOutcome.Accepted);
        var now = timeProvider.GetUtcNow();
        if (invitation.Status != HouseholdInvitationStatus.Pending || invitation.ExpiresAtUtc <= now) return new(ResolveHouseholdInvitationOutcome.Expired);
        if (!await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == invitation.HouseholdId && item.UserId == actorId, cancellationToken)) database.Add(new HouseholdMembership { HouseholdId = invitation.HouseholdId, UserId = actorId });
        invitation.Status = HouseholdInvitationStatus.Accepted;
        invitation.ResolvedAtUtc = now;
        database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, actorId, HouseholdInvitationAuditAction.Accepted, "accepted", now));
        await database.SaveChangesAsync(cancellationToken);
        return new(ResolveHouseholdInvitationOutcome.Accepted);
    }

    public async Task<ResolveHouseholdInvitationResult> RevokeAsync(Guid invitationId, Guid actorId, CancellationToken cancellationToken = default)
    {
        var invitation = await database.HouseholdInvitations.SingleOrDefaultAsync(item => item.Id == invitationId, cancellationToken);
        if (invitation is null) return new(ResolveHouseholdInvitationOutcome.NotFound);
        if (invitation.InviterUserId != actorId || invitation.Status != HouseholdInvitationStatus.Pending) return new(ResolveHouseholdInvitationOutcome.Forbidden);
        invitation.Status = HouseholdInvitationStatus.Revoked;
        var now = timeProvider.GetUtcNow();
        invitation.ResolvedAtUtc = now;
        database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, invitation.TargetUserId, HouseholdInvitationAuditAction.Revoked, "revoked", now));
        await database.SaveChangesAsync(cancellationToken);
        return new(ResolveHouseholdInvitationOutcome.Revoked);
    }

    private static HouseholdInvitationAuditEvent Audit(Guid householdId, Guid invitationId, Guid actorId, Guid targetUserId, HouseholdInvitationAuditAction action, string reasonCode, DateTimeOffset occurredAtUtc)
    {
        return new() { HouseholdId = householdId, InvitationId = invitationId, ActorUserId = actorId, TargetUserId = targetUserId, Action = action, ReasonCode = reasonCode, OccurredAtUtc = occurredAtUtc };
    }
}
