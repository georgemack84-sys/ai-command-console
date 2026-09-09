namespace Proprium.Application.Observability;

public interface IRequestContext
{
    string RequestId { get; }
    string CorrelationId { get; }
    Guid? ActorId { get; }
}
