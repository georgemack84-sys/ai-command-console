namespace Proprium.Contracts.V1;

public sealed record PlatformInfoResponse(string Name, string Version, string ApiVersion);

public sealed record HealthResponse(string Status, string CorrelationId);
