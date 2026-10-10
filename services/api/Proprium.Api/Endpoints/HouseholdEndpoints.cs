using Proprium.Application.Authentication;
using Proprium.Application.Billing;
using Proprium.Contracts.V1;

namespace Proprium.Api.Endpoints;

public static class HouseholdEndpoints
{
    public static RouteGroupBuilder MapHouseholdEndpoints(this RouteGroupBuilder v1)
    {
        var households = v1.MapGroup("/households").WithTags("Households").RequireAuthorization();
        households.MapGet("", async (HttpContext context, IHouseholdQueryService queries, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var results = await queries.ListForUserAsync(actor.UserId, cancellationToken);
            return Results.Ok(results.Select(ToResponse));
        })
            .WithName("ListMyHouseholds")
            .WithSummary("List households the authenticated user belongs to.")
            .Produces<IReadOnlyCollection<HouseholdResponse>>()
            .Produces(StatusCodes.Status401Unauthorized);

        households.MapPatch("/{householdId:guid}", async (Guid householdId, RenameHouseholdRequest request, HttpContext context, IHouseholdCommandService commands, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 256) return Results.BadRequest();
            var result = await commands.RenameAsync(new(householdId, actor.UserId, request.Name), cancellationToken);
            return result.Outcome switch
            {
                RenameHouseholdOutcome.Renamed when result.Household is not null => Results.Ok(ToResponse(result.Household)),
                RenameHouseholdOutcome.Forbidden => Results.Forbid(),
                RenameHouseholdOutcome.NotFound => Results.NotFound(),
                _ => Results.Problem("The household could not be renamed.")
            };
        })
            .WithName("RenameHousehold")
            .WithSummary("Rename a household owned by the authenticated user.")
            .Produces<HouseholdResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);
        households.MapPost("/{householdId:guid}/invitations", async (Guid householdId, CreateHouseholdInvitationRequest request, HttpContext context, IHouseholdInvitationService invitations, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 256) return Results.BadRequest();
            var result = await invitations.CreateAsync(householdId, actor.UserId, request.Username, cancellationToken);
            return result.Outcome switch
            {
                CreateHouseholdInvitationOutcome.Created when result.Invitation is not null => Results.Created($"/api/v1/households/invitations/{result.Invitation.Id}", ToInvitationResponse(result.Invitation)),
                CreateHouseholdInvitationOutcome.Forbidden => Results.Forbid(),
                _ => Results.BadRequest()
            };
        }).WithName("CreateHouseholdInvitation").WithSummary("Invite an existing user to an owned household.").Produces<HouseholdInvitationResponse>(StatusCodes.Status201Created).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden);
        households.MapGet("/invitations", async (HttpContext context, IHouseholdInvitationService invitations, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var results = await invitations.ListPendingForUserAsync(actor.UserId, cancellationToken);
            return Results.Ok(results.Select(ToInvitationResponse));
        }).WithName("ListMyHouseholdInvitations").WithSummary("List pending invitations for the authenticated user.").Produces<IReadOnlyCollection<HouseholdInvitationResponse>>().Produces(StatusCodes.Status401Unauthorized);
        households.MapPost("/invitations/{invitationId:guid}/accept", async (Guid invitationId, HttpContext context, IHouseholdInvitationService invitations, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var result = await invitations.AcceptAsync(invitationId, actor.UserId, cancellationToken);
            return result.Outcome switch { ResolveHouseholdInvitationOutcome.Accepted => Results.NoContent(), ResolveHouseholdInvitationOutcome.Forbidden => Results.Forbid(), ResolveHouseholdInvitationOutcome.NotFound => Results.NotFound(), _ => Results.BadRequest() };
        }).WithName("AcceptHouseholdInvitation").WithSummary("Accept a pending household invitation.").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status404NotFound);
        households.MapPost("/invitations/{invitationId:guid}/revoke", async (Guid invitationId, HttpContext context, IHouseholdInvitationService invitations, CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var result = await invitations.RevokeAsync(invitationId, actor.UserId, cancellationToken);
            return result.Outcome switch { ResolveHouseholdInvitationOutcome.Revoked => Results.NoContent(), ResolveHouseholdInvitationOutcome.Forbidden => Results.Forbid(), ResolveHouseholdInvitationOutcome.NotFound => Results.NotFound(), _ => Results.BadRequest() };
        }).WithName("RevokeHouseholdInvitation").WithSummary("Revoke a pending invitation created by the current user.").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status404NotFound);
        return v1;
    }

    private static HouseholdResponse ToResponse(HouseholdSummary household) => new(household.Id, household.Name, household.IsOwner);
    private static HouseholdInvitationResponse ToInvitationResponse(HouseholdInvitationDetails invitation) => new(invitation.Id, invitation.HouseholdId, invitation.HouseholdName, invitation.InviterDisplayName, invitation.ExpiresAtUtc);
}
