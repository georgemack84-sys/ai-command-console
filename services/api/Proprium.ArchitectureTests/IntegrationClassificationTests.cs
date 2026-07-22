using Proprium.IntegrationTests;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class IntegrationClassificationTests
{
    [Fact]
    public void Infrastructure_fixture_tests_are_classified_as_integration()
    {
        var violations = typeof(PlatformApiTests).Assembly
            .GetTypes()
            .Where(type => type.IsClass && type.GetInterfaces().Any(IsFixtureInterface))
            .Where(type => !type.CustomAttributes.Any(attribute =>
                attribute.AttributeType == typeof(TraitAttribute) &&
                attribute.ConstructorArguments.Count == 2 &&
                attribute.ConstructorArguments[0].Value as string == "Category" &&
                attribute.ConstructorArguments[1].Value as string == "Integration"))
            .Select(type => $"{type.FullName} uses IClassFixture<T> and requires [Trait(\"Category\", \"Integration\")].")
            .ToArray();

        Assert.True(violations.Length == 0, string.Join(Environment.NewLine, violations));
    }

    private static bool IsFixtureInterface(Type candidate) =>
        candidate.IsGenericType && candidate.GetGenericTypeDefinition() == typeof(IClassFixture<>);
}
