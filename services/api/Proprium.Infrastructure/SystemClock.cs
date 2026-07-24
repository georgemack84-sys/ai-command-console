namespace Proprium.Infrastructure;

public interface ISystemClock { DateTimeOffset UtcNow { get; } }

public sealed class SystemClock : ISystemClock { public DateTimeOffset UtcNow => DateTimeOffset.UtcNow; }
