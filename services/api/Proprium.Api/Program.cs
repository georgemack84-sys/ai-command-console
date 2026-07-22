using Microsoft.AspNetCore.Diagnostics;
using Microsoft.OpenApi.Models;
using Microsoft.OpenApi.Writers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Proprium.Api.Configuration;
using Proprium.Api.Endpoints;
using Proprium.Api.Middleware;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Configuration;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Health;
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
        ["REDIS_PORT"] = "6379"
    });
}

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Services.AddProblemDetails();
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
builder.Services.AddPropriumInfrastructure();
builder.Services.AddSingleton<ISystemClock, SystemClock>();
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
    return;
}

app.UseMiddleware<CorrelationMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
if (app.Environment.IsDevelopment()) app.UseSwaggerUI();
app.UseSwagger(options => options.RouteTemplate = "openapi/{documentName}.json");
app.MapPlatformEndpoints();
app.Run();

public partial class Program;
