using Microsoft.AspNetCore.Identity;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Authentication;

public sealed class UserPasswordHasher(IPasswordHasher<User> passwordHasher) : IUserPasswordHasher
{
    public string Hash(User user, string password)
    {
        ArgumentNullException.ThrowIfNull(user);
        if (string.IsNullOrWhiteSpace(password)) throw new ArgumentException("A password is required.", nameof(password));
        return passwordHasher.HashPassword(user, password);
    }

    public PasswordVerificationOutcome Verify(User user, string storedHash, string password)
    {
        ArgumentNullException.ThrowIfNull(user);
        if (string.IsNullOrWhiteSpace(storedHash) || string.IsNullOrWhiteSpace(password)) return PasswordVerificationOutcome.Failed;
        return passwordHasher.VerifyHashedPassword(user, storedHash, password) switch
        {
            PasswordVerificationResult.Success => PasswordVerificationOutcome.Success,
            PasswordVerificationResult.SuccessRehashNeeded => PasswordVerificationOutcome.SuccessRehashNeeded,
            _ => PasswordVerificationOutcome.Failed
        };
    }
}
