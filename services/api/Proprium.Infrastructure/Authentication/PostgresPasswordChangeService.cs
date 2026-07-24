using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresPasswordChangeService(PropriumDbContext database, IUserPasswordHasher passwords) : IPasswordChangeService
{
    public async Task ChangeAsync(Guid userId, string newPassword, string correlationId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword)) throw new ArgumentException("A new password is required.", nameof(newPassword));
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var user = await database.Users.SingleOrDefaultAsync(item => item.Id == userId, cancellationToken) ?? throw new InvalidOperationException("The user does not exist.");
        user.PasswordHash = passwords.Hash(user, newPassword);
        user.SecurityVersion++;
        database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(AuthenticationEventType.SecurityVersionInvalidated, AuthenticationEventOutcome.Success, correlationId, user.Id, normalizedUsername: user.NormalizedUsername, reasonCode: "password-change"));
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
