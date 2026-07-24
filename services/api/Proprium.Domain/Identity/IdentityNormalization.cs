namespace Proprium.Domain.Identity;

public static class IdentityNormalization
{
    public static string NormalizeUsername(string username) => Normalize(username, "username");

    public static string NormalizeRoleName(string roleName) => Normalize(roleName, "role name");

    private static string Normalize(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException($"A {fieldName} is required.", nameof(value));
        return value.Trim().ToUpperInvariant();
    }
}
