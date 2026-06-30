import type { ChangeDetectionEvent, ChangeDetectionEventType } from "../records/marketChangeRecord";

export function createChangeDetectionEvent(input: {
  change_id: string;
  market_id?: string;
  source_id?: string;
  event_type: ChangeDetectionEventType;
  reason: string;
  timestamp?: string;
  severity?: "INFO" | "WARN" | "ERROR";
  version?: string;
}): ChangeDetectionEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `change_event_${input.change_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    change_id: input.change_id,
    market_id: input.market_id ?? "unknown_market",
    source_id: input.source_id ?? "unknown_source",
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
    version: input.version ?? "1.6",
  });
}
