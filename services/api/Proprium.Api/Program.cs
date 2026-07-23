using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Writers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Api.Configuration;
using Proprium.Api.Endpoints;
using Proprium.Api.Middleware;
using Proprium.Api.Security;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Health;
using Proprium.Domain.Identity;
using Swashbuckle.AspNetCore.Swagger;
using PropriumSessionOptions = Proprium.Infrastructure.Configuration.SessionOptions;

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
var builder = WebApplication.CreateBuilder(args);
if (openApiOutput is not null)
{
    builder.WebHost.UseUrls("http://127.0.0.1:0");
    builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
    {
        ["POSTGRES_HOST"] = "openapi",
        ["POSTGRES_PORT"] = "5432",
        ["POSTGRES_DATABASE"] = "openapi",
        ["POSTGRES_USER"] = "openapi",
        ["POSTGRES_PASSWORD"] = "change-me",
        ["REDIS_HOST"] = "openapi",
        ["REDIS_PORT"] = "6379",
        ["SESSION_TOKEN_DIGEST_KEY"] = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        ["SESSION_LIFETIME_MINUTES"] = "480",
        ["AUTH_ALLOWED_ORIGIN"] = "http://localhost"
    });
}

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Services.AddProblemDetails();
builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow);
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddHealthChecks()
    .AddCheck<PostgresReadinessHealthCheck>("postgres", tags: ["ready"])
    .AddCheck<RedisReadinessHealthCheck>("redis", tags: ["ready"]);
builder.Services.AddOptions<PostgresOptions>().Configure(options =>
{
    options.Host = builder.Configuration["POSTGRES_HOST"] ?? string.Empty;
    options.Port = int.TryParse(builder.Configuration["POSTGRES_PORT"], out var port) ? port : 0;
    options.Database = builder.Configuration["POSTGRES_DATABASE"] ?? string.Empty;
    options.User = builder.Configuration["POSTGRES_USER"] ?? string.Empty;
    options.Password = builder.Configuration["POSTGRES_PASSWORD"] ?? string.Empty;
}).ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddOptions<RedisOptions>().Configure(options =>
{
    options.Host = builder.Configuration["REDIS_HOST"] ?? string.Empty;
    options.Port = int.TryParse(builder.Configuration["REDIS_PORT"], out var port) ? port : 0;
    options.Password = builder.Configuration["REDIS_PASSWORD"];
}).ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddOptions<PropriumSessionOptions>().Configure(options =>
{
    options.TokenDigestKey = builder.Configuration["SESSION_TOKEN_DIGEST_KEY"] ?? string.Empty;
    options.LifetimeMinutes = int.TryParse(builder.Configuration["SESSION_LIFETIME_MINUTES"], out var lifetime) ? lifetime : 0;
}).ValidateDataAnnotations().Validate(options =>
{
    try { options.GetTokenDigestKey(); return true; }
    catch { return false; }
}, "SESSION_TOKEN_DIGEST_KEY must be a base64-encoded key with at least 32 bytes.").ValidateOnStart();
builder.Services.AddOptions<AuthenticationRequestOptions>().Configure(options => options.AllowedOrigin = builder.Configuration["AUTH_ALLOWED_ORIGIN"] ?? string.Empty)
    .ValidateDataAnnotations().Validate(options =>
    {
        try { OriginValidator.Normalize(options.AllowedOrigin); return true; }
        catch { return false; }
    }, "AUTH_ALLOWED_ORIGIN must be an absolute HTTP(S) origin without a path, query, fragment, user information, or wildcard.").ValidateOnStart();
builder.Services.AddPropriumInfrastructure();
builder.Services.AddSingleton<Proprium.Infrastructure.ISystemClock, Proprium.Infrastructure.SystemClock>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<AuthenticationCookiePolicy>();
builder.Services.AddSingleton<OriginValidator>();
builder.Services.AddSingleton<CsrfHeaderValidator>();
builder.Services.AddSingleton<AuthenticationRequestPolicy>();
builder.Services.AddCors(options => options.AddPolicy("PropriumOrigins", policy => policy
    .WithOrigins(OriginValidator.Normalize(builder.Configuration["AUTH_ALLOWED_ORIGIN"] ?? string.Empty))
    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
    .WithHeaders("Content-Type", CsrfHeaderValidator.HeaderName)
    .AllowCredentials()));
builder.Services.AddAuthentication(PropriumSessionAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, PropriumSessionAuthenticationHandler>(PropriumSessionAuthenticationHandler.SchemeName, _ => { });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddOptions<PlatformOptions>().Bind(builder.Configuration.GetSection(PlatformOptions.SectionName)).ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => options.SwaggerDoc("v1", new OpenApiInfo { Title = "Proprium API", Version = "v1" }));

var app = builder.Build();

if (openApiOutput is not null)
{
    app.MapPlatformEndpoints();
    await app.StartAsync();
    try
    {
        var directory = Path.GetDirectoryName(Path.GetFullPath(openApiOutput));
        if (directory is not null) Directory.CreateDirectory(directory);
        await using var stream = File.Create(openApiOutput);
        await using var textWriter = new StreamWriter(stream);
        var writer = new OpenApiJsonWriter(textWriter);
        app.Services.GetRequiredService<ISwaggerProvider>().GetSwagger("v1").SerializeAsV3(writer);
        await textWriter.FlushAsync();
    }
    finally
    {
        await app.StopAsync();
    }

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
    var localAdminEnabled = bool.TryParse(builder.Configuration["LOCAL_ADMIN_ENABLED"], out var enabled) && enabled;
    LocalAdministratorPolicy.EnsurePermitted(localAdminEnabled, app.Environment.IsDevelopment());
    if (localAdminEnabled)
    {
        var username = builder.Configuration["LOCAL_ADMIN_USERNAME"];
        var password = builder.Configuration["LOCAL_ADMIN_PASSWORD"];
        await scope.ServiceProvider.GetRequiredService<LocalAdministratorInitializer>().InitializeAsync(username ?? string.Empty, password ?? string.Empty);
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
