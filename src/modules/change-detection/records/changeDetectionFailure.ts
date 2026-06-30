import type { ISODateTime, UUID, Version } from "../../../core";

export type ChangeDetectionFailureReason =
  | "NO_PREVIOUS_OBSERVATION"
  | "MISSING_PREVIOUS_VALUE"
  | "MISSING_NEW_VALUE"
  | "MISSING_SOURCE_ID"
  | "MISSING_MARKET_ID"
  | "MISSING_OWNERSHIP_HASH"
  | "INVALID_MARKET_TYPE"
  | "COMPARISON_NOT_ALLOWED";

export interface ChangeDetectionFailure {
  failure_id: UUID;
  market_id: UUID;
  source_id: UUID;
  reason: ChangeDetectionFailureReason;
  timestamp: ISODateTime;
  version: Version;
}
