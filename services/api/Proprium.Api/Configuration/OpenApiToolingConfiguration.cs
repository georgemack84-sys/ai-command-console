using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Primitives;

namespace Proprium.Api.Configuration;

internal static class OpenApiToolingConfiguration
{
    public static void AddSyntheticProvider(IConfigurationBuilder configuration) =>
        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["POSTGRES_HOST"] = "postgres.openapi.invalid",
            ["POSTGRES_PORT"] = "5432",
            ["POSTGRES_DATABASE"] = "openapi_metadata_only",
            ["POSTGRES_USER"] = "openapi_metadata_only",
            ["POSTGRES_PASSWORD"] = "synthetic-not-connected",
            ["REDIS_HOST"] = "redis.openapi.invalid",
            ["REDIS_PORT"] = "6379",
            ["SESSION_TOKEN_DIGEST_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
            ["SESSION_LIFETIME_MINUTES"] = "480",
            ["AUTH_ALLOWED_ORIGIN"] = "https://web.openapi.invalid",
            ["LOGIN_RATE_LIMIT_PRIVACY_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        });

    public static void AddMetadataServices(IServiceCollection services)
    {
        services.AddSingleton<OpenApiToolingEndpointDataSource>();
        services.AddSingleton<EndpointDataSource>(provider =>
            provider.GetRequiredService<OpenApiToolingEndpointDataSource>());
    }
}

internal sealed class OpenApiToolingEndpointDataSource : EndpointDataSource
{
    private IReadOnlyList<Endpoint> endpoints = [];

    public override IReadOnlyList<Endpoint> Endpoints => endpoints;

    public void Capture(IEndpointRouteBuilder routes)
    {
        var captured = routes.DataSources.SelectMany(source => source.Endpoints).ToArray();
        if (captured.Length == 0)
            throw new InvalidOperationException("OpenAPI tooling captured no endpoint metadata.");

        endpoints = captured;
    }

    public override IChangeToken GetChangeToken() => new CancellationChangeToken(CancellationToken.None);
}
