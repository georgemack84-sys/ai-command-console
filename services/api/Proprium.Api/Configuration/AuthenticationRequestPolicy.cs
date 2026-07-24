using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Primitives;
using Microsoft.Extensions.Options;

namespace Proprium.Api.Configuration;

public sealed class AuthenticationRequestOptions { [Required] public string AllowedOrigin { get; set; } = string.Empty; }

public sealed class OriginValidator(IOptions<AuthenticationRequestOptions> options)
{
    private readonly string allowedOrigin = Normalize(options.Value.AllowedOrigin);

    public bool IsAllowed(StringValues origins) => origins.Count == 1 && string.Equals(origins[0], allowedOrigin, StringComparison.Ordinal);

    public static string Normalize(string origin)
    {
        if (string.IsNullOrWhiteSpace(origin) || origin.Contains('*', StringComparison.Ordinal) || !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) || !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) || uri.AbsolutePath != "/")
            throw new ArgumentException("AUTH_ALLOWED_ORIGIN must be one absolute HTTP(S) origin without a path, query, fragment, user information, or wildcard.", nameof(origin));
        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }
}

public sealed class CsrfHeaderValidator
{
    public const string HeaderName = "X-Proprium-CSRF";
    public const string RequiredValue = "1";
    public bool IsValid(StringValues values) => values.Count == 1 && string.Equals(values[0], RequiredValue, StringComparison.Ordinal);
}

public sealed class AuthenticationRequestPolicy(OriginValidator origins, CsrfHeaderValidator csrf)
{
    public bool IsOriginAllowed(HttpRequest request) => origins.IsAllowed(request.Headers.Origin);
    public bool IsCsrfAllowed(HttpRequest request) => csrf.IsValid(request.Headers[CsrfHeaderValidator.HeaderName]);
    public bool IsAllowed(HttpRequest request) => IsOriginAllowed(request) && IsCsrfAllowed(request);
}
