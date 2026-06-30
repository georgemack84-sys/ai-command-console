import type { EventSeverity, ISODateTime, UUID, Version } from "../../core";

export type RecommendationContextBlockedAction =
  | "CREATE_RECOMMENDATION"
  | "PRIORITIZE_RECOMMENDATION"
  | "EXECUTE_WORKFLOW"
  | "DISPATCH_ACTION";

export type MarketSnapshotValidationErrorCode =
  | "MISSING_SOURCE"
  | "UNKNOWN_SOURCE"
  | "DISABLED_SOURCE"
  | "MISSING_TIMESTAMP"
  | "INVALID_TIMESTAMP"
  | "MISSING_EVENT_ID"
  | "MISSING_MARKET_TYPE"
  | "MISSING_MARKET_IDENTITY"
  | "RAW_PAYLOAD_MISSING"
  | "SCHEMA_ERROR"
  | "DUPLICATE_SNAPSHOT"
  | "OUT_OF_ORDER_SNAPSHOT";

export type MarketSnapshotStatus =
  | "SNAPSHOT_RECEIVED"
  | "VALID"
  | "INVALID_SOURCE"
  | "MISSING_TIMESTAMP"
  | "MALFORMED_TIMESTAMP"
  | "MISSING_REQUIRED_FIELDS"
  | "MISSING_MARKET_IDENTITY"
  | "RAW_PAYLOAD_MISSING"
  | "INITIAL_OBSERVATION"
  | "PREVIOUS_STATE_FOUND"
  | "SNAPSHOT_READY"
  | "SNAPSHOT_REJECTED";

export type SourceReferenceStatus =
  | "VALID_SOURCE"
  | "MISSING_SOURCE"
  | "UNKNOWN_SOURCE"
  | "DISABLED_SOURCE";

export type MarketSnapshotEventType =
  | "SNAPSHOT_RECEIVED"
  | "SNAPSHOT_VALIDATED"
  | "SNAPSHOT_REJECTED"
  | "SNAPSHOT_STORED"
  | "PREVIOUS_STATE_FOUND"
  | "PREVIOUS_STATE_NOT_FOUND"
  | "SNAPSHOT_READY";

export type SpreadMovementEventType = "SPREAD_MOVEMENT";

export type SpreadMovementDirection = "UP" | "DOWN";

export type SpreadEffect =
  | "FAVORITE_BECAME_STRONGER"
  | "FAVORITE_BECAME_WEAKER"
  | "UNDERDOG_BECAME_STRONGER"
  | "UNDERDOG_BECAME_WEAKER"
  | "PICKEM_TRANSITION"
  | "UNKNOWN";

export type SpreadMovementBlockedReason =
  | "MISSING_PREVIOUS_SNAPSHOT"
  | "MISSING_PREVIOUS_SNAPSHOT_ID"
  | "MISSING_NEW_SNAPSHOT_ID"
  | "SOURCE_MISMATCH"
  | "MARKET_MISMATCH"
  | "MARKET_NOT_SPREAD_RELATED"
  | "PREVIOUS_LINE_VALUE_INVALID"
  | "NEW_LINE_VALUE_INVALID";

export type TotalsMovementEventType = "TOTALS_MOVEMENT";

export type TotalsMovementDirection = "HIGHER" | "LOWER" | "PRICE_ONLY";

export type TotalsScope = "GAME_TOTAL" | "TEAM_TOTAL" | "ALTERNATE_TOTAL";

export type TotalsPriceSide = "OVER" | "UNDER" | "NONE" | "UNKNOWN";

export type TotalsMovementBlockedReason =
  | "MISSING_PREVIOUS_SNAPSHOT"
  | "MISSING_PREVIOUS_SNAPSHOT_ID"
  | "MISSING_NEW_SNAPSHOT_ID"
  | "SOURCE_MISMATCH"
  | "MARKET_MISMATCH"
  | "MARKET_TYPE_MISMATCH"
  | "MARKET_SUBTYPE_MISMATCH"
  | "PARTICIPANT_MISMATCH"
  | "MARKET_NOT_TOTALS_RELATED"
  | "MISSING_TIMESTAMP"
  | "LINE_VALUE_INVALID"
  | "ODDS_VALUE_INVALID";

export type MoneylineMovementEventType = "MONEYLINE_MOVEMENT";

