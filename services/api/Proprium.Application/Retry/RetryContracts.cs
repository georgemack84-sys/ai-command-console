namespace Proprium.Application.Retry;

public enum RetryFailureClassification { ConnectionTransient, TransactionTransient, Fatal, Capacity, Indeterminate }

public sealed record RetryOperationContext(string Name, string CorrelationId, int MaximumAttempts = 3);
public sealed record RetryAttemptContext(RetryOperationContext Operation, int Attempt);

public interface IPersistenceAttempt : IAsyncDisposable { RetryAttemptContext Context { get; } }

public interface IRetryExecutor
{
    Task<T> ExecuteAsync<T>(RetryOperationContext operation, Func<IPersistenceAttempt, CancellationToken, Task<T>> action, CancellationToken cancellationToken = default);
}
