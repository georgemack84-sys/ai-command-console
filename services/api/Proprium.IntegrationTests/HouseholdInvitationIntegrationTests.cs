using Microsoft.EntityFrameworkCore;
using Proprium.Application.Billing;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Billing;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class HouseholdInvitationIntegrationTests : IIntegrationTest
{
    [Fact]
    public async Task Owner_can_create_and_target_can_accept_an_invitation_once_with_audit_evidence()
    {
        await using var database = CreateContext();
        var suffix = Guid.NewGuid().ToString("N");
        var owner = new User { Username = $"owner-{suffix}", NormalizedUsername = $"OWNER-{suffix}".ToUpperInvariant(), PasswordHash = "test", DisplayName = "Owner" };
        var target = new User { Username = $"target-{suffix}", NormalizedUsername = $"TARGET-{suffix}".ToUpperInvariant(), PasswordHash = "test", DisplayName = "Target" };
        var household = new Household { OwnerUserId = owner.Id, Name = "Shared home" };
        database.AddRange(owner, target, household, new HouseholdMembership { Household = household, UserId = owner.Id });
        await database.SaveChangesAsync();
        var service = new PostgresHouseholdInvitationService(database, TimeProvider.System);

        var created = await service.CreateAsync(household.Id, owner.Id, target.Username);
        Assert.Equal(CreateHouseholdInvitationOutcome.Created, created.Outcome);
        var invitation = Assert.IsType<HouseholdInvitationDetails>(created.Invitation);
        Assert.Single(await service.ListPendingForUserAsync(target.Id));

        Assert.Equal(ResolveHouseholdInvitationOutcome.Accepted, (await service.AcceptAsync(invitation.Id, target.Id)).Outcome);
        Assert.Equal(ResolveHouseholdInvitationOutcome.Accepted, (await service.AcceptAsync(invitation.Id, target.Id)).Outcome);
        Assert.True(await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == household.Id && item.UserId == target.Id));
        var members = await service.ListAsync(household.Id, owner.Id);
        Assert.Collection(members,
            member => Assert.Equal(owner.Id, member.UserId),
            member => Assert.Equal(target.Id, member.UserId));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.InvitationId == invitation.Id && item.Action == HouseholdInvitationAuditAction.Created));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.InvitationId == invitation.Id && item.Action == HouseholdInvitationAuditAction.Accepted));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.InvitationId == invitation.Id && item.ReasonCode == "invite_duplicate_accept"));

        Assert.Equal(RemoveHouseholdMemberOutcome.Removed, (await service.RemoveAsync(household.Id, owner.Id, target.Id)).Outcome);
        Assert.False(await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == household.Id && item.UserId == target.Id));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.HouseholdId == household.Id && item.TargetUserId == target.Id && item.Action == HouseholdInvitationAuditAction.Removed));
        Assert.Equal(ListBillsOutcome.Forbidden, (await new PostgresBillQueryService(database).ListAsync(household.Id, target.Id)).Outcome);
    }

    [Fact]
    public async Task Owner_cannot_create_more_than_ten_pending_household_invitations()
    {
        await using var database = CreateContext();
        var suffix = Guid.NewGuid().ToString("N");
        var owner = NewUser("owner", suffix);
        var targets = Enumerable.Range(0, 11).Select(index => NewUser($"target-{index}", suffix)).ToArray();
        var household = new Household { OwnerUserId = owner.Id, Name = "Shared home" };
        database.AddRange(owner, household, new HouseholdMembership { Household = household, UserId = owner.Id });
        database.AddRange(targets);
        database.AddRange(targets.Take(10).Select(target => new HouseholdInvitation
        {
            HouseholdId = household.Id,
            InviterUserId = owner.Id,
            TargetUserId = target.Id,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(1)
        }));
        await database.SaveChangesAsync();

        var result = await new PostgresHouseholdInvitationService(database, TimeProvider.System).CreateAsync(household.Id, owner.Id, targets[10].Username);

        Assert.Equal(CreateHouseholdInvitationOutcome.RateLimited, result.Outcome);
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item =>
            item.HouseholdId == household.Id &&
            item.Action == HouseholdInvitationAuditAction.Denied &&
            item.ReasonCode == "invite_create_pending_limit"));
    }

    [Fact]
    public async Task Owner_cannot_make_more_than_twenty_invitation_attempts_in_a_day()
    {
        await using var database = CreateContext();
        var suffix = Guid.NewGuid().ToString("N");
        var owner = NewUser("owner", suffix);
        var target = NewUser("target", suffix);
        var household = new Household { OwnerUserId = owner.Id, Name = "Shared home" };
        database.AddRange(owner, target, household, new HouseholdMembership { Household = household, UserId = owner.Id });
        database.AddRange(Enumerable.Range(0, 20).Select(_ => new HouseholdInvitationAuditEvent
        {
            HouseholdId = household.Id,
            ActorUserId = owner.Id,
            Action = HouseholdInvitationAuditAction.Denied,
            ReasonCode = "invite_create_target_unavailable",
            OccurredAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1)
        }));
        await database.SaveChangesAsync();

        var result = await new PostgresHouseholdInvitationService(database, TimeProvider.System).CreateAsync(household.Id, owner.Id, target.Username);

        Assert.Equal(CreateHouseholdInvitationOutcome.RateLimited, result.Outcome);
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item =>
            item.HouseholdId == household.Id &&
            item.Action == HouseholdInvitationAuditAction.Denied &&
            item.ReasonCode == "invite_create_rate_limited"));
    }

    private static User NewUser(string prefix, string suffix) => new()
    {
        Username = $"{prefix}-{suffix}",
        NormalizedUsername = $"{prefix}-{suffix}".ToUpperInvariant(),
        PasswordHash = "test",
        DisplayName = prefix
    };

    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }
}
