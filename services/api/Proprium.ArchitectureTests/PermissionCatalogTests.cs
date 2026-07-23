using Proprium.Domain.Identity;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class PermissionCatalogTests
{
    [Fact]
    public void Catalog_is_unique_complete_and_ordinally_sorted()
    {
        var catalog = PermissionCatalog.All;
        Assert.NotEmpty(catalog);
        Assert.Equal(catalog.Count, catalog.Select(item => item.Key).Distinct(StringComparer.Ordinal).Count());
        Assert.All(catalog, item =>
        {
            Assert.False(string.IsNullOrWhiteSpace(item.Key));
            Assert.False(string.IsNullOrWhiteSpace(item.Description));
            Assert.False(string.IsNullOrWhiteSpace(item.CapabilityGroup));
        });
        Assert.Equal(catalog.Select(item => item.Key).OrderBy(key => key, StringComparer.Ordinal), catalog.Select(item => item.Key));
    }
}
