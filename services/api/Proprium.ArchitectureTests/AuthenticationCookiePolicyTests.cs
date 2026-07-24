using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Proprium.Api.Configuration;
using Proprium.Infrastructure.Configuration;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class AuthenticationCookiePolicyTests
{
    [Fact]
    public void Production_cookie_uses_the_locked_host_prefix_security_attributes()
    {
        var policy = CreatePolicy(Environments.Production);
        var options = policy.BuildOptions();

        Assert.Equal(AuthenticationCookiePolicy.ProductionCookieName, policy.Name);
        Assert.True(options.HttpOnly);
        Assert.True(options.Secure);
        Assert.Equal(SameSiteMode.Lax, options.SameSite);
        Assert.Equal("/", options.Path);
        Assert.Null(options.Domain);
    }

    [Fact]
    public void Development_cookie_keeps_http_compatibility_without_weakening_other_attributes()
    {
        var policy = CreatePolicy(Environments.Development);
        var options = policy.BuildOptions();

        Assert.Equal(AuthenticationCookiePolicy.DevelopmentCookieName, policy.Name);
        Assert.True(options.HttpOnly);
        Assert.False(options.Secure);
        Assert.Equal(SameSiteMode.Lax, options.SameSite);
        Assert.Equal("/", options.Path);
        Assert.Null(options.Domain);
    }

    private static AuthenticationCookiePolicy CreatePolicy(string environmentName) => new(
        new TestHostEnvironment { EnvironmentName = environmentName },
        Options.Create(new SessionOptions { TokenDigestKey = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=", LifetimeMinutes = 480 }),
        TimeProvider.System);

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Proprium";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
