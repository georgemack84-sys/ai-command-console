using System.Text.Json;
using Proprium.Application.Authentication;
using Proprium.Application.Events;

namespace Proprium.Api.Endpoints;

public static class RealtimeEndpoints
{
    private static readonly TimeSpan HeartbeatInterval = TimeSpan.FromSeconds(15);

    public static RouteGroupBuilder MapRealtimeEndpoints(this RouteGroupBuilder v1)
    {
        v1.MapGet("/events/stream", StreamAsync)
            .WithTags("Realtime")
            .RequireAuthorization()
            .WithName("StreamHouseholdEvents")
            .WithSummary("Stream committed household events over server-sent events.")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden);
        return v1;
    }

    private static async Task StreamAsync(
        Guid householdId,
        HttpContext context,
        IRealtimeSubscriptionAuthorizer authorizer,
        IRealtimeSubscriptionRegistry subscriptions,
        CancellationToken cancellationToken)
    {
        var authenticated = context.Features.Get<AuthenticatedRequest>();
        if (authenticated is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        if (!await authorizer.CanSubscribeAsync(householdId, authenticated.UserId, cancellationToken))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        var subscription = subscriptions.Subscribe(householdId);
        context.Response.Headers.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Response.Headers.Append("X-Accel-Buffering", "no");
        await context.Response.StartAsync(cancellationToken);
        await context.Response.WriteAsync(": connected\n\n", cancellationToken);
        await context.Response.Body.FlushAsync(cancellationToken);

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                using var idleCancellation = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                var messageTask = subscription.Reader.ReadAsync(idleCancellation.Token).AsTask();
                var heartbeatTask = Task.Delay(HeartbeatInterval, cancellationToken);
                if (await Task.WhenAny(messageTask, heartbeatTask) == heartbeatTask)
                {
                    idleCancellation.Cancel();
                    try { await messageTask; }
                    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested) { }
                    var heartbeat = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow });
                    await context.Response.WriteAsync($"event: heartbeat\ndata: {heartbeat}\n\n", cancellationToken);
                    await context.Response.Body.FlushAsync(cancellationToken);
                    continue;
                }

                var message = await messageTask;
                var payload = JsonSerializer.Serialize(message);
                await context.Response.WriteAsync($"id: {message.EventId}\nevent: {message.EventType}\ndata: {payload}\n\n", cancellationToken);
                await context.Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // A browser connection ending is expected and requires no response body.
        }
        finally
        {
            subscriptions.Unsubscribe(subscription.ConnectionId);
        }
    }
}
