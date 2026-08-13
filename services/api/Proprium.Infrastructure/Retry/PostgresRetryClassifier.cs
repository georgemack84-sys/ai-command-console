using Npgsql;
using Proprium.Application.Retry;

namespace Proprium.Infrastructure.Retry;

public sealed class PostgresRetryClassifier : IRetryFailureClassifier
{
    public static RetryFailureClassification ClassifySqlState(string? sqlState) => sqlState switch
    {
        "40001" or "40P01" => RetryFailureClassification.TransactionTransient,
        "53300" or "53400" => RetryFailureClassification.Capacity,
        _ => RetryFailureClassification.Fatal
    };

    public RetryFailureClassification Classify(Exception exception) => exception switch
    {
        IndeterminateCommitException => RetryFailureClassification.Indeterminate,
        PostgresException postgres => ClassifySqlState(postgres.SqlState),
        NpgsqlException { IsTransient: true } => RetryFailureClassification.ConnectionTransient,
        NpgsqlException => RetryFailureClassification.Fatal,
        _ => RetryFailureClassification.Fatal
    };
}
