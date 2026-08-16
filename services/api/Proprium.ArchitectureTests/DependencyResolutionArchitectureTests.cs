using System.Reflection;
using System.Reflection.Emit;
using Microsoft.Extensions.DependencyInjection;
using Proprium.Api.Security;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Retry;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Architecture")]
public sealed class DependencyResolutionArchitectureTests
{
    private static readonly IReadOnlyDictionary<short, OpCode> OpCodesByValue = typeof(OpCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.FieldType == typeof(OpCode))
        .Select(field => field.GetValue(null) is OpCode opCode
            ? opCode
            : throw new InvalidOperationException($"Unable to read {field.Name}."))
        .ToDictionary(opCode => opCode.Value);

    [Fact]
    public void Application_public_contracts_expose_no_container_types()
    {
        var offenders = ArchitectureRules.ContainerSignatureViolations(ArchitectureDefinitions.ApplicationAssembly);

        Assert.True(offenders.Length == 0, string.Join(Environment.NewLine, offenders));
    }

    [Fact]
    public void Domain_public_contracts_expose_no_container_types()
    {
        var offenders = ArchitectureRules.ContainerSignatureViolations(ArchitectureDefinitions.DomainAssembly);

        Assert.True(offenders.Length == 0, string.Join(Environment.NewLine, offenders));
    }

    [Fact]
    public void Domain_and_application_expose_no_generic_service_resolvers()
    {
        var offenders = new[]
        {
            ArchitectureDefinitions.DomainAssembly,
            ArchitectureDefinitions.ApplicationAssembly,
        }.SelectMany(ArchitectureRules.GenericResolverViolations).ToArray();

        Assert.True(offenders.Length == 0, string.Join(Environment.NewLine, offenders));
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
