using Proprium.Api.Middleware;
using Proprium.Api.Security;
using Proprium.Application.Observability;

namespace Proprium.Api.Observability;

public sealed class HttpRequestContext(IHttpContextAccessor httpContextAccessor) : IRequestContext
{
    private HttpContext Context => httpContextAccessor.HttpContext
        ?? throw new InvalidOperationException("A request context is unavailable outside an HTTP request.");

    public string RequestId => CorrelationMiddleware.GetRequestId(Context);
    public string CorrelationId => CorrelationMiddleware.GetCorrelationId(Context);
    public Guid? ActorId => Guid.TryParse(Context.User.FindFirst(PropriumClaims.UserId)?.Value, out var actorId)
        ? actorId
        : null;
}
