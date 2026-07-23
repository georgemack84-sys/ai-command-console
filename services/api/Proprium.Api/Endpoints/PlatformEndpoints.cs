using Microsoft.Extensions.Options;
using Proprium.Api.Configuration;
using Proprium.Contracts.V1;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Proprium.Api.Endpoints;

public static class PlatformEndpoints
{
    public static IEndpointRouteBuilder MapPlatformEndpoints(this IEndpointRouteBuilder app)
    {
        var v1 = app.MapGroup("/api/v1").WithTags("Platform");
        v1.MapGet("", (IOptions<PlatformOptions> options) => Results.Ok(new PlatformInfoResponse(options.Value.Name, options.Value.Version, "v1")))
            .WithName("GetPlatformInfo").Produces<PlatformInfoResponse>();
        v1.MapGet("/health", (HttpContext context) => Results.Ok(new HealthResponse("healthy", context.TraceIdentifier)))
            .WithName("GetHealth").Produces<HealthResponse>();
        v1.MapGet("/health/live", (HttpContext context) => Results.Ok(new HealthResponse("healthy", context.TraceIdentifier)))
            .WithName("GetLiveness").Produces<HealthResponse>();
        v1.MapGet("/health/ready", async (HttpContext context, HealthCheckService checks, CancellationToken cancellationToken) =>
        {
            var report = await checks.CheckHealthAsync(registration => registration.Tags.Contains("ready"), cancellationToken);
            return report.Status == HealthStatus.Healthy
                ? Results.Ok(new HealthResponse("healthy", context.TraceIdentifier))
                : Results.Json(new HealthResponse("unhealthy", context.TraceIdentifier), statusCode: StatusCodes.Status503ServiceUnavailable);
        })
            .WithName("GetReadiness").Produces<HealthResponse>();
        v1.MapAuthenticationEndpoints();
        return app;
    }
}
