namespace Proprium.Api.Middleware;

public sealed class CorrelationMiddleware(RequestDelegate next, ILogger<CorrelationMiddleware> logger)
{
    public const string HeaderName = "X-Correlation-ID";
    public const string RequestIdHeaderName = "X-Request-ID";
    private const string CorrelationIdItemKey = "Proprium.CorrelationId";
    private const string RequestIdItemKey = "Proprium.RequestId";

    public static string GetCorrelationId(HttpContext context) =>
        context.Items[CorrelationIdItemKey] as string ?? context.TraceIdentifier;

    public static string GetRequestId(HttpContext context) =>
        context.Items[RequestIdItemKey] as string ?? context.TraceIdentifier;

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault();
        if (!Guid.TryParse(correlationId, out _)) correlationId = Guid.NewGuid().ToString("D");
        var requestId = context.Request.Headers[RequestIdHeaderName].FirstOrDefault();
        if (!Guid.TryParse(requestId, out _)) requestId = Guid.NewGuid().ToString("D");

        context.TraceIdentifier = correlationId;
        context.Items[CorrelationIdItemKey] = correlationId;
        context.Items[RequestIdItemKey] = requestId;
        context.Response.Headers[HeaderName] = correlationId;
        context.Response.Headers[RequestIdHeaderName] = requestId;
        using (logger.BeginScope(new Dictionary<string, object?>
        {
            ["CorrelationId"] = correlationId,
            ["RequestId"] = requestId,
        }))
        {
            await next(context);
        }
    }
}
