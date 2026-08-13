using System.Data;

namespace Proprium.Application.Retry;

public enum RetryFailureClassification { ConnectionTransient, TransactionTransient, Fatal, Capacity, Indeterminate }

public sealed record RetryOperationContext(
    string Name,
    string CorrelationId,
    int MaximumAttempts = 3,
    IsolationLevel IsolationLevel = IsolationLevel.Serializable);

public sealed record RetryAttemptContext(RetryOperationContext Operation, int Attempt, Guid AttemptId);

public interface IRetryAttemptDependencies
{
    RetryAttemptContext Context { get; }
}

public interface IRetryAttemptFactory<TDependencies> : IAsyncDisposable
    where TDependencies : class, IRetryAttemptDependencies
{
    TDependencies Create(RetryAttemptContext context);
    Task BeginTransactionAsync(IsolationLevel isolationLevel, CancellationToken cancellationToken);
    Task CommitTransactionAsync(CancellationToken cancellationToken);
    Task RollbackTransactionAsync(CancellationToken cancellationToken);
    void DetachTrackedState();
}

public interface IRetryFailureClassifier
{
    RetryFailureClassification Classify(Exception exception);
}

public interface IRetryExecutor
{
    Task<TResult> ExecuteAsync<TDependencies, TResult>(
        RetryOperationContext operation,
        Func<TDependencies, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default)
        where TDependencies : class, IRetryAttemptDependencies;
}

public sealed class IndeterminateCommitException(string message, Exception? innerException = null) : Exception(message, innerException);

public sealed class NestedRetryException(string operationName) : InvalidOperationException($"Retry operation '{operationName}' cannot be nested inside another retry boundary.");
