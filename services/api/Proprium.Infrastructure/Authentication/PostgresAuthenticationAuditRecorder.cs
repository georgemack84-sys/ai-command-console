using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Persistence;

namespace Proprium.Infrastructure.Authentication;

public sealed class PostgresAuthenticationAuditRecorder(PropriumDbContext database) : IAuthenticationAuditRecorder
{
    public async Task RecordBestEffortAsync(
        AuthenticationEventType eventType,
        AuthenticationEventOutcome outcome,
        string correlationId,
        string reasonCode,
        CancellationToken cancellationToken = default)
    {
        try
        {
            database.AuthenticationEvents.Add(AuthenticationEventFactory.Create(eventType, outcome, correlationId, reasonCode: reasonCode));
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // Security audit persistence is best effort for boundary rejections.
        }
    }
}
