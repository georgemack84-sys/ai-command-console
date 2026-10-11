namespace Proprium.Contracts.V1;

public sealed record LoginRequest(string? Username, string? Password)
{
    public override string ToString() => $"{nameof(LoginRequest)} {{ Username = [REDACTED], Password = [REDACTED] }}";
}
public sealed record RegisterAccountRequest(string? Username, string? DisplayName, string? Password)
{
    public override string ToString() => $"{nameof(RegisterAccountRequest)} {{ Username = [REDACTED], DisplayName = [REDACTED], Password = [REDACTED] }}";
}
public sealed record CurrentUserResponse(Guid UserId, string Username, string DisplayName, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);
public sealed record UpdateProfileRequest(string? DisplayName);
public sealed record RecoveryContactResponse(string? MaskedEmail, bool IsVerified, bool VerificationPending);
public sealed record BeginRecoveryContactVerificationRequest(string? Email, string? CurrentPassword)
{
    public override string ToString() => $"{nameof(BeginRecoveryContactVerificationRequest)} {{ Email = [REDACTED], CurrentPassword = [REDACTED] }}";
}
public sealed record CompleteRecoveryContactVerificationRequest(string? Token)
{
    public override string ToString() => $"{nameof(CompleteRecoveryContactVerificationRequest)} {{ Token = [REDACTED] }}";
}
