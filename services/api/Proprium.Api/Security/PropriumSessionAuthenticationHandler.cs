using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Proprium.Api.Configuration;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Api.Security;

public sealed class PropriumSessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    AuthenticationCookiePolicy cookies) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "PropriumSession";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var values = Request.Headers.Cookie.SelectMany(value => (value ?? string.Empty).Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            .Where(value => value.StartsWith($"{cookies.Name}=", StringComparison.Ordinal)).Select(value => value[(cookies.Name.Length + 1)..]).ToArray();
        if (values.Length == 0) return AuthenticateResult.NoResult();
        if (values.Length != 1 || string.IsNullOrWhiteSpace(values[0])) return AuthenticateResult.Fail("Invalid session cookie.");

        var sessions = Context.RequestServices.GetRequiredService<ISessionService>();
        var permissions = Context.RequestServices.GetRequiredService<IPermissionResolver>();
        var database = Context.RequestServices.GetRequiredService<PropriumDbContext>();
        var result = await sessions.ValidateAsync(new RawSessionToken(values[0]), Context.RequestAborted);
        if (!result.IsValid || result.User is null || result.Session is null)
        {
            await RecordRejectionAsync(database, result);
            return AuthenticateResult.Fail("Invalid session.");
        }

        var permissionContext = await permissions.ResolveAsync(result.User.Id, result.User.SecurityVersion, Context.RequestAborted);
        var roles = await ResolveRolesAsync(database, result.User.Id, Context.RequestAborted);
        var authenticated = new AuthenticatedRequest(result.User.Id, result.User.Username, result.User.DisplayName, result.Session.Id, result.User.SecurityVersion, roles, permissionContext);
        Context.Features.Set(authenticated);
        var identity = new ClaimsIdentity(
        [
            new Claim(PropriumClaims.UserId, authenticated.UserId.ToString("D")),
            new Claim(PropriumClaims.Username, authenticated.Username),
            new Claim(PropriumClaims.SessionId, authenticated.SessionId.ToString("D")),
            new Claim(PropriumClaims.SecurityVersion, authenticated.SecurityVersion.ToString(System.Globalization.CultureInfo.InvariantCulture)),
            .. authenticated.Roles.Select(role => new Claim(ClaimTypes.Role, role))
        ], SchemeName);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName));
    }

    private static async Task<IReadOnlyList<string>> ResolveRolesAsync(PropriumDbContext database, Guid userId, CancellationToken cancellationToken)
    {
        return await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToArrayAsync(
            database.UserRoles.Where(assignment => assignment.UserId == userId).Select(assignment => assignment.Role.Name).Distinct(), cancellationToken);
    }

    private async Task RecordRejectionAsync(PropriumDbContext database, SessionValidationResult result)
    {
        try
        {
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(
                AuthenticationEventType.SessionRejected,
                AuthenticationEventOutcome.Denied,
                Context.TraceIdentifier,
                result.User?.Id,
                result.Session?.Id,
                result.User?.NormalizedUsername,
                result.Outcome.ToString().ToLowerInvariant()));
            await database.SaveChangesAsync(Context.RequestAborted);
        }
        catch (OperationCanceledException) when (Context.RequestAborted.IsCancellationRequested) { throw; }
        catch { }
    }
}
