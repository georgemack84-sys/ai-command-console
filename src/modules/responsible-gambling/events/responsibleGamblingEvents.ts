import type { EventSeverity, ISODateTime, UUID, Version } from "../../../core";

export type ResponsibleGamblingEventType =
  | "GUARDRAIL_CHECK_STARTED"
  | "INFORMATIONAL_OUTPUT_ALLOWED"
  | "PICK_LANGUAGE_BLOCKED"
  | "GUARANTEE_LANGUAGE_BLOCKED"
  | "BET_AUTOMATION_BLOCKED"
  | "CHASING_LOSSES_BLOCKED"
  | "MISLEADING_CONFIDENCE_BLOCKED"
  | "DISCLAIMER_APPLIED"
  | "PREMATURE_RECOMMENDATION_BLOCKED";

export interface ResponsibleGamblingEvent {
  event_id: UUID;
  decision_id: UUID;
  event_type: ResponsibleGamblingEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
  version: Version;
}

export function createResponsibleGamblingEvent(input: {
  decision_id: UUID;
  event_type: ResponsibleGamblingEventType;
  reason: string;
  timestamp?: ISODateTime;
  severity?: EventSeverity;
  version?: Version;
}): ResponsibleGamblingEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();
  const version = input.version ?? "1.7";

  return Object.freeze({
    event_id: `rg_event_${input.decision_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    decision_id: input.decision_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
    version,
  });
}
