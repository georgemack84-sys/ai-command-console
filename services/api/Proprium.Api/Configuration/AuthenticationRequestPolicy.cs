using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Options;

namespace Proprium.Api.Configuration;

public sealed class AuthenticationRequestOptions { [Required, Url] public string AllowedOrigin { get; set; } = string.Empty; }
public sealed class AuthenticationRequestPolicy(IOptions<AuthenticationRequestOptions> options)
{
    public const string CsrfHeaderName = "X-Proprium-CSRF";
    public bool IsAllowed(HttpRequest request) => string.Equals(request.Headers.Origin, options.Value.AllowedOrigin, StringComparison.Ordinal) && !string.IsNullOrWhiteSpace(request.Headers[CsrfHeaderName].FirstOrDefault());
}
