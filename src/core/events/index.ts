import { EdgeBookError } from "../errors";
import { EDGEBOOK_PHASE_1_0, type EventSeverity, type ISODateTime, type PhaseId, type UUID } from "../types";

export type BlockedEdgeBookEventType =
  | "BET_RECOMMENDED"
  | "PICK_GENERATED"
  | "EDGE_SCORE_CREATED"
  | "CONFIDENCE_RANKED"
  | "AUTO_WAGER_TRIGGERED";

export type EdgeBookEventType = string;

export interface EdgeBookEvent {
  event_id: UUID;
  event_type: EdgeBookEventType;
  severity: EventSeverity;
  message: string;
  timestamp: ISODateTime;
  phase: PhaseId;
}

export const blockedEdgeBookEventTypes: ReadonlySet<BlockedEdgeBookEventType> = new Set([
  "BET_RECOMMENDED",
  "PICK_GENERATED",
  "EDGE_SCORE_CREATED",
  "CONFIDENCE_RANKED",
  "AUTO_WAGER_TRIGGERED",
]);

export function createEdgeBookEvent(input: {
  event_id: UUID;
  event_type: EdgeBookEventType;
  severity?: EventSeverity;
  message: string;
  timestamp?: ISODateTime;
  phase?: PhaseId;
}): EdgeBookEvent {
  if (blockedEdgeBookEventTypes.has(input.event_type as BlockedEdgeBookEventType)) {
    throw new EdgeBookError(
      "PHASE_BOUNDARY_VIOLATION",
      `Event type ${input.event_type} is blocked during EdgeBook Phase 1.0.`,
      "event_type",
    );
  }

  return Object.freeze({
    event_id: input.event_id,
    event_type: input.event_type,
    severity: input.severity ?? "INFO",
    message: input.message,
    timestamp: input.timestamp ?? new Date(0).toISOString(),
    phase: input.phase ?? EDGEBOOK_PHASE_1_0,
  });
}