export type MoneylineMovementDirection =
  | "FAVORITE_SHORTENED"
  | "FAVORITE_DRIFTED"
  | "UNDERDOG_SHORTENED"
  | "UNDERDOG_DRIFTED"
  | "CROSS_ZERO_TRANSITION"
  | "UNKNOWN";

export type MoneylineMovementBlockedReason =
  | "MISSING_PREVIOUS_SNAPSHOT"
  | "MISSING_PREVIOUS_SNAPSHOT_ID"
  | "MISSING_NEW_SNAPSHOT_ID"
  | "SOURCE_MISMATCH"
  | "MARKET_MISMATCH"
  | "MARKET_TYPE_MISMATCH"
  | "MARKET_NOT_MONEYLINE"
  | "MISSING_TIMESTAMP"
  | "PREVIOUS_ODDS_INVALID"
  | "NEW_ODDS_INVALID";

export type PlayerPropMovementEventType = "PLAYER_PROP_MOVEMENT";

export type PlayerPropMovementType =
  | "PROP_LINE_MOVEMENT"
  | "PROP_ODDS_MOVEMENT"
  | "PROP_LINE_AND_ODDS_MOVEMENT"
  | "PROP_AVAILABILITY_CHANGE";

export type PlayerPropMovementDirection =
  | "HIGHER"
  | "LOWER"
  | "PRICE_SHORTENED"
  | "PRICE_DRIFTED"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type PlayerPropAvailabilityStatus = "AVAILABLE" | "SUSPENDED" | "REMOVED" | "UNKNOWN";

export type PlayerPropMovementBlockedReason =
  | "MISSING_PREVIOUS_SNAPSHOT"
  | "MISSING_PREVIOUS_SNAPSHOT_ID"
  | "MISSING_NEW_SNAPSHOT_ID"
  | "SOURCE_MISMATCH"
  | "MARKET_MISMATCH"
  | "PLAYER_ID_MISSING"
  | "PLAYER_NAME_MISSING"
  | "PROP_TYPE_MISSING"
  | "PLAYER_ID_MISMATCH"
  | "PROP_TYPE_MISMATCH"
  | "MARKET_NOT_PLAYER_PROP"
  | "MISSING_TIMESTAMP"
  | "LINE_VALUE_INVALID"
  | "ODDS_VALUE_INVALID";

export type OddsShiftEventType = "ODDS_SHIFT";

export type OddsShiftType = "COMPRESSED" | "EXPANDED" | "UNCHANGED" | "INVALID";

export type OddsShiftVolatilityState = "NORMAL" | "ELEVATED" | "VOLATILE" | "UNKNOWN";

export type OddsShiftBlockedReason =
  | "MISSING_PREVIOUS_SNAPSHOT"
  | "MISSING_PREVIOUS_SNAPSHOT_ID"
  | "MISSING_NEW_SNAPSHOT_ID"
  | "SOURCE_MISMATCH"
  | "MARKET_MISMATCH"
  | "MARKET_TYPE_MISMATCH"
  | "MARKET_SUBTYPE_MISMATCH"
  | "PARTICIPANT_MISMATCH"
  | "MISSING_TIMESTAMP"
  | "PREVIOUS_ODDS_INVALID"
  | "NEW_ODDS_INVALID";

export type MovementVelocityState = "SLOW" | "NORMAL" | "FAST" | "VOLATILE" | "UNKNOWN";

export type MovementAccelerationState = "ACCELERATING" | "DECELERATING" | "STABLE" | "UNKNOWN";

export type MovementVelocityEventType =
  | SpreadMovementEventType
  | TotalsMovementEventType
  | MoneylineMovementEventType
  | PlayerPropMovementEventType
  | OddsShiftEventType;

export interface MovementVelocityInputEvent {
  event_id: UUID;
  event_type: MovementVelocityEventType | string;
  market_id: UUID;
  source_id: UUID;
  movement_size?: number | null;
  price_delta?: number | null;
  implied_probability_delta?: number | null;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
}

