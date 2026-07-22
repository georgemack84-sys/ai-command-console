# Recurrence Engine

The recurrence engine expands events at read time inside a bounded date window. Expansion starts from the series event, advances by the recurrence rule interval, and stops after the window end or a defensive occurrence cap.

Exceptions are stored separately from generated occurrences. A cancelled exception hides the occurrence, and a modified exception returns its replacement event.

Conditional limitation: this engine is deterministic and local, but it is not yet a full RFC 5545 recurrence implementation.
