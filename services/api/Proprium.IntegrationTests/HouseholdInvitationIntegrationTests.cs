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
        Assert.NotNull(created.Invitation);
        Assert.Single(await service.ListPendingForUserAsync(target.Id));

        Assert.Equal(ResolveHouseholdInvitationOutcome.Accepted, (await service.AcceptAsync(created.Invitation!.Id, target.Id)).Outcome);
        Assert.Equal(ResolveHouseholdInvitationOutcome.Accepted, (await service.AcceptAsync(created.Invitation.Id, target.Id)).Outcome);
        Assert.True(await database.HouseholdMemberships.AnyAsync(item => item.HouseholdId == household.Id && item.UserId == target.Id));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.InvitationId == created.Invitation.Id && item.Action == HouseholdInvitationAuditAction.Created));
        Assert.True(await database.HouseholdInvitationAuditEvents.AnyAsync(item => item.InvitationId == created.Invitation.Id && item.Action == HouseholdInvitationAuditAction.Accepted));
    }

    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }
}