export interface MovementVelocityRecord {
  velocity_id: UUID;
  market_id: UUID;
  source_id: UUID;
  movement_count: number;
  total_movement_size: number;
  average_movement_size: number;
  time_window_seconds: number | null;
  average_seconds_between_moves: number | null;
  velocity_score: number | null;
  velocity_state: MovementVelocityState;
  acceleration_state: MovementAccelerationState;
  first_seen_at: ISODateTime | null;
  last_seen_at: ISODateTime | null;
  event_ids: UUID[];
  created_at: ISODateTime;
  schema_version: Version;
}

export type MovementVelocityComputationResult =
  | {
      status: "RECORDED";
      record: MovementVelocityRecord;
      duplicate: boolean;
    }
  | {
      status: "UNKNOWN";
      record: MovementVelocityRecord;
      duplicate: boolean;
      reason:
        | "INSUFFICIENT_OBSERVATIONS"
        | "MISSING_EVENT_ID"
        | "MISSING_EVENT_TYPE"
        | "NOT_MOVEMENT_EVENT"
        | "MISSING_MARKET_ID"
        | "MISSING_SOURCE_ID"
        | "MISSING_TIMESTAMP"
        | "INVALID_TIMESTAMP";
    };

export type ChangeEventStoreAcceptedEventType =
  | SpreadMovementEventType
  | TotalsMovementEventType
  | MoneylineMovementEventType
  | PlayerPropMovementEventType
  | OddsShiftEventType
  | "MOVEMENT_VELOCITY";

export type ChangeEventStoreLifecycleEventType =
  | "CHANGE_EVENT_RECEIVED"
  | "CHANGE_EVENT_VALIDATED"
  | "CHANGE_EVENT_REJECTED"
  | "CHANGE_EVENT_STORED"
  | "CHANGE_EVENT_DUPLICATE"
  | "CHANGE_EVENT_CONFLICT"
  | "CHANGE_EVENT_CORRECTION_STORED";

export type ChangeEventStoreRejectedReason =
  | "EVENT_TYPE_MISSING"
  | "EVENT_TYPE_UNKNOWN"
  | "MARKET_ID_MISSING"
  | "SOURCE_ID_MISSING"
  | "TIMESTAMP_MISSING"
  | "DETECTED_AT_MISSING"
  | "SCHEMA_VERSION_MISSING"
  | "PAYLOAD_MISSING"
  | "PREVIOUS_SNAPSHOT_ID_MISSING"
  | "NEW_SNAPSHOT_ID_MISSING"
  | "SNAPSHOT_LINKAGE_INVALID"
  | "VELOCITY_EVENT_IDS_MISSING"
  | "VELOCITY_EVENT_LINKAGE_INVALID";

export interface ChangeEventStoreInput {
  event_type: ChangeEventStoreAcceptedEventType | string;
  market_id: UUID;
  source_id: UUID;
  previous_snapshot_id?: UUID | null;
  new_snapshot_id?: UUID | null;
  previous_value?: number | null;
  new_value?: number | null;
  movement_size?: number | null;
  movement_direction?: string | null;
  velocity_state?: MovementVelocityState | null;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
  payload: Record<string, unknown>;
  event_ids?: UUID[] | null;
  first_seen_at?: ISODateTime | null;
  last_seen_at?: ISODateTime | null;
  movement_count?: number | null;
}

export interface ChangeEventRecord {
  change_event_id: UUID;
  event_type: ChangeEventStoreAcceptedEventType;
  market_id: UUID;
  source_id: UUID;
  previous_snapshot_id: UUID | null;
  new_snapshot_id: UUID | null;
  previous_value: number | null;
  new_value: number | null;
  movement_size: number | null;
  movement_direction: string | null;
  velocity_state: MovementVelocityState | null;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
  payload: Record<string, unknown>;
  payload_hash: string;
  created_at: ISODateTime;
}

export interface ChangeEventConflictRecord {
  conflict_id: UUID;
  change_event_id: UUID;
  existing_payload_hash: string;
  incoming_payload_hash: string;
  source_id: UUID;
  market_id: UUID;
  detected_at: ISODateTime;
  created_at: ISODateTime;
}

export interface ChangeEventCorrectionRecord {
  correction_event_id: UUID;
  corrected_change_event_id: UUID;
  correction_reason: string;
  correction_payload: Record<string, unknown>;
  created_at: ISODateTime;
}

export interface ChangeEventStoreLifecycleEvent {
  event_id: UUID;
  event_type: ChangeEventStoreLifecycleEventType;
  change_event_id: UUID | null;
  market_id: UUID;
  source_id: UUID;
  reason: string;
  timestamp: ISODateTime;
}

