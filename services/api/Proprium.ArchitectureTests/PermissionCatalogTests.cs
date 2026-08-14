using Proprium.Api.Security;
using Proprium.Domain.Identity;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
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

    [Fact]
    public void Canonical_endpoint_references_are_catalog_members()
    {
        var reference = PermissionCatalog.Identity.ProfileReadSelf;
        Assert.Contains(PermissionCatalog.All, item => item.Key == reference.Key);
        Assert.Equal("identity.profile.read-self", reference.Key);
    }

    [Fact]
    public void Unknown_permission_reference_is_rejected()
    {
        var unknown = new PermissionDefinition("identity.unknown.read", "Unknown permission.", "identity");
        Assert.Throws<ArgumentException>(() => new PermissionRequirement(unknown));
    }
}
