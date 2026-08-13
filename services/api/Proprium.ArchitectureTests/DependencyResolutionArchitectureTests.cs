using System.Reflection;
using System.Reflection.Emit;
using Microsoft.Extensions.DependencyInjection;
using Proprium.Api.Security;
using Proprium.Application;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Retry;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class DependencyResolutionArchitectureTests
{
    private static readonly IReadOnlyDictionary<short, OpCode> OpCodesByValue = typeof(OpCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.FieldType == typeof(OpCode))
        .Select(field => (OpCode)field.GetValue(null)!)
        .ToDictionary(opCode => opCode.Value);

    [Fact]
    public void Application_public_contracts_expose_no_container_types()
    {
        var offenders = typeof(ApplicationAssemblyMarker).Assembly.ExportedTypes
            .SelectMany(PublicSignatureTypes)
            .Where(IsContainerType)
            .Select(type => type.FullName)
            .Distinct()
            .ToArray();

        Assert.Empty(offenders);
    }

    [Fact]
    public void Retry_executor_is_the_only_runtime_type_that_owns_a_scope_factory()
    {
        var owners = typeof(ServiceCollectionExtensions).Assembly.GetTypes()
            .Where(type => type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .SelectMany(constructor => constructor.GetParameters())
                .Any(parameter => parameter.ParameterType == typeof(IServiceScopeFactory)))
            .ToArray();

        Assert.Equal([typeof(RetryExecutor)], owners);
    }

    [Fact]
    public void Authentication_handler_contains_no_service_locator_calls()
    {
        var handlers = new[] { typeof(PropriumSessionAuthenticationHandler), typeof(PermissionAuthorizationHandler) };
        var forbidden = handlers
            .SelectMany(type => new[] { type }.Concat(type.GetNestedTypes(BindingFlags.NonPublic)))
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
            .SelectMany(CalledMethods)
            .Where(method => method.Name is "get_RequestServices" or "GetService" or "GetRequiredService")
            .Select(method => $"{method.DeclaringType?.FullName}.{method.Name}")
            .Distinct()
            .ToArray();

        Assert.Empty(forbidden);
    }

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

    private static IEnumerable<MethodBase> CalledMethods(MethodInfo method)
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
                try { called = method.Module.ResolveMethod(token, method.DeclaringType?.GetGenericArguments(), method.GetGenericArguments()); }
                catch (ArgumentException) { }
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
}
