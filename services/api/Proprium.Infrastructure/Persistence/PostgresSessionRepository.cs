using Microsoft.EntityFrameworkCore;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;

namespace Proprium.Infrastructure.Persistence;

public sealed class PostgresSessionRepository(PropriumDbContext database) : ISessionRepository
{
    public async Task AddAsync(Session session, CancellationToken cancellationToken = default)
    {
        database.Sessions.Add(session);
        await database.SaveChangesAsync(cancellationToken);
    }

    public Task<Session?> FindByTokenHashAsync(SessionTokenHash tokenHash, CancellationToken cancellationToken = default) =>
        database.Sessions.AsNoTracking().Include(session => session.User).SingleOrDefaultAsync(session => session.TokenHash == tokenHash.Value, cancellationToken);

    public async Task RevokeAsync(Guid sessionId, DateTimeOffset revokedAtUtc, string reasonCode, CancellationToken cancellationToken = default)
    {
        await database.Sessions.Where(session => session.Id == sessionId && session.RevokedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.RevokedAtUtc, revokedAtUtc)
                .SetProperty(session => session.RevocationReason, reasonCode), cancellationToken);
    }

    public async Task RevokeAllForUserAsync(Guid userId, DateTimeOffset revokedAtUtc, string reasonCode, CancellationToken cancellationToken = default)
    {
        await database.Sessions.Where(session => session.UserId == userId && session.RevokedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.RevokedAtUtc, revokedAtUtc)
                .SetProperty(session => session.RevocationReason, reasonCode), cancellationToken);
    }

    public Task<int> CountExpiredAsync(DateTimeOffset nowUtc, CancellationToken cancellationToken = default) =>
        database.Sessions.CountAsync(session => session.ExpiresAtUtc <= nowUtc && session.RevokedAtUtc == null, cancellationToken);
}
