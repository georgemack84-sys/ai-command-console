import type { EventSeverity, ISODateTime, UUID, Version } from "../../../core";

export type RawObservationStoreEventType =
  | "RAW_OBSERVATION_APPENDED"
  | "OWNERSHIP_RECORD_APPENDED"
  | "SOURCE_REFERENCE_APPENDED"
  | "VALIDATION_RECORD_APPENDED"
  | "MUTATION_ATTEMPT_BLOCKED"
  | "RAW_PAYLOAD_PRESERVED"
  | "REPLAY_REQUESTED"
  | "REPLAY_COMPLETED"
  | "REPLAY_FAILED";

export interface RawObservationStoreEvent {
  event_id: UUID;
  observation_id: UUID;
  event_type: RawObservationStoreEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
  storage_version: Version;
}

export function createRawObservationStoreEvent(input: {
  observation_id: UUID;
  event_type: RawObservationStoreEventType;
  reason: string;
  storage_version: Version;
  timestamp?: ISODateTime;
  severity?: EventSeverity;
}): RawObservationStoreEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `raw_store_event_${input.observation_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    observation_id: input.observation_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
    storage_version: input.storage_version,
  });
}
