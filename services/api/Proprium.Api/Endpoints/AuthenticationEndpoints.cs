using Proprium.Api.Configuration;
using Proprium.Api.Middleware;
using Proprium.Api.Security;
using Proprium.Application.Authentication;
using Proprium.Contracts.V1;
using Proprium.Domain.Identity;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Proprium.Api.Endpoints;

public static class AuthenticationEndpoints
{
    public static RouteGroupBuilder MapAuthenticationEndpoints(this RouteGroupBuilder v1)
    {
        var auth = v1.MapGroup("/auth").WithTags("Authentication");
        auth.MapPost("/login", async (HttpContext context, IAuthenticationService authentication, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, ILoginRateLimiter rateLimiter, ILoginSourceResolver sources, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (context.Request.ContentLength is > 4_096) return Results.BadRequest();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync(cancellationToken);
            var rateLimit = await rateLimiter.IncrementAsync(new LoginRateLimitRequest(sources.Resolve(context.Connection.RemoteIpAddress), ExtractUsername(body)), cancellationToken);
            if (rateLimit.IsExceeded) { context.Response.Headers.RetryAfter = rateLimit.RetryAfterSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture); return Results.StatusCode(StatusCodes.Status429TooManyRequests); }
            if (!requestPolicy.IsAllowed(context.Request)) return Results.StatusCode(StatusCodes.Status403Forbidden);
            if (!string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest();
            LoginRequest? request;
            try { request = JsonSerializer.Deserialize<LoginRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow }); }
            catch (JsonException) { return Results.BadRequest(); }
            if (request is null || string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 256 || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length > 1024)
                return Results.BadRequest();
            var result = await authentication.LoginAsync(new LoginAttempt(request.Username, request.Password, context.TraceIdentifier), cancellationToken);
            if (!result.Succeeded || result.SessionToken is null) return Results.Unauthorized();
            cookies.Append(context.Response, result.SessionToken);
            return Results.NoContent();
        }).WithName("Login").WithSummary("Create an authenticated server-side session.")
            .WithDescription("Accepts credentials and returns 204 with the opaque session only in the HttpOnly cookie. Credential rejection is always 401.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status400BadRequest);

        auth.MapGet("/me", (HttpContext context) =>
        {
            SetNoStore(context);
            var user = context.Features.Get<AuthenticatedRequest>();
            return user is null ? Results.Unauthorized() : Results.Ok(new CurrentUserResponse(user.UserId, user.Username, user.DisplayName, user.Roles, user.Permissions.Permissions));
        }).WithName("GetCurrentUser").WithSummary("Return the authenticated current user.")
            .WithDescription("The session cookie is the authentication mechanism. The response contains only the approved identity, role, and permission fields.")
            .Produces<CurrentUserResponse>().Produces(StatusCodes.Status401Unauthorized)
            .RequirePermission(PermissionCatalog.Identity.ProfileReadSelf);

        auth.MapPost("/logout", async (HttpContext context, IAuthenticationService authentication, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsAllowed(context.Request)) return Results.StatusCode(StatusCodes.Status403Forbidden);
            context.Request.Cookies.TryGetValue(cookies.Name, out var token);
            await authentication.LogoutAsync(string.IsNullOrWhiteSpace(token) ? null : new RawSessionToken(token), context.TraceIdentifier, cancellationToken);
            cookies.Clear(context.Response);
            return Results.NoContent();
        }).WithName("Logout").WithSummary("Revoke the current server-side session.")
            .WithDescription("Revokes the authoritative PostgreSQL session, clears the cookie, and returns 204 with no response body.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status403Forbidden);
        return v1;
    }

    private static void SetNoStore(HttpContext context) => context.Response.Headers.CacheControl = "no-store";

    private static string? ExtractUsername(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            return document.RootElement.ValueKind == JsonValueKind.Object && document.RootElement.TryGetProperty("username", out var username) && username.ValueKind == JsonValueKind.String
                ? username.GetString() : null;
        }
        catch (JsonException) { return null; }
    }
}
