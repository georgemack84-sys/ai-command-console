using Proprium.Application.Events;

namespace Proprium.Infrastructure.Events;

public sealed class InProcessEventPublisher(IEnumerable<IIntegrationEventHandler> handlers) : IEventPublisher
{
    public async Task PublishAsync(IntegrationEventEnvelope message, CancellationToken cancellationToken = default)
    {
        message.Validate();
        foreach (var handler in handlers) await handler.HandleAsync(message, cancellationToken);
    }
}
