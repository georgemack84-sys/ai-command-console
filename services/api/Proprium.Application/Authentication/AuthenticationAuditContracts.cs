using Proprium.Domain.Identity;

namespace Proprium.Application.Authentication;

public interface IAuthenticationAuditRecorder
{
    Task RecordBestEffortAsync(
        AuthenticationEventType eventType,
        AuthenticationEventOutcome outcome,
        string correlationId,
        string reasonCode,
        CancellationToken cancellationToken = default);
}
