namespace Proprium.Contracts.V1;

public sealed record LoginRequest(string? Username, string? Password)
{
    public override string ToString() => $"{nameof(LoginRequest)} {{ Username = [REDACTED], Password = [REDACTED] }}";
}
public sealed record CurrentUserResponse(Guid UserId, string Username, string DisplayName, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);