export type ChangeEventStoreResult =
  | {
      status: "STORED";
      record: ChangeEventRecord;
      duplicate: false;
      lifecycle_events: ChangeEventStoreLifecycleEvent[];
    }
  | {
      status: "DUPLICATE";
      record: ChangeEventRecord;
      duplicate: true;
      lifecycle_events: ChangeEventStoreLifecycleEvent[];
    }
  | {
      status: "CONFLICT";
      conflict: ChangeEventConflictRecord;
      existing_record: ChangeEventRecord;
      lifecycle_events: ChangeEventStoreLifecycleEvent[];
    }
  | {
      status: "REJECTED";
      reason: ChangeEventStoreRejectedReason;
      lifecycle_events: ChangeEventStoreLifecycleEvent[];
    };

export interface MarketSnapshot {
  snapshot_id: UUID;
  source_id: UUID;
  sport: string;
  league: string;
  event_id: UUID;
  market_id: UUID;
  market_type: string;
  market_subtype: string;
  participant: string | null;
  player_id: string | null;
  player_name: string | null;
  team: string | null;
  prop_type: string | null;
  availability_status: PlayerPropAvailabilityStatus;
  side: string | null;
  line_value: number | null;
  odds_value: number | null;
  timestamp: ISODateTime;
  collected_at: ISODateTime;
  schema_version: Version;
}

export interface MarketSnapshotInput {
  source_id: UUID;
  sport: string;
  league: string;
  event_id: UUID;
  market_type: string;
  market_subtype: string;
  participant?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  team?: string | null;
  prop_type?: string | null;
  availability_status?: string | null;
  side?: string | null;
  line_value?: number | null;
  odds_value?: number | null;
  timestamp: ISODateTime;
  schema_version: Version;
  raw_payload_json: unknown;
}

export interface SnapshotSourceReference {
  source_id: UUID;
  source_name: string;
  source_type: string;
  status: SourceReferenceStatus;
  version: Version;
}

export interface SnapshotValidationError {
  field: string;
  code: MarketSnapshotValidationErrorCode;
  message: string;
}

export interface SnapshotValidationRecord {
  attempted_snapshot_id: UUID;
  source_id: UUID;
  validation_errors: SnapshotValidationError[];
  raw_payload_json: unknown;
  rejection_reason: string;
  created_at: ISODateTime;
}

export interface SnapshotRecord {
  snapshot_id: UUID;
  market_id: UUID;
  source_id: UUID;
  snapshot_payload: MarketSnapshot;
  raw_payload_json: unknown;
  previous_snapshot_id: UUID | null;
  validation_errors: SnapshotValidationError[];
  status: MarketSnapshotStatus;
  created_at: ISODateTime;
  schema_version: Version;
  source_reference: SnapshotSourceReference;
}

export interface MarketSnapshotEvent {
  event_id: UUID;
  snapshot_id: UUID;
  market_id: UUID;
  source_id: UUID;
  event_type: MarketSnapshotEventType;
  severity: EventSeverity;
  reason: string;
  timestamp: ISODateTime;
}

export interface SpreadMovementRecord {
  event_id: UUID;
  event_type: SpreadMovementEventType;
  previous_snapshot_id: UUID;
  new_snapshot_id: UUID;
  previous_value: number;
  new_value: number;
  movement_size: number;
  movement_direction: SpreadMovementDirection;
  spread_effect: SpreadEffect;
  market_id: UUID;
  source_id: UUID;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
}

export interface TotalsMovementRecord {
  event_id: UUID;
  event_type: TotalsMovementEventType;
  previous_snapshot_id: UUID;
  new_snapshot_id: UUID;
  previous_total: number;
  new_total: number;
  movement_size: number;
  movement_direction: TotalsMovementDirection;
  totals_scope: TotalsScope;
  price_side: TotalsPriceSide;
  previous_odds: number | null;
  new_odds: number | null;
  odds_delta: number | null;
  market_id: UUID;
  source_id: UUID;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
}

