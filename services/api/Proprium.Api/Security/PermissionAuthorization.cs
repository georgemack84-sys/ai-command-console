using Microsoft.AspNetCore.Authorization;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Api.Security;

public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionRequirement(PermissionDefinition permission)
    {
        ArgumentNullException.ThrowIfNull(permission);
        if (!PermissionCatalog.All.Any(item => string.Equals(item.Key, permission.Key, StringComparison.Ordinal)))
            throw new ArgumentException("The permission is not defined by the canonical catalog.", nameof(permission));
        Permission = permission.Key;
    }

    public string Permission { get; }
}

public sealed class PermissionAuthorizationHandler(PropriumDbContext database) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.Resource is not HttpContext httpContext) return;
        var authenticated = httpContext.Features.Get<AuthenticatedRequest>();
        if (authenticated is null) return;
        if (authenticated.Permissions.Contains(requirement.Permission))
        {
            context.Succeed(requirement);
            return;
        }

        try
        {
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.AuthorizationDenied, AuthenticationEventOutcome.Denied, httpContext.TraceIdentifier, authenticated.UserId, authenticated.SessionId, reasonCode: requirement.Permission));
            await database.SaveChangesAsync(httpContext.RequestAborted);
        }
        catch (OperationCanceledException) when (httpContext.RequestAborted.IsCancellationRequested) { throw; }
        catch { }
    }
}

public static class PermissionEndpointExtensions
{
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, PermissionDefinition permission) where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(policy => policy.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)));
}
