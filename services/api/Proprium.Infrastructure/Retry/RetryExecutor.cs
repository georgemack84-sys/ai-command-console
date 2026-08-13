using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Proprium.Application.Retry;

namespace Proprium.Infrastructure.Retry;

public sealed class RetryExecutor(
    IServiceScopeFactory scopeFactory,
    IRetryFailureClassifier classifier,
    ILogger<RetryExecutor> logger) : IRetryExecutor
{
    private static readonly AsyncLocal<int> ExecutionDepth = new();

    public async Task<TResult> ExecuteAsync<TDependencies, TResult>(
        RetryOperationContext operation,
        Func<TDependencies, CancellationToken, Task<TResult>> action,
        CancellationToken cancellationToken = default)
        where TDependencies : class, IRetryAttemptDependencies
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(action);
        if (string.IsNullOrWhiteSpace(operation.Name)) throw new ArgumentException("A retry operation name is required.", nameof(operation));
        if (string.IsNullOrWhiteSpace(operation.CorrelationId)) throw new ArgumentException("A retry correlation identifier is required.", nameof(operation));
        if (operation.MaximumAttempts < 1) throw new ArgumentOutOfRangeException(nameof(operation), "Maximum attempts must be at least one.");
        if (ExecutionDepth.Value != 0) throw new NestedRetryException(operation.Name);

        ExecutionDepth.Value++;
        try
        {
            for (var attemptNumber = 1; ; attemptNumber++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                await using var scope = scopeFactory.CreateAsyncScope();
                var factory = scope.ServiceProvider.GetRequiredService<IRetryAttemptFactory<TDependencies>>();
                var context = new RetryAttemptContext(operation, attemptNumber, Guid.NewGuid());
                var dependencies = factory.Create(context);
                var transactionStarted = false;

                try
                {
                    await factory.BeginTransactionAsync(operation.IsolationLevel, cancellationToken);
                    transactionStarted = true;
                    var result = await action(dependencies, cancellationToken);
                    transactionStarted = false;
                    try { await factory.CommitTransactionAsync(cancellationToken); }
                    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
                    catch (Exception commitException)
                    {
                        throw new IndeterminateCommitException($"Commit outcome for retry operation '{operation.Name}' could not be determined.", commitException);
                    }
                    factory.DetachTrackedState();
                    return result;
                }
                catch (Exception exception) when (exception is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
                {
                    if (transactionStarted)
                    {
                        try { await factory.RollbackTransactionAsync(CancellationToken.None); }
                        catch (Exception rollbackException)
                        {
                            logger.LogError("Rollback failed for {Operation} attempt {AttemptId} with type {ExceptionType}", operation.Name, context.AttemptId, rollbackException.GetType().Name);
                        }
                    }

                    var classification = classifier.Classify(exception);
                    if (attemptNumber >= operation.MaximumAttempts || !CanRetry(classification))
                    {
                        logger.LogError("Retry operation {Operation} stopped at attempt {Attempt} with classification {Classification}, correlation {CorrelationId}, and type {ExceptionType}", operation.Name, attemptNumber, classification, operation.CorrelationId, exception.GetType().Name);
                        throw;
                    }

                    logger.LogWarning("Retrying {Operation} after attempt {Attempt} classified as {Classification} with correlation {CorrelationId} and type {ExceptionType}", operation.Name, attemptNumber, classification, operation.CorrelationId, exception.GetType().Name);
                }
            }
        }
        finally
        {
            ExecutionDepth.Value--;
        }
    }

    private static bool CanRetry(RetryFailureClassification classification) =>
        classification is RetryFailureClassification.ConnectionTransient or RetryFailureClassification.TransactionTransient;
}
