import type { EventSeverity, ISODateTime, UUID, Version } from "../../../core";

export type VerificationEventType =
  | "VERIFICATION_STARTED"
  | "SOURCE_VERIFIED"
  | "SOURCE_VERIFICATION_FAILED"
  | "SCHEMA_VERIFIED"
  | "SCHEMA_VERIFICATION_FAILED"
  | "TIMESTAMP_VERIFIED"
  | "TIMESTAMP_VERIFICATION_FAILED"
  | "OWNERSHIP_VERIFIED"
  | "OWNERSHIP_VERIFICATION_FAILED"
  | "DUPLICATE_DETECTED"
  | "OBSERVATION_VERIFIED"
  | "OBSERVATION_BLOCKED"
  | "VERIFICATION_FAILURE_RECORDED"
  | "STORE_AUTHORIZATION_GRANTED"
  | "STORE_AUTHORIZATION_DENIED";

export interface VerificationEvent {
  event_id: UUID;
  verification_id: UUID;
  observation_id: UUID;
  event_type: VerificationEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
  version: Version;
}

export function createVerificationEvent(input: {
  verification_id: UUID;
  observation_id: UUID;
  event_type: VerificationEventType;
  reason: string;
  version: Version;
  timestamp?: ISODateTime;
  severity?: EventSeverity;
}): VerificationEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `verification_event_${input.verification_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    verification_id: input.verification_id,
    observation_id: input.observation_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
    version: input.version,
  });
}
