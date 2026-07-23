using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Persistence;

public sealed class LocalAdministratorInitializer(PropriumDbContext database, IPasswordHasher<User> passwordHasher)
{
    public async Task InitializeAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Local administrator username and password are required.");
        var normalized = IdentityNormalization.NormalizeUsername(username);
        var user = await database.Users.SingleOrDefaultAsync(item => item.NormalizedUsername == normalized, cancellationToken);
        if (user is null)
        {
            user = new User { Username = username.Trim(), NormalizedUsername = normalized, DisplayName = username.Trim() };
            user.PasswordHash = passwordHasher.HashPassword(user, password);
            database.Users.Add(user);
        }
        var administrator = await database.Roles.SingleAsync(item => item.NormalizedName == "ADMINISTRATOR", cancellationToken);
        if (!await database.UserRoles.AnyAsync(item => item.UserId == user.Id && item.RoleId == administrator.Id, cancellationToken))
            database.UserRoles.Add(new UserRole { User = user, Role = administrator });
        await database.SaveChangesAsync(cancellationToken);
    }
}
