using System.Collections.Concurrent;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Proprium.Application.Retry;
using Proprium.Domain;
using Proprium.Infrastructure.Persistence;
using Proprium.Infrastructure.Retry;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class PostgresRetryIntegrationTests : IIntegrationTest
{
    [Fact]
    public async Task Serialization_failure_retries_with_fresh_context_and_no_stale_tracking()
    {
        var key = $"test.retry.serialization.{Guid.NewGuid():N}";
        await InsertMetadataAsync(key);
        var recorder = new PostgresAttemptRecorder();
        await using var provider = BuildProvider(recorder);
        var executor = provider.GetRequiredService<IRetryExecutor>();
        var firstAttemptGate = new AsyncGate(2);

        try
        {
            Task<PlatformMetadata> Increment() => executor.ExecuteAsync<TestPostgresAttempt, PlatformMetadata>(
                new RetryOperationContext("serialization-increment", Guid.NewGuid().ToString("D"), MaximumAttempts: 3),
                async (attempt, cancellationToken) =>
                {
                    var row = await attempt.Database.PlatformMetadata.SingleAsync(item => item.Key == key, cancellationToken);
                    if (attempt.Context.Attempt == 1) await firstAttemptGate.SignalAndWaitAsync(cancellationToken);
                    row.Value = (int.Parse(row.Value, System.Globalization.CultureInfo.InvariantCulture) + 1)
                        .ToString(System.Globalization.CultureInfo.InvariantCulture);
                    await attempt.Database.SaveChangesAsync(cancellationToken);
                    return row;
                });

            var results = await Task.WhenAll(Increment(), Increment());

            Assert.Equal("2", await ReadMetadataValueAsync(key));
            Assert.Contains(recorder.SqlStates, state => state == PostgresErrorCodes.SerializationFailure);
            Assert.Contains(recorder.Attempts, context => context.Attempt > 1);
            Assert.Equal(recorder.Contexts.Count, recorder.Contexts.Distinct(ReferenceEqualityComparer.Instance).Count());
            Assert.All(results, result => Assert.Equal(key, result.Key));
            Assert.True(recorder.MaximumTrackedEntriesBeforeDetach > 0);
            Assert.Equal(0, recorder.MaximumTrackedEntriesAfterDetach);
            Assert.Equal(recorder.FactoriesCreated, recorder.FactoriesDisposed);
        }
        finally
        {
            await DeleteMetadataAsync(key);
        }
    }

    [Fact]
    public async Task Deadlock_retries_complete_transaction_without_duplicate_commits()
    {
        var firstKey = $"test.retry.deadlock.a.{Guid.NewGuid():N}";
        var secondKey = $"test.retry.deadlock.b.{Guid.NewGuid():N}";
        await InsertMetadataAsync(firstKey);
        await InsertMetadataAsync(secondKey);
        var recorder = new PostgresAttemptRecorder();
        await using var provider = BuildProvider(recorder);
        var executor = provider.GetRequiredService<IRetryExecutor>();
        var firstAttemptGate = new AsyncGate(2);

        try
        {
            Task<bool> IncrementInOrder(string first, string second) => executor.ExecuteAsync<TestPostgresAttempt, bool>(
                new RetryOperationContext("deadlock-increment", Guid.NewGuid().ToString("D"), MaximumAttempts: 3),
                async (attempt, cancellationToken) =>
                {
                    await IncrementMetadataWithSqlAsync(attempt.Database, first, cancellationToken);
                    if (attempt.Context.Attempt == 1) await firstAttemptGate.SignalAndWaitAsync(cancellationToken);
                    await IncrementMetadataWithSqlAsync(attempt.Database, second, cancellationToken);
                    return true;
                });

            await Task.WhenAll(IncrementInOrder(firstKey, secondKey), IncrementInOrder(secondKey, firstKey));

            Assert.Equal("2", await ReadMetadataValueAsync(firstKey));
            Assert.Equal("2", await ReadMetadataValueAsync(secondKey));
            Assert.Contains(recorder.SqlStates, state => state == PostgresErrorCodes.DeadlockDetected);
            Assert.Contains(recorder.Attempts, context => context.Attempt > 1);
            Assert.Equal(recorder.Contexts.Count, recorder.Contexts.Distinct(ReferenceEqualityComparer.Instance).Count());
            Assert.Equal(recorder.FactoriesCreated, recorder.FactoriesDisposed);
        }
        finally
        {
            await DeleteMetadataAsync(firstKey);
            await DeleteMetadataAsync(secondKey);
        }
    }

    private static ServiceProvider BuildProvider(PostgresAttemptRecorder recorder)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(recorder);
        services.AddSingleton<IRetryFailureClassifier, RecordingPostgresClassifier>();
        services.AddSingleton<IRetryExecutor, RetryExecutor>();
        services.AddDbContext<PropriumDbContext>(options => options.UseNpgsql(ConnectionString));
        services.AddScoped<IRetryAttemptFactory<TestPostgresAttempt>, TestPostgresAttemptFactory>();
        return services.BuildServiceProvider(validateScopes: true);
    }

    private static string ConnectionString =>
        $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};" +
        $"Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};" +
        $"Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};" +
        $"Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};" +
        $"Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";

    private static PropriumDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(ConnectionString).Options);

    private static async Task InsertMetadataAsync(string key)
    {
        await using var database = CreateContext();
        database.PlatformMetadata.Add(new PlatformMetadata { Key = key, Value = "0" });
        await database.SaveChangesAsync();
    }

    private static async Task<string> ReadMetadataValueAsync(string key)
    {
        await using var database = CreateContext();
        return await database.PlatformMetadata.Where(item => item.Key == key).Select(item => item.Value).SingleAsync();
    }

    private static async Task DeleteMetadataAsync(string key)
    {
        await using var database = CreateContext();
        await database.PlatformMetadata.Where(item => item.Key == key).ExecuteDeleteAsync();
    }

    private static Task IncrementMetadataWithSqlAsync(PropriumDbContext database, string key, CancellationToken cancellationToken) =>
        database.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE platform_metadata SET \"Value\" = ((\"Value\"::integer + 1)::text) WHERE \"Key\" = {key}", cancellationToken);

    private sealed record TestPostgresAttempt(RetryAttemptContext Context, PropriumDbContext Database) : IRetryAttemptDependencies;

    private sealed class TestPostgresAttemptFactory(
        PropriumDbContext database,
        PostgresAttemptRecorder recorder) : IRetryAttemptFactory<TestPostgresAttempt>
    {
        private IDbContextTransaction? _transaction;

        public TestPostgresAttempt Create(RetryAttemptContext context)
        {
            Interlocked.Increment(ref recorder.FactoriesCreated);
            recorder.Attempts.Add(context);
            recorder.Contexts.Add(database);
            return new TestPostgresAttempt(context, database);
        }

        public async Task BeginTransactionAsync(IsolationLevel isolationLevel, CancellationToken cancellationToken) =>
            _transaction = await database.Database.BeginTransactionAsync(isolationLevel, cancellationToken);

        public async Task CommitTransactionAsync(CancellationToken cancellationToken)
        {
            await _transaction!.CommitAsync(cancellationToken);
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

        public void DetachTrackedState()
        {
            UpdateMaximum(ref recorder.MaximumTrackedEntriesBeforeDetach, database.ChangeTracker.Entries().Count());
            database.ChangeTracker.Clear();
            UpdateMaximum(ref recorder.MaximumTrackedEntriesAfterDetach, database.ChangeTracker.Entries().Count());
        }

        public async ValueTask DisposeAsync()
        {
            if (_transaction is not null) await _transaction.DisposeAsync();
            Interlocked.Increment(ref recorder.FactoriesDisposed);
        }

        private static void UpdateMaximum(ref int target, int value)
        {
            var current = Volatile.Read(ref target);
            while (value > current)
            {
                var observed = Interlocked.CompareExchange(ref target, value, current);
                if (observed == current) return;
                current = observed;
            }
        }
    }

    private sealed class RecordingPostgresClassifier(PostgresAttemptRecorder recorder) : IRetryFailureClassifier
    {
        private readonly PostgresRetryClassifier _inner = new();
        public RetryFailureClassification Classify(Exception exception)
        {
            for (var current = exception; current is not null; current = current.InnerException)
            {
                if (current is PostgresException postgres)
                {
                    recorder.SqlStates.Add(postgres.SqlState);
                    break;
                }
            }
            return _inner.Classify(exception);
        }
    }

    private sealed class PostgresAttemptRecorder
    {
        public ConcurrentBag<RetryAttemptContext> Attempts { get; } = [];
        public ConcurrentBag<PropriumDbContext> Contexts { get; } = [];
        public ConcurrentBag<string> SqlStates { get; } = [];
        public int FactoriesCreated;
        public int FactoriesDisposed;
        public int MaximumTrackedEntriesBeforeDetach;
        public int MaximumTrackedEntriesAfterDetach;
    }

    private sealed class AsyncGate(int participants)
    {
        private readonly TaskCompletionSource _release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _arrivals;

        public async Task SignalAndWaitAsync(CancellationToken cancellationToken)
        {
            if (Interlocked.Increment(ref _arrivals) == participants) _release.TrySetResult();
            await _release.Task.WaitAsync(cancellationToken);
        }
    }
}
