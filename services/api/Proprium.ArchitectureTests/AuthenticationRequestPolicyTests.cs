using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Proprium.Api.Configuration;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class AuthenticationRequestPolicyTests
{
    [Theory]
    [InlineData("http://localhost:3000/path")]
    [InlineData("https://user@example.test")]
    [InlineData("https://example.test?query=value")]
    [InlineData("https://example.test#fragment")]
    [InlineData("https://*.example.test")]
    [InlineData("ftp://example.test")]
    public void Configured_origin_must_be_an_exact_http_origin(string origin) =>
        Assert.Throws<ArgumentException>(() => OriginValidator.Normalize(origin));

    [Fact]
    public void Origin_and_csrf_headers_require_exact_single_values()
    {
        var origins = new OriginValidator(Options.Create(new AuthenticationRequestOptions { AllowedOrigin = "https://app.example.test" }));
        var csrf = new CsrfHeaderValidator();

        Assert.True(origins.IsAllowed(new StringValues("https://app.example.test")));
        Assert.False(origins.IsAllowed(new StringValues("https://app.example.test/")));
        Assert.False(origins.IsAllowed(new StringValues(["https://app.example.test", "https://app.example.test"])));
        Assert.True(csrf.IsValid(new StringValues("1")));
        Assert.False(csrf.IsValid(new StringValues("true")));
        Assert.False(csrf.IsValid(new StringValues(["1", "1"])));
    }
}
