using Npgsql;
using Proprium.Application.Retry;

namespace Proprium.Infrastructure.Retry;

public static class PostgresRetryClassifier
{
    public static RetryFailureClassification ClassifySqlState(string? sqlState) => sqlState switch
    {
        "40001" or "40P01" => RetryFailureClassification.TransactionTransient,
        "53300" or "53400" => RetryFailureClassification.Capacity,
        _ => RetryFailureClassification.Fatal
    };
    public static RetryFailureClassification Classify(Exception exception) => exception switch
    {
        PostgresException postgres => ClassifySqlState(postgres.SqlState),
        NpgsqlException { IsTransient: true } => RetryFailureClassification.ConnectionTransient,
        NpgsqlException => RetryFailureClassification.Fatal,
        _ => RetryFailureClassification.Fatal
    };
}
