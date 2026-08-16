using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using PropriumSessionOptions = Proprium.Infrastructure.Configuration.SessionOptions;

namespace Proprium.Api.Configuration;

public sealed class AuthenticationCookiePolicy(IHostEnvironment environment, IOptions<PropriumSessionOptions> sessions, TimeProvider timeProvider)
{
    public const string ProductionCookieName = "__Host-proprium_session";
    public const string DevelopmentCookieName = "proprium_session";

    public string Name => environment.IsProduction() ? ProductionCookieName : DevelopmentCookieName;

    public CookieOptions BuildOptions() => new()
    {
        HttpOnly = true,
        Secure = environment.IsProduction(),
        SameSite = SameSiteMode.Lax,
        Path = "/",
        MaxAge = sessions.Value.Lifetime,
        Expires = timeProvider.GetUtcNow().Add(sessions.Value.Lifetime)
    };

    public void Append(HttpResponse response, RawSessionToken token) => response.Cookies.Append(Name, token.Value, BuildOptions());

    public void Clear(HttpResponse response)
    {
        var options = BuildOptions();
        options.Expires = DateTimeOffset.UnixEpoch;
        options.MaxAge = TimeSpan.Zero;
        response.Cookies.Delete(Name, options);
    }
}
