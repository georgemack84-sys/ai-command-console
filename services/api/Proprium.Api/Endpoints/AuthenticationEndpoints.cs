using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Proprium.Api.Configuration;
using Proprium.Api.Security;
using Proprium.Application.Authentication;
using Proprium.Contracts.V1;
using Proprium.Domain.Identity;

namespace Proprium.Api.Endpoints;

public static class AuthenticationEndpoints
{
    public static RouteGroupBuilder MapAuthenticationEndpoints(this RouteGroupBuilder v1)
    {
        var auth = v1.MapGroup("/auth").WithTags("Authentication");
        auth.MapPost("/login", async (HttpContext context, IAuthenticationService authentication, IAuthenticationAuditRecorder auditEvents, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, ILoginRateLimiter rateLimiter, ILoginSourceResolver sources, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            var (body, isTooLarge) = await ReadRequestBodyAsync(context.Request.Body, cancellationToken);
            var rateLimit = await rateLimiter.IncrementAsync(new LoginRateLimitRequest(sources.Resolve(context.Connection.RemoteIpAddress), ExtractUsername(body)), cancellationToken);
            if (rateLimit.UsedFallback) await RecordEventAsync(auditEvents, AuthenticationEventType.LoginRateLimitFallbackActivated, AuthenticationEventOutcome.Success, context.TraceIdentifier, "redis-unavailable", cancellationToken);
            if (rateLimit.IsExceeded) { await RecordEventAsync(auditEvents, AuthenticationEventType.LoginRateLimited, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "attempt-limit", cancellationToken); context.Response.Headers.RetryAfter = rateLimit.RetryAfterSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture); return Results.StatusCode(StatusCodes.Status429TooManyRequests); }
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (isTooLarge) return Results.BadRequest();
            if (!string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest();
            if (HasDuplicateProperties(body)) return Results.BadRequest();
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
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status429TooManyRequests).Produces(StatusCodes.Status400BadRequest);

        auth.MapPost("/register", async (HttpContext context, IAccountRegistrationService registration, IAuthenticationAuditRecorder auditEvents, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, ILoginRateLimiter rateLimiter, ILoginSourceResolver sources, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            var (body, isTooLarge) = await ReadRequestBodyAsync(context.Request.Body, cancellationToken);
            var rateLimit = await rateLimiter.IncrementAsync(new LoginRateLimitRequest(sources.Resolve(context.Connection.RemoteIpAddress), ExtractUsername(body)), cancellationToken);
            if (rateLimit.UsedFallback) await RecordEventAsync(auditEvents, AuthenticationEventType.LoginRateLimitFallbackActivated, AuthenticationEventOutcome.Success, context.TraceIdentifier, "redis-unavailable", cancellationToken);
            if (rateLimit.IsExceeded) { await RecordEventAsync(auditEvents, AuthenticationEventType.LoginRateLimited, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "account-registration-limit", cancellationToken); context.Response.Headers.RetryAfter = rateLimit.RetryAfterSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture); return Results.StatusCode(StatusCodes.Status429TooManyRequests); }
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (isTooLarge) return Results.BadRequest();
            if (!string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest();
            if (HasDuplicateProperties(body)) return Results.BadRequest();
            RegisterAccountRequest? request;
            try { request = JsonSerializer.Deserialize<RegisterAccountRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow }); }
            catch (JsonException) { return Results.BadRequest(); }
            if (request is null || string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length is < 3 or > 64 || string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Trim().Length > 240 || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length is < 12 or > 1024)
                return Results.BadRequest();
            var result = await registration.RegisterAsync(new AccountRegistrationAttempt(request.Username, request.DisplayName, request.Password, context.TraceIdentifier), cancellationToken);
            if (!result.Succeeded || result.SessionToken is null) return Results.Conflict();
            cookies.Append(context.Response, result.SessionToken);
            return Results.NoContent();
        }).WithName("RegisterAccount").WithSummary("Create an account and personal household.")
            .WithDescription("Creates a Member account with a personal household and returns 204 with the opaque session only in the HttpOnly cookie.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status409Conflict).Produces(StatusCodes.Status429TooManyRequests);

        auth.MapGet("/me", (HttpContext context) =>
        {
            SetNoStore(context);
            var user = context.Features.Get<AuthenticatedRequest>();
            return user is null ? Results.Unauthorized() : Results.Ok(new CurrentUserResponse(user.UserId, user.Username, user.DisplayName, user.Roles, user.Permissions.Permissions));
        }).WithName("GetCurrentUser").WithSummary("Return the authenticated current user.")
            .WithDescription("The session cookie is the authentication mechanism. The response contains only the approved identity, role, and permission fields.")
            .Produces<CurrentUserResponse>().Produces(StatusCodes.Status401Unauthorized)
            .RequirePermission(PermissionCatalog.Identity.ProfileReadSelf);

        auth.MapPatch("/me", async (HttpContext context, IProfileService profiles, IAuthenticationAuditRecorder auditEvents, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            var (body, isTooLarge) = await ReadRequestBodyAsync(context.Request.Body, cancellationToken);
            if (isTooLarge) return Results.BadRequest();
            if (!string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase)) return Results.BadRequest();
            if (HasDuplicateProperties(body)) return Results.BadRequest();
            UpdateProfileRequest? request;
            try { request = JsonSerializer.Deserialize<UpdateProfileRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow }); }
            catch (JsonException) { return Results.BadRequest(); }
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var displayName = request?.DisplayName?.Trim();
            if (string.IsNullOrWhiteSpace(displayName) || displayName.Length > 240) return Results.BadRequest();
            var result = await profiles.UpdateDisplayNameAsync(new ProfileUpdateAttempt(actor.UserId, actor.SessionId, displayName, context.TraceIdentifier), cancellationToken);
            return !result.Succeeded || result.DisplayName is null
                ? Results.Unauthorized()
                : Results.Ok(new CurrentUserResponse(actor.UserId, actor.Username, result.DisplayName, actor.Roles, actor.Permissions.Permissions));
        }).WithName("UpdateCurrentUserProfile").WithSummary("Update the authenticated user's display name.")
            .Produces<CurrentUserResponse>().Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status401Unauthorized)
            .RequirePermission(PermissionCatalog.Identity.ProfileManageSelf);

        auth.MapGet("/recovery-contact", async (HttpContext context, IRecoveryContactService contacts, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            var contact = await contacts.GetAsync(actor.UserId, cancellationToken);
            return Results.Ok(new RecoveryContactResponse(contact.MaskedEmail, contact.IsVerified, contact.VerificationPending));
        }).WithName("GetRecoveryContact").WithSummary("Return the authenticated user's masked recovery-contact state.")
            .Produces<RecoveryContactResponse>().Produces(StatusCodes.Status401Unauthorized)
            .RequirePermission(PermissionCatalog.Identity.RecoveryContactManageSelf);

        auth.MapPost("/recovery-contact", async (HttpContext context, IRecoveryContactService contacts, IAuthenticationAuditRecorder auditEvents, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            var (body, isTooLarge) = await ReadRequestBodyAsync(context.Request.Body, cancellationToken);
            if (isTooLarge || !string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase) || HasDuplicateProperties(body)) return Results.BadRequest();
            BeginRecoveryContactVerificationRequest? request;
            try { request = JsonSerializer.Deserialize<BeginRecoveryContactVerificationRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow }); }
            catch (JsonException) { return Results.BadRequest(); }
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request?.Email) || request.Email.Length > 320 || string.IsNullOrWhiteSpace(request.CurrentPassword) || request.CurrentPassword.Length > 1024) return Results.BadRequest();
            var result = await contacts.BeginVerificationAsync(new BeginRecoveryContactVerificationAttempt(actor.UserId, actor.SessionId, request.Email, request.CurrentPassword, context.TraceIdentifier), cancellationToken);
            return result.Outcome switch
            {
                BeginRecoveryContactVerificationOutcome.Sent => Results.Accepted(),
                BeginRecoveryContactVerificationOutcome.Unauthorized => Results.Unauthorized(),
                BeginRecoveryContactVerificationOutcome.Unavailable => Results.StatusCode(StatusCodes.Status503ServiceUnavailable),
                _ => Results.Accepted()
            };
        }).WithName("BeginRecoveryContactVerification").WithSummary("Send a recovery-contact verification challenge through the configured delivery provider.")
            .Produces(StatusCodes.Status202Accepted).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden).Produces(StatusCodes.Status503ServiceUnavailable)
            .RequirePermission(PermissionCatalog.Identity.RecoveryContactManageSelf);

        auth.MapPost("/recovery-contact/verify", async (HttpContext context, IRecoveryContactService contacts, IAuthenticationAuditRecorder auditEvents, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            var (body, isTooLarge) = await ReadRequestBodyAsync(context.Request.Body, cancellationToken);
            if (isTooLarge || !string.Equals(context.Request.ContentType?.Split(';')[0], "application/json", StringComparison.OrdinalIgnoreCase) || HasDuplicateProperties(body)) return Results.BadRequest();
            CompleteRecoveryContactVerificationRequest? request;
            try { request = JsonSerializer.Deserialize<CompleteRecoveryContactVerificationRequest>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true, UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow }); }
            catch (JsonException) { return Results.BadRequest(); }
            var actor = context.Features.Get<AuthenticatedRequest>();
            if (actor is null) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request?.Token) || request.Token.Length > 128) return Results.BadRequest();
            var result = await contacts.CompleteVerificationAsync(new CompleteRecoveryContactVerificationAttempt(actor.UserId, actor.SessionId, new RawSessionToken(request.Token), context.TraceIdentifier), cancellationToken);
            return result.Outcome == CompleteRecoveryContactVerificationOutcome.Verified ? Results.NoContent() : Results.BadRequest();
        }).WithName("CompleteRecoveryContactVerification").WithSummary("Verify a recovery-contact challenge for the authenticated user.")
            .Produces(StatusCodes.Status204NoContent).Produces(StatusCodes.Status400BadRequest).Produces(StatusCodes.Status401Unauthorized).Produces(StatusCodes.Status403Forbidden)
            .RequirePermission(PermissionCatalog.Identity.RecoveryContactManageSelf);

        auth.MapPost("/logout", async (HttpContext context, IAuthenticationService authentication, IAuthenticationAuditRecorder auditEvents, AuthenticationCookiePolicy cookies, AuthenticationRequestPolicy requestPolicy, CancellationToken cancellationToken) =>
        {
            SetNoStore(context);
            if (!requestPolicy.IsOriginAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.OriginRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "origin", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
            if (!requestPolicy.IsCsrfAllowed(context.Request)) { await RecordEventAsync(auditEvents, AuthenticationEventType.CsrfRejected, AuthenticationEventOutcome.Denied, context.TraceIdentifier, "csrf", cancellationToken); return Results.StatusCode(StatusCodes.Status403Forbidden); }
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

    private static Task RecordEventAsync(IAuthenticationAuditRecorder auditEvents, AuthenticationEventType eventType, AuthenticationEventOutcome outcome, string correlationId, string reasonCode, CancellationToken cancellationToken) =>
        auditEvents.RecordBestEffortAsync(eventType, outcome, correlationId, reasonCode, cancellationToken);

    private static async Task<(string Body, bool IsTooLarge)> ReadRequestBodyAsync(Stream stream, CancellationToken cancellationToken)
    {
        var bytes = new byte[4_097];
        var read = 0;
        while (read < bytes.Length)
        {
            var count = await stream.ReadAsync(bytes.AsMemory(read, bytes.Length - read), cancellationToken);
            if (count == 0) break;
            read += count;
        }
        return (Encoding.UTF8.GetString(bytes, 0, Math.Min(read, 4_096)), read > 4_096);
    }

    private static string? ExtractUsername(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return null;
            var usernames = document.RootElement.EnumerateObject()
                .Where(property => string.Equals(property.Name, "username", StringComparison.OrdinalIgnoreCase) && property.Value.ValueKind == JsonValueKind.String)
                .Select(property => property.Value.GetString())
                .ToArray();
            return usernames.Length == 1 ? usernames[0] : null;
        }
        catch (JsonException) { return null; }
    }

    private static bool HasDuplicateProperties(string body)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            if (document.RootElement.ValueKind != JsonValueKind.Object) return false;
            return document.RootElement.EnumerateObject()
                .GroupBy(property => property.Name, StringComparer.OrdinalIgnoreCase)
                .Any(group => group.Skip(1).Any());
        }
        catch (JsonException) { return false; }
    }
}
