using System.Reflection;
using Proprium.Api;
using Proprium.Application;
using Proprium.Contracts.V1;
using Proprium.Domain;
using Proprium.Infrastructure;

namespace Proprium.ArchitectureTests;

internal static class ArchitectureDefinitions
{
    internal const string ApiNamespace = "Proprium.Api";
    internal const string ApplicationNamespace = "Proprium.Application";
    internal const string ContractsNamespace = "Proprium.Contracts.V1";
    internal const string DomainNamespace = "Proprium.Domain";
    internal const string InfrastructureNamespace = "Proprium.Infrastructure";

    internal static Assembly ApiAssembly => typeof(Program).Assembly;
    internal static Assembly ApplicationAssembly => typeof(ApplicationAssemblyMarker).Assembly;
    internal static Assembly ContractsAssembly => typeof(PlatformInfoResponse).Assembly;
    internal static Assembly DomainAssembly => typeof(DomainAssemblyMarker).Assembly;
    internal static Assembly InfrastructureAssembly => typeof(ServiceCollectionExtensions).Assembly;

    internal static IReadOnlyList<(Assembly Assembly, string Namespace)> ProductionLayers =>
    [
        (ApiAssembly, ApiNamespace),
        (ApplicationAssembly, ApplicationNamespace),
        (ContractsAssembly, ContractsNamespace),
        (DomainAssembly, DomainNamespace),
        (InfrastructureAssembly, InfrastructureNamespace),
    ];
}
