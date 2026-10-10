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
        return v1;
    }

    private static HouseholdResponse ToResponse(HouseholdSummary household) => new(household.Id, household.Name, household.IsOwner);
}
