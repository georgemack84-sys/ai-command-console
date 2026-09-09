using Proprium.Application.Authentication;
using Proprium.Application.Billing;
using Proprium.Application.Observability;
using Proprium.Contracts.V1;
using Proprium.Domain.Billing;

namespace Proprium.Api.Endpoints;

public static class BillingEndpoints
{
    public static RouteGroupBuilder MapBillingEndpoints(this RouteGroupBuilder v1)
    {
        var bills = v1.MapGroup("/households/{householdId:guid}/bills").WithTags("Bills").RequireAuthorization();
        bills.MapPost("", async (
            Guid householdId,
            CreateBillRequest request,
            HttpContext context,
            IRequestContext requestContext,
            IBillCommandService commands,
            CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var result = await commands.CreateAsync(new CreateBillCommand(Guid.NewGuid(), householdId, request.Name, request.Amount, request.DueDate, request.Notes, actor.UserId, requestContext.CorrelationId), cancellationToken);
            return result.Outcome switch
            {
                UpdateBillOutcome.Updated when result.Bill is not null => Results.Created($"/api/v1/households/{householdId}/bills/{result.Bill.Id}", ToResponse(result.Bill)),
                UpdateBillOutcome.Forbidden => Results.Forbid(),
                _ => Results.Problem("The bill could not be created.")
            };
        })
            .WithName("CreateBill")
            .WithSummary("Create a bill in an authorized household.")
            .Produces<BillResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
        bills.MapGet("", async (
            Guid householdId,
            HttpContext context,
            IBillQueryService queries,
            CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var result = await queries.ListAsync(householdId, actor.UserId, cancellationToken);
            return result.Outcome == ListBillsOutcome.Forbidden
                ? Results.Forbid()
                : Results.Ok(result.Bills.Select(ToResponse));
        })
            .WithName("ListBills")
            .WithSummary("List bills in an authorized household.")
            .Produces<IReadOnlyCollection<BillResponse>>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
        bills.MapPatch("/{billId:guid}", async (
            Guid householdId,
            Guid billId,
            UpdateBillRequest request,
            HttpContext context,
            IRequestContext requestContext,
            IBillCommandService commands,
            CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();

            var result = await commands.UpdateAsync(new UpdateBillCommand(
                Guid.NewGuid(),
                householdId,
                billId,
                request.Amount,
                request.DueDate,
                request.Notes,
                actor.UserId,
                requestContext.CorrelationId), cancellationToken);
            return result.Outcome switch
            {
                UpdateBillOutcome.Updated when result.Bill is not null => Results.Ok(ToResponse(result.Bill)),
                UpdateBillOutcome.NotFound => Results.NotFound(),
                UpdateBillOutcome.Forbidden => Results.Forbid(),
                _ => Results.Problem("The bill update could not be completed.")
            };
        })
            .WithName("UpdateBill")
            .WithSummary("Update a bill in an authorized household.")
            .Produces<BillResponse>()
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);
        bills.MapPatch("/{billId:guid}/payment-status", async (
            Guid householdId,
            Guid billId,
            SetBillPaymentStatusRequest request,
            HttpContext context,
            IRequestContext requestContext,
            IBillCommandService commands,
            CancellationToken cancellationToken) =>
        {
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            if (!Enum.TryParse<BillPaymentStatus>(request.PaymentStatus, ignoreCase: true, out var status)) return Results.BadRequest();
            var result = await commands.SetPaymentStatusAsync(new SetBillPaymentStatusCommand(Guid.NewGuid(), householdId, billId, status, actor.UserId, requestContext.CorrelationId), cancellationToken);
            return result.Outcome switch
            {
                UpdateBillOutcome.Updated when result.Bill is not null => Results.Ok(ToResponse(result.Bill)),
                UpdateBillOutcome.NotFound => Results.NotFound(),
                UpdateBillOutcome.Forbidden => Results.Forbid(),
                _ => Results.Problem("The payment status could not be updated.")
            };
        })
            .WithName("SetBillPaymentStatus")
            .WithSummary("Set a bill payment status in an authorized household.")
            .Produces<BillResponse>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);
        return v1;
    }

    private static BillResponse ToResponse(BillDetails bill) => new(bill.Id, bill.HouseholdId, bill.Name, bill.Amount, bill.DueDate, bill.Notes, bill.PaymentStatus.ToString(), bill.UpdatedAtUtc);
}
