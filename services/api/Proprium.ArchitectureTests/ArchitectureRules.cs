using System.Reflection;
using System.Reflection.Emit;
using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
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

    internal static string[] MigrationOwnershipViolations(IEnumerable<(Assembly Assembly, string Owner)> assemblies) =>
        assemblies
            .SelectMany(entry => entry.Assembly.GetTypes()
                .Where(type => !IsGenerated(type) &&
                    (typeof(Migration).IsAssignableFrom(type) || typeof(ModelSnapshot).IsAssignableFrom(type)))
                .Where(type => entry.Assembly != ArchitectureDefinitions.InfrastructureAssembly ||
                    type.Namespace != $"{ArchitectureDefinitions.InfrastructureNamespace}.Persistence")
                .Select(type => $"{type.FullName} is a migration artifact in {entry.Owner}; only " +
                    $"{ArchitectureDefinitions.InfrastructureNamespace}.Persistence may own EF migrations and snapshots."))
            .Order(StringComparer.Ordinal)
            .ToArray();

    internal static string[] DbContextOwnershipViolations(IEnumerable<(Assembly Assembly, string Owner)> assemblies) =>
        assemblies
            .SelectMany(entry => entry.Assembly.GetTypes()
                .Where(type => !IsGenerated(type) && typeof(DbContext).IsAssignableFrom(type))
                .Where(type => entry.Assembly != ArchitectureDefinitions.InfrastructureAssembly ||
                    type.Namespace != $"{ArchitectureDefinitions.InfrastructureNamespace}.Persistence")
                .Select(type => $"{type.FullName} is a DbContext in {entry.Owner}; only " +
                    $"{ArchitectureDefinitions.InfrastructureNamespace}.Persistence may own DbContexts."))
            .Order(StringComparer.Ordinal)
            .ToArray();

    internal static string[] EndpointPublicSignatureViolations(IEnumerable<Type> endpointTypes) =>
        endpointTypes
            .SelectMany(type => PublicSignatureTypes(type)
                .Where(signatureType => signatureType.Namespace?.StartsWith(
                    ArchitectureDefinitions.InfrastructureNamespace,
                    StringComparison.Ordinal) == true)
                .Select(signatureType => $"{type.FullName} exposes infrastructure type {signatureType.FullName}."))
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();

    internal static string[] ServiceLocatorCallViolations(
        IEnumerable<Assembly> assemblies,
        IReadOnlySet<Type> approvedOwners) =>
        assemblies
            .SelectMany(assembly => assembly.GetTypes())
            .SelectMany(type => AllMethods(type).Select(method => (Owner: SourceOwner(type), Method: method)))
            .Where(entry => !approvedOwners.Contains(entry.Owner))
            .SelectMany(entry => CalledMethods(entry.Method)
                .Where(IsServiceLocatorMethod)
                .Select(called => $"{entry.Owner.FullName}.{entry.Method.Name} calls {called.DeclaringType?.FullName}.{called.Name}"))
            .Distinct(StringComparer.Ordinal)
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

    private static IEnumerable<MethodBase> AllMethods(Type type) =>
        type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Cast<MethodBase>()
            .Concat(type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static));

    private static Type SourceOwner(Type type)
    {
        while (type.DeclaringType is not null) type = type.DeclaringType;
        return type;
    }

    private static bool IsServiceLocatorMethod(MethodBase method) =>
        method.DeclaringType == typeof(IServiceProvider) && method.Name == nameof(IServiceProvider.GetService) ||
        method.DeclaringType?.Namespace == "Microsoft.Extensions.DependencyInjection" &&
            method.Name is "GetService" or "GetRequiredService" or "CreateScope" or "CreateAsyncScope" ||
        method.DeclaringType?.Namespace == "Microsoft.AspNetCore.Http" && method.Name == "get_RequestServices";

    private static IEnumerable<MethodBase> CalledMethods(MethodBase method)
    {
        var body = method.GetMethodBody();
        if (body?.GetILAsByteArray() is not { } il) yield break;
        for (var offset = 0; offset < il.Length;)
        {
            var first = il[offset++];
            var value = first == 0xfe ? (short)(0xfe00 | il[offset++]) : first;
            if (!OpCodesByValue.TryGetValue(value, out var opCode)) yield break;
            if (opCode.OperandType == OperandType.InlineMethod)
            {
                var token = BitConverter.ToInt32(il, offset);
                MethodBase? called = null;
                try
                {
                    called = method.Module.ResolveMethod(
                        token,
                        method.DeclaringType?.GetGenericArguments(),
                        method is MethodInfo methodInfo ? methodInfo.GetGenericArguments() : null);
                }
                catch (ArgumentException)
                {
                    // Generic calls can be unresolved in structural inspection.
                }

                if (called is not null) yield return called;
            }

            offset += OperandSize(opCode.OperandType, il, offset);
        }
    }

    private static int OperandSize(OperandType operandType, byte[] il, int offset) => operandType switch
    {
        OperandType.InlineNone => 0,
        OperandType.ShortInlineBrTarget or OperandType.ShortInlineI or OperandType.ShortInlineVar => 1,
        OperandType.InlineVar => 2,
        OperandType.InlineI or OperandType.InlineBrTarget or OperandType.InlineField or OperandType.InlineMethod
            or OperandType.InlineSig or OperandType.InlineString or OperandType.InlineTok or OperandType.InlineType
            or OperandType.ShortInlineR => 4,
        OperandType.InlineI8 or OperandType.InlineR => 8,
        OperandType.InlineSwitch => 4 + (BitConverter.ToInt32(il, offset) * 4),
        _ => throw new InvalidOperationException($"Unsupported IL operand type {operandType}.")
    };

    private static readonly IReadOnlyDictionary<short, OpCode> OpCodesByValue = typeof(OpCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.FieldType == typeof(OpCode))
        .Select(field => field.GetValue(null) is OpCode opCode
            ? opCode
            : throw new InvalidOperationException($"Unable to read {field.Name}."))
        .ToDictionary(opCode => opCode.Value);
}
