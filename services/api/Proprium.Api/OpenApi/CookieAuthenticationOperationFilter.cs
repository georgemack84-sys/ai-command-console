using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Proprium.Api.OpenApi;

public sealed class CookieAuthenticationOperationFilter : IOperationFilter
{
    public const string SchemeName = "PropriumSession";

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var requiresAuthentication = context.ApiDescription.ActionDescriptor.EndpointMetadata
            .OfType<IAuthorizeData>()
            .Any();
        if (!requiresAuthentication) return;

        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                [new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = SchemeName
                    }
                }] = Array.Empty<string>()
            }
        ];
    }
}
