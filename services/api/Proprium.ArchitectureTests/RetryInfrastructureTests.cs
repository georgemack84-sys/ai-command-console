using System.Data;
using Microsoft.Extensions.DependencyInjection;
using Proprium.Application.Retry;
using Proprium.Infrastructure.Retry;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class RetryInfrastructureTests
{
    [Theory]
    [InlineData("40001", RetryFailureClassification.TransactionTransient)]
    [InlineData("40P01", RetryFailureClassification.TransactionTransient)]
    [InlineData("53300", RetryFailureClassification.Capacity)]
    [InlineData("53400", RetryFailureClassification.Capacity)]
    [InlineData("23505", RetryFailureClassification.Fatal)]
    [InlineData(null, RetryFailureClassification.Fatal)]
    public void PostgreSQL_SQLSTATE_is_classified_by_locked_policy(string? sqlState, RetryFailureClassification expected) =>
        Assert.Equal(expected, PostgresRetryClassifier.ClassifySqlState(sqlState));

    [Fact]
    public void Indeterminate_commit_is_never_retryable() =>
        Assert.Equal(RetryFailureClassification.Indeterminate, new PostgresRetryClassifier().Classify(new IndeterminateCommitException("unknown outcome")));

    [Fact]
    public async Task Every_retry_owns_fresh_scope_dependencies_and_transaction_lifecycle()
    {
        var recorder = new RetryRecorder();
        await using var provider = BuildProvider(recorder, new ScriptedClassifier(RetryFailureClassification.TransactionTransient));
        var executor = provider.GetRequiredService<IRetryExecutor>();

        var result = await executor.ExecuteAsync<TestDependencies, Guid>(
            new RetryOperationContext("fresh-attempt", "correlation", MaximumAttempts: 3),
            (dependencies, _) => dependencies.Context.Attempt < 3
                ? throw new RetryableTestException()
                : Task.FromResult(dependencies.ScopeId));

        Assert.Equal(recorder.ScopeIds[^1], result);
        Assert.Equal(3, recorder.ScopeIds.Distinct().Count());
        Assert.Equal(3, recorder.AttemptIds.Distinct().Count());
        Assert.Equal([1, 2, 3], recorder.AttemptNumbers);
        Assert.Equal(3, recorder.Begins);
        Assert.Equal(1, recorder.Commits);
        Assert.Equal(2, recorder.Rollbacks);
        Assert.Equal(1, recorder.Detaches);
        Assert.Equal(3, recorder.Disposals);
        Assert.All(recorder.IsolationLevels, level => Assert.Equal(IsolationLevel.Serializable, level));
    }

    [Theory]
    [InlineData(RetryFailureClassification.ConnectionTransient)]
    [InlineData(RetryFailureClassification.TransactionTransient)]
    public async Task Transient_failures_retry_the_complete_operation(RetryFailureClassification classification)
    {
        var recorder = new RetryRecorder();
        await using var provider = BuildProvider(recorder, new ScriptedClassifier(classification));
        var executor = provider.GetRequiredService<IRetryExecutor>();
        var executions = 0;

        var result = await executor.ExecuteAsync<TestDependencies, bool>(
            new RetryOperationContext("transient", "correlation"),
            (_, _) => ++executions == 1 ? throw new RetryableTestException() : Task.FromResult(true));

        Assert.True(result);
        Assert.Equal(2, executions);
        Assert.Equal(2, recorder.ScopeIds.Distinct().Count());
        Assert.Equal(1, recorder.Rollbacks);
        Assert.Equal(1, recorder.Commits);
    }

    [Fact]
    public async Task Commit_failure_is_indeterminate_and_is_never_retried()
    {
        var recorder = new RetryRecorder { CommitException = new InvalidOperationException("connection lost during commit") };
        await using var provider = BuildProvider(recorder, new PostgresRetryClassifier());
        var executor = provider.GetRequiredService<IRetryExecutor>();

        var exception = await Assert.ThrowsAsync<IndeterminateCommitException>(() => executor.ExecuteAsync<TestDependencies, bool>(
            new RetryOperationContext("indeterminate", "correlation"),
            (_, _) => Task.FromResult(true)));

        Assert.IsType<InvalidOperationException>(exception.InnerException);
        Assert.Single(recorder.ScopeIds);
        Assert.Equal(0, recorder.Rollbacks);
    }

    [Theory]
    [InlineData(RetryFailureClassification.Capacity)]
    [InlineData(RetryFailureClassification.Fatal)]
    [InlineData(RetryFailureClassification.Indeterminate)]
    public async Task Non_retryable_failures_stop_after_one_attempt(RetryFailureClassification classification)
    {
        var recorder = new RetryRecorder();
        await using var provider = BuildProvider(recorder, new ScriptedClassifier(classification));
        var executor = provider.GetRequiredService<IRetryExecutor>();

        await Assert.ThrowsAsync<RetryableTestException>(() => executor.ExecuteAsync<TestDependencies, bool>(
            new RetryOperationContext("non-retryable", "correlation"),
            (_, _) => throw new RetryableTestException()));

        Assert.Single(recorder.ScopeIds);
        Assert.Equal(1, recorder.Rollbacks);
        Assert.Equal(0, recorder.Commits);
    }

    [Fact]
    public async Task Nested_retry_boundaries_are_rejected()
    {
        var recorder = new RetryRecorder();
        await using var provider = BuildProvider(recorder, new ScriptedClassifier(RetryFailureClassification.Fatal));
        var executor = provider.GetRequiredService<IRetryExecutor>();

        await Assert.ThrowsAsync<NestedRetryException>(() => executor.ExecuteAsync<TestDependencies, bool>(
            new RetryOperationContext("outer", "correlation"),
            async (_, token) => await executor.ExecuteAsync<TestDependencies, bool>(
                new RetryOperationContext("inner", "correlation"),
                (_, _) => Task.FromResult(true), token)));
    }

    private static ServiceProvider BuildProvider(RetryRecorder recorder, IRetryFailureClassifier classifier) =>
        new ServiceCollection()
            .AddLogging()
            .AddSingleton(recorder)
            .AddSingleton(classifier)
            .AddSingleton<IRetryExecutor, RetryExecutor>()
            .AddScoped<ScopeProbe>()
            .AddScoped<IRetryAttemptFactory<TestDependencies>, TestAttemptFactory>()
            .BuildServiceProvider(validateScopes: true);

    private sealed class RetryableTestException : Exception;
    private sealed record TestDependencies(RetryAttemptContext Context, Guid ScopeId) : IRetryAttemptDependencies;
    private sealed class ScopeProbe { public Guid Id { get; } = Guid.NewGuid(); }
    private sealed class ScriptedClassifier(RetryFailureClassification classification) : IRetryFailureClassifier
    {
        public RetryFailureClassification Classify(Exception exception) => classification;
    }

    private sealed class RetryRecorder
    {
        public List<Guid> ScopeIds { get; } = [];
        public List<Guid> AttemptIds { get; } = [];
        public List<int> AttemptNumbers { get; } = [];
        public List<IsolationLevel> IsolationLevels { get; } = [];
        public int Begins { get; set; }
        public int Commits { get; set; }
        public int Rollbacks { get; set; }
        public int Detaches { get; set; }
        public int Disposals { get; set; }
        public Exception? CommitException { get; init; }
    }

    private sealed class TestAttemptFactory(ScopeProbe probe, RetryRecorder recorder) : IRetryAttemptFactory<TestDependencies>
    {
        public TestDependencies Create(RetryAttemptContext context)
        {
            recorder.ScopeIds.Add(probe.Id);
            recorder.AttemptIds.Add(context.AttemptId);
            recorder.AttemptNumbers.Add(context.Attempt);
            return new TestDependencies(context, probe.Id);
        }

        public Task BeginTransactionAsync(IsolationLevel isolationLevel, CancellationToken cancellationToken)
        {
            recorder.Begins++;
            recorder.IsolationLevels.Add(isolationLevel);
            return Task.CompletedTask;
        }

        public Task CommitTransactionAsync(CancellationToken cancellationToken)
        {
            recorder.Commits++;
            return recorder.CommitException is null ? Task.CompletedTask : Task.FromException(recorder.CommitException);
        }
        public Task RollbackTransactionAsync(CancellationToken cancellationToken) { recorder.Rollbacks++; return Task.CompletedTask; }
        public void DetachTrackedState() => recorder.Detaches++;
        public ValueTask DisposeAsync() { recorder.Disposals++; return ValueTask.CompletedTask; }
    }
}
