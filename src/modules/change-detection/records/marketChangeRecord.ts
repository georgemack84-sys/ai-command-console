import type { EventSeverity, ISODateTime, UUID, Version } from "../../../core";
import type { MarketType } from "../../markets";

export type MovementDirection = "UP" | "DOWN" | "UNCHANGED" | "UNKNOWN";
export type ChangeDetectionStatus = "CHANGE_DETECTED" | "NO_CHANGE" | "NO_BASELINE" | "COMPARISON_FAILED";

export interface MarketChangeRecord {
  change_id: UUID;
  market_id: UUID;
  source_id: UUID;
  ownership_hash: string;
  market_type: MarketType;
  previous_value: number | null;
  new_value: number | null;
  movement_size: number | null;
  movement_direction: MovementDirection;
  timestamp: ISODateTime;
  version: Version;
}

export type ChangeDetectionEventType =
  | "CHANGE_DETECTION_STARTED"
  | "BASELINE_FOUND"
  | "NO_BASELINE_FOUND"
  | "MARKET_CHANGE_DETECTED"
  | "NO_MARKET_CHANGE"
  | "CHANGE_COMPARISON_FAILED"
  | "CHANGE_RECORD_CREATED"
  | "CHANGE_FAILURE_RECORDED";

export interface ChangeDetectionEvent {
  event_id: UUID;
  change_id: UUID;
  market_id: UUID;
  source_id: UUID;
  event_type: ChangeDetectionEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
  version: Version;
}
