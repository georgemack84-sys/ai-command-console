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

    public RetryFailureClassification Classify(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);
        for (var current = exception; current is not null; current = current.InnerException)
        {
            switch (current)
            {
                case IndeterminateCommitException:
                    return RetryFailureClassification.Indeterminate;
                case PostgresException postgres:
                    return ClassifySqlState(postgres.SqlState);
                case NpgsqlException { IsTransient: true }:
                    return RetryFailureClassification.ConnectionTransient;
                case NpgsqlException:
                    return RetryFailureClassification.Fatal;
            }
        }

        return RetryFailureClassification.Fatal;
    }
}
