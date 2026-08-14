using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Proprium.Contracts.V1;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class PlatformApiTests(WebApplicationFactory<Program> factory) : IIntegrationTest, IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task V1_root_returns_only_the_v1_contract()
    {
        var response = await factory.CreateClient().GetAsync("/api/v1");
        var payload = await response.Content.ReadFromJsonAsync<PlatformInfoResponse>();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("v1", payload?.ApiVersion);
    }

    [Theory]
    [InlineData("/api/v1/health")]
    [InlineData("/api/v1/health/live")]
    [InlineData("/api/v1/health/ready")]
    public async Task Health_endpoints_are_operational(string path)
    {
        var response = await factory.CreateClient().GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Correlation_identifier_is_propagated()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("X-Correlation-ID", "d2719f8e-6776-4c0b-9b20-037c9e003e22");
        var response = await client.SendAsync(request);
        Assert.Equal("d2719f8e-6776-4c0b-9b20-037c9e003e22", response.Headers.GetValues("X-Correlation-ID").Single());
    }

    [Fact]
    public async Task OpenApi_is_generated_from_implementation()
    {
        var response = await factory.CreateClient().GetAsync("/openapi/v1.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("/api/v1/health/live", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Authentication_openapi_contract_has_no_success_body_for_login_or_logout()
    {
        var response = await factory.CreateClient().GetAsync("/openapi/v1.json");
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var paths = document.RootElement.GetProperty("paths");
        foreach (var route in new[] { "/api/v1/auth/login", "/api/v1/auth/logout" })
        {
            var success = paths.GetProperty(route).GetProperty("post").GetProperty("responses").GetProperty("204");
            Assert.False(success.TryGetProperty("content", out _));
        }

        var currentUser = paths.GetProperty("/api/v1/auth/me").GetProperty("get").GetProperty("responses").GetProperty("200");
        Assert.True(currentUser.TryGetProperty("content", out _));

        var loginResponses = paths.GetProperty("/api/v1/auth/login").GetProperty("post").GetProperty("responses");
        Assert.True(loginResponses.TryGetProperty("429", out _));
    }
}
