using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Proprium.Application.Authentication;
using Proprium.Application.Retry;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Retry;

internal sealed record SessionPersistenceAttempt(
    RetryAttemptContext Context,
    ISessionRepository Sessions) : ISessionPersistenceAttempt;

internal sealed class SessionPersistenceAttemptFactory(
    PropriumDbContext database,
    ISessionRepository sessions) : IRetryAttemptFactory<ISessionPersistenceAttempt>
{
    private IDbContextTransaction? _transaction;

    public ISessionPersistenceAttempt Create(RetryAttemptContext context) =>
        new SessionPersistenceAttempt(context, sessions);

    public async Task BeginTransactionAsync(IsolationLevel isolationLevel, CancellationToken cancellationToken)
    {
        if (_transaction is not null) throw new InvalidOperationException("The retry attempt already owns a transaction.");
        _transaction = await database.Database.BeginTransactionAsync(isolationLevel, cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken)
    {
        if (_transaction is null) throw new InvalidOperationException("The retry attempt does not own a transaction.");
        await _transaction.CommitAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken)
    {
        if (_transaction is null) return;
        await _transaction.RollbackAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public void DetachTrackedState() => database.ChangeTracker.Clear();

    public async ValueTask DisposeAsync()
    {
        if (_transaction is null) return;
        await _transaction.DisposeAsync();
        _transaction = null;
    }
}