export interface MoneylineMovementRecord {
  event_id: UUID;
  event_type: MoneylineMovementEventType;
  previous_snapshot_id: UUID;
  new_snapshot_id: UUID;
  previous_odds: number;
  new_odds: number;
  price_delta: number;
  implied_probability_previous: number;
  implied_probability_new: number;
  implied_probability_delta: number;
  movement_direction: MoneylineMovementDirection;
  market_id: UUID;
  source_id: UUID;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
}

export interface PlayerPropMovementRecord {
  event_id: UUID;
  event_type: PlayerPropMovementEventType;
  previous_snapshot_id: UUID;
  new_snapshot_id: UUID;
  player_id: string;
  player_name: string;
  team: string | null;
  prop_type: string;
  previous_line: number | null;
  new_line: number | null;
  previous_odds: number | null;
  new_odds: number | null;
  line_movement_size: number;
  odds_delta: number | null;
  movement_type: PlayerPropMovementType;
  movement_direction: PlayerPropMovementDirection;
  availability_previous: PlayerPropAvailabilityStatus;
  availability_new: PlayerPropAvailabilityStatus;
  market_id: UUID;
  market_subtype: string;
  source_id: UUID;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
}

export interface OddsShiftRecord {
  event_id: UUID;
  event_type: OddsShiftEventType;
  previous_snapshot_id: UUID;
  new_snapshot_id: UUID;
  previous_odds: number;
  new_odds: number;
  price_delta: number;
  implied_probability_previous: number;
  implied_probability_new: number;
  implied_probability_delta: number;
  shift_type: OddsShiftType;
  line_changed: boolean;
  price_only: boolean;
  silent_market_pressure: boolean;
  volatility_state: OddsShiftVolatilityState;
  market_id: UUID;
  source_id: UUID;
  timestamp: ISODateTime;
  detected_at: ISODateTime;
  schema_version: Version;
}

export type SpreadMovementDetectionResult =
  | {
      status: "RECORDED";
      event: SpreadMovementRecord;
      duplicate: boolean;
    }
  | {
      status: "NO_MOVEMENT";
      previous_snapshot_id: UUID;
      new_snapshot_id: UUID;
      movement_size: 0;
    }
  | {
      status: "BLOCKED";
      reason: SpreadMovementBlockedReason;
    };

export type TotalsMovementDetectionResult =
  | {
      status: "RECORDED";
      event: TotalsMovementRecord;
      duplicate: boolean;
    }
  | {
      status: "NO_MOVEMENT";
      previous_snapshot_id: UUID;
      new_snapshot_id: UUID;
      movement_size: 0;
      odds_delta: 0;
    }
  | {
      status: "BLOCKED";
      reason: TotalsMovementBlockedReason;
    };

export type MoneylineMovementDetectionResult =
  | {
      status: "RECORDED";
      event: MoneylineMovementRecord;
      duplicate: boolean;
    }
  | {
      status: "NO_MOVEMENT";
      previous_snapshot_id: UUID;
      new_snapshot_id: UUID;
      price_delta: 0;
    }
  | {
      status: "BLOCKED";
      reason: MoneylineMovementBlockedReason;
    };

export type PlayerPropMovementDetectionResult =
  | {
      status: "RECORDED";
      event: PlayerPropMovementRecord;
      duplicate: boolean;
    }
  | {
      status: "NO_MOVEMENT";
      previous_snapshot_id: UUID;
      new_snapshot_id: UUID;
      line_movement_size: 0;
      odds_delta: 0;
    }
  | {
      status: "BLOCKED";
      reason: PlayerPropMovementBlockedReason;
    };

export type OddsShiftDetectionResult =
  | {
      status: "RECORDED";
      event: OddsShiftRecord;
      duplicate: boolean;
    }
  | {
      status: "NO_MOVEMENT";
      previous_snapshot_id: UUID;
      new_snapshot_id: UUID;
      price_delta: 0;
    }
  | {
      status: "BLOCKED";
      reason: OddsShiftBlockedReason;
    };

export type SnapshotIntakeResult =
  | {
      status: "ACCEPTED";
      record: SnapshotRecord;
      events: MarketSnapshotEvent[];
      duplicate: boolean;
    }
  | {
      status: "REJECTED";
      attempted_snapshot_id: UUID;
      snapshot_status: MarketSnapshotStatus;
      validation_errors: SnapshotValidationError[];
      audit_record: SnapshotValidationRecord;
      events: MarketSnapshotEvent[];
    };
