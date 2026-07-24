using System.Text.RegularExpressions;

namespace Proprium.Domain.Identity;

public sealed record PermissionDefinition(string Key, string Description, string CapabilityGroup);

public static partial class PermissionCatalog
{
    private static readonly IReadOnlyList<PermissionDefinition> Definitions =
    [
        new("identity.profile.read-self", "Read the current user's profile.", "identity"),
        new("identity.session.manage-self", "Manage the current user's sessions.", "identity"),
        new("application.authenticated.access", "Access authenticated application functionality.", "application"),
        new("identity.user.read", "Read users administratively.", "identity"),
        new("identity.user.manage", "Manage users administratively.", "identity"),
        new("identity.role.read", "Read roles administratively.", "identity"),
        new("identity.role-assignment.manage", "Manage user role assignments.", "identity"),
        new("identity.permission.read", "Read permissions administratively.", "identity"),
        new("identity.role-permission.manage", "Manage role permission assignments.", "identity"),
        new("identity.authentication-event.read", "Read authentication events administratively.", "identity")
    ];

    public static IReadOnlyList<PermissionDefinition> All { get; } = Validate(Definitions);

    private static IReadOnlyList<PermissionDefinition> Validate(IEnumerable<PermissionDefinition> definitions)
    {
        var ordered = definitions.OrderBy(item => item.Key, StringComparer.Ordinal).ToArray();
        if (ordered.Any(item => string.IsNullOrWhiteSpace(item.Key) || string.IsNullOrWhiteSpace(item.Description) || string.IsNullOrWhiteSpace(item.CapabilityGroup)) ||
            ordered.Any(item => !PermissionKeyPattern().IsMatch(item.Key)) ||
            ordered.Select(item => item.Key).Distinct(StringComparer.Ordinal).Count() != ordered.Length)
            throw new InvalidOperationException("The permission catalog contains an invalid definition.");
        return Array.AsReadOnly(ordered);
    }

    [GeneratedRegex("^[a-z][a-z0-9-]*(\\.[a-z][a-z0-9-]*){2,}$", RegexOptions.CultureInvariant)]
    private static partial Regex PermissionKeyPattern();
}
