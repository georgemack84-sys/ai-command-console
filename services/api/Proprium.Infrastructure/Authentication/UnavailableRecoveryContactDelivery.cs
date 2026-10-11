using Proprium.Application.Authentication;

namespace Proprium.Infrastructure.Authentication;

/// <summary>
/// The safe default until an operational email provider is configured. It never
/// exposes a verification token through an API response or application log.
/// </summary>
public sealed class UnavailableRecoveryContactDelivery : IRecoveryContactDelivery
{
    public Task<bool> DeliverVerificationAsync(RecoveryContactVerificationDelivery delivery, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
