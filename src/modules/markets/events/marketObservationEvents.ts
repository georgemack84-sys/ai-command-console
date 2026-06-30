import type { EventSeverity, ISODateTime, UUID } from "../../../core";

export type MarketObservationEventType =
  | "MARKET_OBSERVATION_SCHEMA_VALIDATED"
  | "MARKET_OBSERVATION_SCHEMA_REJECTED"
  | "MARKET_TYPE_INVALID"
  | "MARKET_REQUIRED_FIELD_MISSING"
  | "MARKET_SCHEMA_VERSION_INVALID"
  | "RAW_VALUES_MISSING"
  | "PROHIBITED_INTELLIGENCE_FIELD_REJECTED";

export interface MarketObservationEvent {
  event_id: UUID;
  market_id: UUID;
  event_type: MarketObservationEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
}

export function createMarketObservationEvent(input: {
  market_id: UUID;
  event_type: MarketObservationEventType;
  reason: string;
  timestamp?: ISODateTime;
  severity?: EventSeverity;
}): MarketObservationEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `market_event_${input.market_id}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    market_id: input.market_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
  });
}
