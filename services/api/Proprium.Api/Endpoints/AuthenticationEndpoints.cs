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
            if (!requestPolicy.IsAllowed(context.Request)) return Results.BadRequest();
            if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 256 || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length > 1024)
                return Results.BadRequest();
            var result = await authentication.LoginAsync(new LoginAttempt(request.Username, request.Password, context.TraceIdentifier), cancellationToken);
            if (!result.Succeeded || result.SessionToken is null) return Results.Unauthorized();
            cookies.Append(context.Response, result.SessionToken);
            return Results.NoContent();
        }).WithName("Login").Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status400BadRequest);

        auth.MapGet("/me", async (HttpContext context, ICurrentUserService currentUser, AuthenticationCookiePolicy cookies, CancellationToken cancellationToken) =>
        {
            if (!context.Request.Cookies.TryGetValue(cookies.Name, out var token) || string.IsNullOrWhiteSpace(token)) return Results.Unauthorized();
            var user = await currentUser.ResolveAsync(new RawSessionToken(token), cancellationToken);
            return user is null ? Results.Unauthorized() : Results.Ok(new CurrentUserResponse(user.UserId, user.Username, user.DisplayName, user.Roles, user.Permissions));
        }).WithName("GetCurrentUser").Produces<CurrentUserResponse>().Produces(StatusCodes.Status401Unauthorized);

        auth.MapPost("/logout", async (HttpContext context, IAuthenticationService authentication, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            if (!requestPolicy.IsAllowed(context.Request)) return Results.BadRequest();
            context.Request.Cookies.TryGetValue(cookies.Name, out var token);
            await authentication.LogoutAsync(string.IsNullOrWhiteSpace(token) ? null : new RawSessionToken(token), context.TraceIdentifier, cancellationToken);
            cookies.Clear(context.Response);
            return Results.NoContent();
        }).WithName("Logout").Produces(StatusCodes.Status204NoContent);
        return v1;
    }
}
