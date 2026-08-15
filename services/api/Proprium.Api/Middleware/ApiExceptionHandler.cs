using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Proprium.Api.Middleware;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError("Unhandled request failure for {Path} with type {ExceptionType}", context.Request.Path, exception.GetType().Name);
        var problem = new ProblemDetails { Status = StatusCodes.Status500InternalServerError, Title = "An unexpected error occurred.", Type = "https://httpstatuses.com/500" };
        problem.Extensions["correlationId"] = context.TraceIdentifier;
        context.Response.StatusCode = problem.Status.Value;
        await context.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
