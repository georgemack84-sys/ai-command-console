using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Proprium.Application.Retry;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Retry;

internal sealed class PersistenceAttempt(RetryAttemptContext context, PropriumDbContext dbContext) : IPersistenceAttempt
{
    public RetryAttemptContext Context { get; } = context;
    public PropriumDbContext DbContext { get; } = dbContext;
    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

public sealed class RetryExecutor(IServiceScopeFactory scopeFactory, ILogger<RetryExecutor> logger) : IRetryExecutor
{
    public async Task<T> ExecuteAsync<T>(RetryOperationContext operation, Func<IPersistenceAttempt, CancellationToken, Task<T>> action, CancellationToken cancellationToken = default)
    {
        for (var attempt = 1; ; attempt++)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var context = new RetryAttemptContext(operation, attempt);
            var dependencies = new PersistenceAttempt(context, scope.ServiceProvider.GetRequiredService<PropriumDbContext>());
            try { return await action(dependencies, cancellationToken); }
            catch (Exception exception) when (attempt < operation.MaximumAttempts && CanRetry(PostgresRetryClassifier.Classify(exception)))
            {
                logger.LogWarning(exception, "Retrying {Operation} attempt {Attempt} with correlation {CorrelationId}", operation.Name, attempt, operation.CorrelationId);
            }
        }
    }
    private static bool CanRetry(RetryFailureClassification classification) => classification is RetryFailureClassification.ConnectionTransient or RetryFailureClassification.TransactionTransient;
}
