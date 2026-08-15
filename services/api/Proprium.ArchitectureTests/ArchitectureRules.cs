using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.DependencyInjection;

namespace Proprium.ArchitectureTests;

internal static class ArchitectureRules
{
    internal static string[] NamespaceViolations(
        Assembly assembly,
        string namespaceRoot,
        params Type[] allowedTypes) =>
        NamespaceViolations(assembly.GetTypes(), namespaceRoot, allowedTypes);

    internal static string[] NamespaceViolations(
        IEnumerable<Type> types,
        string namespaceRoot,
        params Type[] allowedTypes) =>
        types
            .Where(type => !IsGenerated(type))
            .Except(allowedTypes)
            .Where(type => type.Namespace is null ||
                !(type.Namespace == namespaceRoot || type.Namespace.StartsWith($"{namespaceRoot}.", StringComparison.Ordinal)))
            .Select(type => type.FullName ?? type.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();

    internal static string[] ContainerSignatureViolations(Assembly assembly) =>
        ContainerSignatureViolations(assembly.ExportedTypes);

    internal static string[] ContainerSignatureViolations(IEnumerable<Type> types) =>
        types
            .SelectMany(type => PublicSignatureTypes(type)
                .Where(IsContainerType)
                .Select(container => $"{type.FullName} exposes {container.FullName}"))
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();

    internal static string[] GenericResolverViolations(Assembly assembly) =>
        GenericResolverViolations(assembly.ExportedTypes);

    internal static string[] GenericResolverViolations(IEnumerable<Type> types) =>
        types
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .Where(method => method.IsGenericMethodDefinition &&
                    method.GetGenericArguments().Length == 1 &&
                    method.ReturnType == method.GetGenericArguments()[0] &&
                    method.GetParameters().Length == 0 &&
                    method.Name is "Resolve" or "GetService" or "GetRequiredService")
                .Select(method => $"{type.FullName}.{method.Name}<T>()"))
            .Order(StringComparer.Ordinal)
            .ToArray();

    private static IEnumerable<Type> PublicSignatureTypes(Type type)
    {
        foreach (var constructor in type.GetConstructors())
            foreach (var parameter in constructor.GetParameters())
                foreach (var signatureType in Flatten(parameter.ParameterType)) yield return signatureType;

        foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
        {
            foreach (var signatureType in Flatten(method.ReturnType)) yield return signatureType;
            foreach (var parameter in method.GetParameters())
                foreach (var signatureType in Flatten(parameter.ParameterType)) yield return signatureType;
        }

        foreach (var property in type.GetProperties())
            foreach (var signatureType in Flatten(property.PropertyType)) yield return signatureType;
        foreach (var field in type.GetFields())
            foreach (var signatureType in Flatten(field.FieldType)) yield return signatureType;
    }

    private static IEnumerable<Type> Flatten(Type type)
    {
        yield return type;
        if (type.HasElementType && type.GetElementType() is { } element)
            foreach (var nested in Flatten(element)) yield return nested;
        foreach (var argument in type.GetGenericArguments())
            foreach (var nested in Flatten(argument)) yield return nested;
    }

    private static bool IsContainerType(Type type) => type == typeof(IServiceProvider)
        || type.FullName is "Microsoft.Extensions.DependencyInjection.IServiceScope" or "Microsoft.Extensions.DependencyInjection.IServiceScopeFactory";

    private static bool IsGenerated(Type type) =>
        type.IsDefined(typeof(CompilerGeneratedAttribute), inherit: false) ||
        type.DeclaringType is not null && IsGenerated(type.DeclaringType) ||
        type.Name.StartsWith("<", StringComparison.Ordinal) ||
        type.Name.StartsWith("<>z__", StringComparison.Ordinal) ||
        type.Namespace?.StartsWith("System.Text.RegularExpressions.Generated", StringComparison.Ordinal) == true;
}
