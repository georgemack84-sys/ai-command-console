using Microsoft.AspNetCore.Authorization;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;

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

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.Resource is HttpContext httpContext && httpContext.Features.Get<AuthenticatedRequest>()?.Permissions.Contains(requirement.Permission) == true)
            context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public static class PermissionEndpointExtensions
{
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, PermissionDefinition permission) where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(policy => policy.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)));
}
