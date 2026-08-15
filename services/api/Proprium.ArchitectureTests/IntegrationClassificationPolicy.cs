using System.Reflection;
using System.Reflection.Emit;
using Proprium.IntegrationTests;
using Xunit;

namespace Proprium.ArchitectureTests;

internal sealed class IntegrationClassificationPolicy(Type[] approvedFixtureTypes, Type[]? testAttributeTypes = null)
{
    internal const string CategoryName = "Category";
    internal const string ArchitectureCategory = "Architecture";
    internal const string IntegrationCategory = "Integration";
    internal const string UnitCategory = "Unit";

    private static readonly IReadOnlyDictionary<short, OpCode> OpCodesByValue = typeof(OpCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.FieldType == typeof(OpCode))
        .Select(field => (OpCode)field.GetValue(null)!)
        .ToDictionary(opCode => opCode.Value);

    private readonly Type[] _approvedFixtureTypes = approvedFixtureTypes;
    private readonly Type[] _testAttributeTypes = testAttributeTypes ?? [typeof(FactAttribute), typeof(TheoryAttribute)];

    internal string[] ValidateIntegrationAssembly(Assembly assembly) =>
        ValidateIntegrationTypes(TestTypes(assembly));

    internal string[] ValidateInfrastructureIndependentAssembly(Assembly assembly) =>
        ValidateInfrastructureIndependentTypes(TestTypes(assembly));

    internal string[] ValidateIntegrationTypes(IEnumerable<Type> types) =>
        types.SelectMany(ValidateIntegrationType).Order(StringComparer.Ordinal).ToArray();

    internal string[] ValidateInfrastructureIndependentTypes(IEnumerable<Type> types) =>
        types.SelectMany(ValidateInfrastructureIndependentType).Order(StringComparer.Ordinal).ToArray();

    private IEnumerable<Type> TestTypes(Assembly assembly) =>
        assembly.ExportedTypes.Where(type => type.IsClass && TestMethods(type).Length > 0);

    private MethodInfo[] TestMethods(Type type) =>
        type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Where(method => method.CustomAttributes.Any(attribute => _testAttributeTypes.Contains(attribute.AttributeType)))
            .ToArray();

    private IEnumerable<string> ValidateIntegrationType(Type type)
    {
        var methods = TestMethods(type);
        var evidence = InfrastructureEvidence(type);

        if (!typeof(IIntegrationTest).IsAssignableFrom(type))
            yield return $"{type.FullName}: infrastructure-dependent test class does not implement {nameof(IIntegrationTest)}.";
        if (evidence.Length == 0)
            yield return $"{type.FullName}: integration marker has no approved infrastructure evidence.";

        foreach (var method in methods)
        {
            var categories = EffectiveCategories(type, method);
            if (!categories.SetEquals([IntegrationCategory]))
                yield return $"{type.FullName}.{method.Name}: expected Category=Integration; found {Display(categories)}.";
        }
    }

    private IEnumerable<string> ValidateInfrastructureIndependentType(Type type)
    {
        if (typeof(IIntegrationTest).IsAssignableFrom(type))
            yield return $"{type.FullName}: infrastructure-independent test class must not implement {nameof(IIntegrationTest)}.";

        var evidence = InfrastructureEvidence(type);
        if (evidence.Length > 0)
            yield return $"{type.FullName}: unclassified infrastructure evidence: {string.Join(", ", evidence)}.";

        foreach (var method in TestMethods(type))
        {
            var categories = EffectiveCategories(type, method);
            if (categories.Count != 1 || (!categories.Contains(UnitCategory) && !categories.Contains(ArchitectureCategory)))
                yield return $"{type.FullName}.{method.Name}: expected exactly one of Category=Unit or Category=Architecture; found {Display(categories)}.";
        }
    }

    private string[] InfrastructureEvidence(Type type)
    {
        var fixtureEvidence = type.GetInterfaces()
            .Where(candidate => candidate.IsGenericType && candidate.GetGenericTypeDefinition() == typeof(IClassFixture<>))
            .Select(candidate => candidate.GetGenericArguments()[0])
            .Concat(type.GetConstructors().SelectMany(constructor => constructor.GetParameters()).Select(parameter => parameter.ParameterType))
            .Where(IsApprovedFixture)
            .Select(candidate => $"fixture {candidate.FullName}");

        var callEvidence = ImplementationTypes(type)
            .SelectMany(candidate => candidate.GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
            .SelectMany(CalledMethods)
            .Where(IsInfrastructureCall)
            .Select(method => $"call {method.DeclaringType?.FullName}.{method.Name}");

        return fixtureEvidence.Concat(callEvidence).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
    }

    private static IEnumerable<Type> ImplementationTypes(Type type)
    {
        yield return type;
        foreach (var nested in type.GetNestedTypes(BindingFlags.Public | BindingFlags.NonPublic).SelectMany(ImplementationTypes))
            yield return nested;
    }

    private bool IsApprovedFixture(Type candidate) =>
        _approvedFixtureTypes.Any(approved => approved == candidate || approved.IsAssignableFrom(candidate));

    private static bool IsInfrastructureCall(MethodBase method)
    {
        var assemblyName = method.Module.Assembly.GetName().Name;
        var configuresPostgres = assemblyName?.StartsWith("Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.Ordinal) == true &&
            method.Name == "UseNpgsql";
        var connectsToRedis = assemblyName?.StartsWith("StackExchange.Redis", StringComparison.Ordinal) == true &&
            method.DeclaringType?.Name == "ConnectionMultiplexer" &&
            method.Name is "Connect" or "ConnectAsync";
        return configuresPostgres || connectsToRedis;
    }

    private static HashSet<string> EffectiveCategories(Type type, MethodInfo method) =>
        CategoryTraits(type.CustomAttributes).Concat(CategoryTraits(method.CustomAttributes)).ToHashSet(StringComparer.Ordinal);

    private static IEnumerable<string> CategoryTraits(IEnumerable<CustomAttributeData> attributes) =>
        attributes
            .Where(attribute => attribute.AttributeType == typeof(TraitAttribute) &&
                attribute.ConstructorArguments.Count == 2 &&
                attribute.ConstructorArguments[0].Value as string == CategoryName)
            .Select(attribute => attribute.ConstructorArguments[1].Value as string)
            .OfType<string>();

    private static string Display(IReadOnlyCollection<string> categories) =>
        categories.Count == 0 ? "no category" : string.Join(", ", categories.Order(StringComparer.Ordinal));

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
