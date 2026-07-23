namespace Proprium.Infrastructure.Persistence;

public static class LocalAdministratorPolicy
{
    public static void EnsurePermitted(bool enabled, bool isDevelopment)
    {
        if (enabled && !isDevelopment)
            throw new InvalidOperationException("Local administrator initialization is permitted only in Development.");
    }
}
