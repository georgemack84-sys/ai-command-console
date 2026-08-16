using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Writers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Proprium.Api.Configuration;
using Proprium.Api.Endpoints;
using Proprium.Api.Middleware;
using Proprium.Api.OpenApi;
using Proprium.Api.Security;
using Proprium.Application.Authentication;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Health;
using Proprium.Domain.Identity;
using Swashbuckle.AspNetCore.Swagger;

if (args.Contains("--health-probe", StringComparer.Ordinal))
{
    var probeUrl = args.SkipWhile(argument => argument != "--health-probe").Skip(1).FirstOrDefault() ?? "http://127.0.0.1:8080/api/v1/health/live";
    using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
    try
    {
        var response = await client.GetAsync(probeUrl);
        Environment.ExitCode = response.IsSuccessStatusCode ? 0 : 1;
    }
    catch (HttpRequestException)
    {
        Environment.ExitCode = 1;
    }

    return;
}

var permissionExport = args.SkipWhile(argument => argument != "--export-permissions").Skip(1).FirstOrDefault();
if (permissionExport is not null)
{
    var directory = Path.GetDirectoryName(Path.GetFullPath(permissionExport));
    if (directory is not null) Directory.CreateDirectory(directory);
    var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    await File.WriteAllTextAsync(permissionExport, JsonSerializer.Serialize(PermissionCatalog.All, options) + "\n");
    return;
}

var openApiOutput = args.SkipWhile(argument => argument != "--write-openapi").Skip(1).FirstOrDefault();
var approvedConfigurationArguments = ApiConfigurationSources.ApprovedConfigurationArguments(args);
var builder = WebApplication.CreateBuilder(args);
ApiConfigurationSources.Configure(
    builder.Configuration,
    builder.Environment.ContentRootPath,
    builder.Environment.EnvironmentName,
    approvedConfigurationArguments,
    openApiOutput is null ? null : OpenApiToolingConfiguration.AddSyntheticProvider);

var configuration = ApiConfiguration.Resolve(builder.Configuration, builder.Environment.EnvironmentName);

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Services.AddProblemDetails();
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow);
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddHealthChecks()
    .AddCheck<PostgresReadinessHealthCheck>("postgres", tags: ["ready"])
    .AddCheck<RedisReadinessHealthCheck>("redis", tags: ["ready"]);
builder.Services.AddPropriumConfiguration(configuration);
builder.Services.AddPropriumInfrastructure();
builder.Services.AddSingleton<Proprium.Infrastructure.ISystemClock, Proprium.Infrastructure.SystemClock>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<AuthenticationCookiePolicy>();
builder.Services.AddSingleton<OriginValidator>();
builder.Services.AddSingleton<CsrfHeaderValidator>();
builder.Services.AddSingleton<AuthenticationRequestPolicy>();
builder.Services.AddSingleton<ILoginSourceResolver, DirectLoginSourceResolver>();
builder.Services.AddCors(options => options.AddPolicy("PropriumOrigins", policy => policy
    .WithOrigins(configuration.Authentication.AllowedOrigin)
    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
    .WithHeaders("Content-Type", CsrfHeaderValidator.HeaderName)
    .AllowCredentials()));
builder.Services.AddAuthentication(PropriumSessionAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, PropriumSessionAuthenticationHandler>(PropriumSessionAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Proprium API", Version = "v1" });
    options.AddSecurityDefinition(CookieAuthenticationOperationFilter.SchemeName, new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Cookie,
        Name = AuthenticationCookiePolicy.ProductionCookieName,
        Description = "Opaque HttpOnly session cookie. Non-production environments use proprium_session."
    });
    options.OperationFilter<CookieAuthenticationOperationFilter>();
});
if (openApiOutput is not null) OpenApiToolingConfiguration.AddMetadataServices(builder.Services);

var app = builder.Build();

if (openApiOutput is not null)
{
    app.MapPlatformEndpoints();
    app.Services.GetRequiredService<OpenApiToolingEndpointDataSource>().Capture(app);
    var directory = Path.GetDirectoryName(Path.GetFullPath(openApiOutput));
    if (directory is not null) Directory.CreateDirectory(directory);
    await using var stream = File.Create(openApiOutput);
    await using var textWriter = new StreamWriter(stream);
    var writer = new OpenApiJsonWriter(textWriter);
    app.Services.GetRequiredService<ISwaggerProvider>().GetSwagger("v1").SerializeAsV3(writer);
    await textWriter.FlushAsync();

    return;
}

if (args.Contains("--migrate", StringComparer.Ordinal))
{
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<PropriumDbContext>();
    await database.Database.MigrateAsync();
    if (!await database.PlatformMetadata.AnyAsync(metadata => metadata.Key == "platform"))
    {
        database.PlatformMetadata.Add(new() { Key = "platform", Value = "Proprium" });
        await database.SaveChangesAsync();
    }
    await AuthorizationSeeder.SeedAsync(database);
    var localAdministrator = configuration.LocalAdministrator;
    LocalAdministratorPolicy.EnsurePermitted(localAdministrator.Enabled, app.Environment.IsDevelopment());
    if (localAdministrator.Enabled)
    {
        if (string.IsNullOrWhiteSpace(localAdministrator.Username) || string.IsNullOrWhiteSpace(localAdministrator.Password))
            throw new InvalidOperationException("Enabled local-administrator initialization requires validated credentials.");
        await scope.ServiceProvider.GetRequiredService<LocalAdministratorInitializer>().InitializeAsync(localAdministrator.Username, localAdministrator.Password);
    }
    return;
}

app.UseMiddleware<CorrelationMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/v1/auth")) context.Response.Headers.CacheControl = "no-store";
    await next();
});
if (app.Environment.IsDevelopment()) app.UseSwaggerUI();
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.UseCors("PropriumOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapPlatformEndpoints();
app.Run();

public partial class Program;
