import type {
  SourceRegistryEvent,
  SourceRegistryEventType,
} from "../schemas/sourceRegistryTypes";
import type { EventSeverity, ISODateTime, UUID } from "../../../core";

export function createSourceRegistryEvent(input: {
  source_id: UUID;
  event_type: SourceRegistryEventType;
  reason: string;
  severity?: EventSeverity;
  timestamp?: ISODateTime;
}): SourceRegistryEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `source_event_${input.source_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    source_id: input.source_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
  });
}

export function createSourceRegistryEventLog(initialEvents: SourceRegistryEvent[] = []) {
  const events = initialEvents.map((event) => ({ ...event }));

  return {
    record(event: SourceRegistryEvent) {
      const record = { ...event };
      events.push(record);
      return { status: "RECORDED" as const, event: { ...record } };
    },
    list() {
      return events.map((event) => ({ ...event }));
    },
  };
}
