using Proprium.Api.Configuration;
using Proprium.Api.Middleware;
using Proprium.Application.Authentication;
using Proprium.Contracts.V1;

namespace Proprium.Api.Endpoints;

public static class AuthenticationEndpoints
{
    public static RouteGroupBuilder MapAuthenticationEndpoints(this RouteGroupBuilder v1)
    {
        var auth = v1.MapGroup("/auth").WithTags("Authentication");
        auth.MapPost("/login", async (LoginRequest request, HttpContext context, IAuthenticationService authentication, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsAllowed(context.Request)) return Results.BadRequest();
            if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 256 || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length > 1024)
                return Results.BadRequest();
            var result = await authentication.LoginAsync(new LoginAttempt(request.Username, request.Password, context.TraceIdentifier), cancellationToken);
            if (!result.Succeeded || result.SessionToken is null) return Results.Unauthorized();
            cookies.Append(context.Response, result.SessionToken);
            return Results.NoContent();
        }).WithName("Login").WithSummary("Create an authenticated server-side session.")
            .WithDescription("Accepts credentials and returns 204 with the opaque session only in the HttpOnly cookie. Credential rejection is always 401.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status400BadRequest);

        auth.MapGet("/me", async (HttpContext context, ICurrentUserService currentUser, AuthenticationCookiePolicy cookies, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!context.Request.Cookies.TryGetValue(cookies.Name, out var token) || string.IsNullOrWhiteSpace(token)) return Results.Unauthorized();
            var user = await currentUser.ResolveAsync(new RawSessionToken(token), context.TraceIdentifier, cancellationToken);
            return user is null ? Results.Unauthorized() : Results.Ok(new CurrentUserResponse(user.UserId, user.Username, user.DisplayName, user.Roles, user.Permissions));
        }).WithName("GetCurrentUser").WithSummary("Return the authenticated current user.")
            .WithDescription("The session cookie is the authentication mechanism. The response contains only the approved identity, role, and permission fields.")
            .Produces<CurrentUserResponse>().Produces(StatusCodes.Status401Unauthorized);

        auth.MapPost("/logout", async (HttpContext context, IAuthenticationService authentication, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsAllowed(context.Request)) return Results.BadRequest();
            context.Request.Cookies.TryGetValue(cookies.Name, out var token);
            await authentication.LogoutAsync(string.IsNullOrWhiteSpace(token) ? null : new RawSessionToken(token), context.TraceIdentifier, cancellationToken);
            cookies.Clear(context.Response);
            return Results.NoContent();
        }).WithName("Logout").WithSummary("Revoke the current server-side session.")
            .WithDescription("Revokes the authoritative PostgreSQL session, clears the cookie, and returns 204 with no response body.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status400BadRequest);
        return v1;
    }

    private static void SetNoStore(HttpContext context) => context.Response.Headers.CacheControl = "no-store";
}
