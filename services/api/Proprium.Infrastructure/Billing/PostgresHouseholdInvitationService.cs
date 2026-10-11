using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Billing;

public sealed class PostgresHouseholdInvitationService(PropriumDbContext database, TimeProvider timeProvider) : IHouseholdInvitationService, IHouseholdMembershipService
{
    private const int MaximumPendingInvitations = 10;
    private const int MaximumInvitationAttemptsPerDay = 20;

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

    public async Task<ListHouseholdInvitationResult> ListPendingForHouseholdAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default)
    {
        if (!await IsOwnerAsync(householdId, actorId, cancellationToken))
            return new(ListHouseholdInvitationOutcome.Forbidden, []);

        var now = timeProvider.GetUtcNow();
        var invitations = await database.HouseholdInvitations
            .Where(item => item.HouseholdId == householdId && item.Status == HouseholdInvitationStatus.Pending && item.ExpiresAtUtc > now)
            .OrderBy(item => item.ExpiresAtUtc)
            .Join(database.Households, item => item.HouseholdId, household => household.Id, (item, household) => new { item, household })
            .Join(database.Users, value => value.item.InviterUserId, user => user.Id, (value, user) => new HouseholdInvitationDetails(value.item.Id, value.item.HouseholdId, value.household.Name, user.DisplayName, value.item.ExpiresAtUtc))
            .ToArrayAsync(cancellationToken);
        return new(ListHouseholdInvitationOutcome.Listed, invitations);
    }

    public async Task<IReadOnlyCollection<HouseholdMemberDetails>> ListAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken = default)
    {
        if (!await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == householdId && item.UserId == actorId, cancellationToken))
            return [];

        var ownerUserId = await database.Households.Where(item => item.Id == householdId).Select(item => item.OwnerUserId).SingleAsync(cancellationToken);
        return await database.HouseholdMemberships
            .Where(item => item.HouseholdId == householdId)
            .Join(database.Users, membership => membership.UserId, user => user.Id, (membership, user) => new HouseholdMemberDetails(user.Id, user.DisplayName, membership.JoinedAtUtc, user.Id == ownerUserId))
            .OrderByDescending(item => item.IsOwner).ThenBy(item => item.DisplayName)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<RemoveHouseholdMemberResult> RemoveAsync(Guid householdId, Guid actorId, Guid memberUserId, CancellationToken cancellationToken = default)
    {
        var household = await database.Households.SingleOrDefaultAsync(item => item.Id == householdId, cancellationToken);
        if (household is null || household.OwnerUserId != actorId) return new(RemoveHouseholdMemberOutcome.Forbidden);
        if (household.OwnerUserId == memberUserId) return new(RemoveHouseholdMemberOutcome.CannotRemoveOwner);
        var membership = await database.HouseholdMemberships.SingleOrDefaultAsync(item => item.HouseholdId == householdId && item.UserId == memberUserId, cancellationToken);
        if (membership is null) return new(RemoveHouseholdMemberOutcome.NotFound);
        database.Remove(membership);
        database.Add(Audit(householdId, null, actorId, memberUserId, HouseholdInvitationAuditAction.Removed, "removed", timeProvider.GetUtcNow()));
        await database.SaveChangesAsync(cancellationToken);
        return new(RemoveHouseholdMemberOutcome.Removed);
    }

    public async Task<CreateHouseholdInvitationResult> CreateAsync(Guid householdId, Guid actorId, string targetUsername, CancellationToken cancellationToken = default)
    {
        var household = await database.Households.SingleOrDefaultAsync(item => item.Id == householdId, cancellationToken);
        if (household is null) return new(CreateHouseholdInvitationOutcome.Forbidden);
        var now = timeProvider.GetUtcNow();
        if (household.OwnerUserId != actorId)
            return await DenyCreateAsync(householdId, actorId, null, CreateHouseholdInvitationOutcome.Forbidden, "invite_forbidden", now, cancellationToken);

        var attemptWindowStart = now.AddHours(-24);
        var attemptCount = await database.HouseholdInvitationAuditEvents.CountAsync(item =>
            item.HouseholdId == householdId &&
            item.ActorUserId == actorId &&
            item.OccurredAtUtc >= attemptWindowStart &&
            (item.Action == HouseholdInvitationAuditAction.Created ||
             (item.Action == HouseholdInvitationAuditAction.Denied && item.ReasonCode.StartsWith("invite_create_"))), cancellationToken);
        if (attemptCount >= MaximumInvitationAttemptsPerDay)
            return await DenyCreateAsync(householdId, actorId, null, CreateHouseholdInvitationOutcome.RateLimited, "invite_create_rate_limited", now, cancellationToken);

        var target = await database.Users.SingleOrDefaultAsync(item => item.NormalizedUsername == IdentityNormalization.NormalizeUsername(targetUsername.Trim()), cancellationToken);
        if (target is null || target.Id == actorId)
            return await DenyCreateAsync(householdId, actorId, target?.Id, CreateHouseholdInvitationOutcome.TargetUnavailable, "invite_create_target_unavailable", now, cancellationToken);
        if (await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == householdId && item.UserId == target.Id, cancellationToken))
            return await DenyCreateAsync(householdId, actorId, target.Id, CreateHouseholdInvitationOutcome.AlreadyMember, "invite_create_already_member", now, cancellationToken);
        var pendingInvitationCount = await database.HouseholdInvitations.CountAsync(item => item.HouseholdId == householdId && item.Status == HouseholdInvitationStatus.Pending && item.ExpiresAtUtc > now, cancellationToken);
        if (pendingInvitationCount >= MaximumPendingInvitations)
            return await DenyCreateAsync(householdId, actorId, target.Id, CreateHouseholdInvitationOutcome.RateLimited, "invite_create_pending_limit", now, cancellationToken);
        if (await database.HouseholdInvitations.AnyAsync(item => item.HouseholdId == householdId && item.TargetUserId == target.Id && item.Status == HouseholdInvitationStatus.Pending && item.ExpiresAtUtc > now, cancellationToken))
            return await DenyCreateAsync(householdId, actorId, target.Id, CreateHouseholdInvitationOutcome.AlreadyPending, "invite_create_already_pending", now, cancellationToken);
        var invitation = new HouseholdInvitation { HouseholdId = householdId, InviterUserId = actorId, TargetUserId = target.Id, ExpiresAtUtc = now.AddDays(7) };
        database.Add(invitation);
        database.Add(Audit(householdId, invitation.Id, actorId, target.Id, HouseholdInvitationAuditAction.Created, "invite_created", now));
        await database.SaveChangesAsync(cancellationToken);
        var inviter = await database.Users.SingleAsync(item => item.Id == actorId, cancellationToken);
        return new(CreateHouseholdInvitationOutcome.Created, new(invitation.Id, household.Id, household.Name, inviter.DisplayName, invitation.ExpiresAtUtc));
    }

    public async Task<ResolveHouseholdInvitationResult> AcceptAsync(Guid invitationId, Guid actorId, CancellationToken cancellationToken = default)
    {
        var invitation = await database.HouseholdInvitations.SingleOrDefaultAsync(item => item.Id == invitationId, cancellationToken);
        if (invitation is null) return new(ResolveHouseholdInvitationOutcome.NotFound);
        var now = timeProvider.GetUtcNow();
        if (invitation.TargetUserId != actorId)
            return await DenyResolveAsync(invitation, actorId, ResolveHouseholdInvitationOutcome.Forbidden, "invite_accept_forbidden", now, cancellationToken);
        if (invitation.Status == HouseholdInvitationStatus.Accepted)
        {
            database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, invitation.TargetUserId, HouseholdInvitationAuditAction.Accepted, "invite_duplicate_accept", now));
            await database.SaveChangesAsync(cancellationToken);
            return new(ResolveHouseholdInvitationOutcome.Accepted);
        }
        if (invitation.Status != HouseholdInvitationStatus.Pending || invitation.ExpiresAtUtc <= now)
            return await DenyResolveAsync(invitation, actorId, ResolveHouseholdInvitationOutcome.Expired, "invite_expired", now, cancellationToken);
        if (!await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == invitation.HouseholdId && item.UserId == actorId, cancellationToken)) database.Add(new HouseholdMembership { HouseholdId = invitation.HouseholdId, UserId = actorId });
        invitation.Status = HouseholdInvitationStatus.Accepted;
        invitation.ResolvedAtUtc = now;
        database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, actorId, HouseholdInvitationAuditAction.Accepted, "invite_accepted", now));
        await database.SaveChangesAsync(cancellationToken);
        return new(ResolveHouseholdInvitationOutcome.Accepted);
    }

    public async Task<ResolveHouseholdInvitationResult> RevokeAsync(Guid invitationId, Guid actorId, CancellationToken cancellationToken = default)
    {
        var invitation = await database.HouseholdInvitations.SingleOrDefaultAsync(item => item.Id == invitationId, cancellationToken);
        if (invitation is null) return new(ResolveHouseholdInvitationOutcome.NotFound);
        var now = timeProvider.GetUtcNow();
        if (invitation.InviterUserId != actorId || invitation.Status != HouseholdInvitationStatus.Pending)
            return await DenyResolveAsync(invitation, actorId, ResolveHouseholdInvitationOutcome.Forbidden, "invite_revoke_forbidden", now, cancellationToken);
        invitation.Status = HouseholdInvitationStatus.Revoked;
        invitation.ResolvedAtUtc = now;
        database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, invitation.TargetUserId, HouseholdInvitationAuditAction.Revoked, "invite_revoked", now));
        await database.SaveChangesAsync(cancellationToken);
        return new(ResolveHouseholdInvitationOutcome.Revoked);
    }

    private async Task<bool> IsOwnerAsync(Guid householdId, Guid actorId, CancellationToken cancellationToken) =>
        await database.Households.AnyAsync(item => item.Id == householdId && item.OwnerUserId == actorId, cancellationToken);

    private async Task<CreateHouseholdInvitationResult> DenyCreateAsync(Guid householdId, Guid actorId, Guid? targetUserId, CreateHouseholdInvitationOutcome outcome, string reasonCode, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        database.Add(Audit(householdId, null, actorId, targetUserId, HouseholdInvitationAuditAction.Denied, reasonCode, occurredAtUtc));
        await database.SaveChangesAsync(cancellationToken);
        return new(outcome);
    }

    private async Task<ResolveHouseholdInvitationResult> DenyResolveAsync(HouseholdInvitation invitation, Guid actorId, ResolveHouseholdInvitationOutcome outcome, string reasonCode, DateTimeOffset occurredAtUtc, CancellationToken cancellationToken)
    {
        database.Add(Audit(invitation.HouseholdId, invitation.Id, actorId, invitation.TargetUserId, HouseholdInvitationAuditAction.Denied, reasonCode, occurredAtUtc));
        await database.SaveChangesAsync(cancellationToken);
        return new(outcome);
    }

    private static HouseholdInvitationAuditEvent Audit(Guid householdId, Guid? invitationId, Guid actorId, Guid? targetUserId, HouseholdInvitationAuditAction action, string reasonCode, DateTimeOffset occurredAtUtc)
    {
        return new() { HouseholdId = householdId, InvitationId = invitationId, ActorUserId = actorId, TargetUserId = targetUserId, Action = action, ReasonCode = reasonCode, OccurredAtUtc = occurredAtUtc };
    }
}
