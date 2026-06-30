import type { ISODateTime, UUID } from "../../../core";
import type { MarketObservationSchemaVersion } from "../versioning/marketSchemaVersion";

export type MarketType = "SPREAD" | "MONEYLINE" | "TOTALS" | "PLAYER_PROP" | "ALTERNATE_LINE";

export type PlayerPropSubtype =
  | "POINTS"
  | "REBOUNDS"
  | "ASSISTS"
  | "THREES"
  | "SAVES"
  | "STRIKEOUTS"
  | "TOUCHDOWNS";

export interface RawMarketValues {
  raw_payload: unknown;
  raw_line_value: unknown;
  raw_odds_value: unknown;
  raw_participant: unknown;
  raw_market_name: unknown;
  received_at: ISODateTime;
}

export interface MarketObservation {
  market_id: UUID;
  sport: string;
  league: string;
  event_id: UUID;
  market_type: MarketType;
  market_subtype: string;
  participant: string;
  line_value: number | null;
  odds_value: number;
  timestamp: ISODateTime;
  source_id: UUID;
  ownership_hash: string;
  schema_version: MarketObservationSchemaVersion;
  raw_values: RawMarketValues;
}

export interface SpreadObservation extends MarketObservation {
  market_type: "SPREAD";
  line_value: number;
}

export interface MoneylineObservation extends MarketObservation {
  market_type: "MONEYLINE";
  line_value: null;
}

export interface TotalsObservation extends MarketObservation {
  market_type: "TOTALS";
  participant: "OVER" | "UNDER";
  line_value: number;
}

export interface PlayerPropObservation extends MarketObservation {
  market_type: "PLAYER_PROP";
  market_subtype: PlayerPropSubtype | string;
  line_value: number;
}

export interface AlternateLineObservation extends MarketObservation {
  market_type: "ALTERNATE_LINE";
  line_value: number;
  parent_market_id?: UUID;
}

export type TypedMarketObservation =
  | SpreadObservation
  | MoneylineObservation
  | TotalsObservation
  | PlayerPropObservation
  | AlternateLineObservation;

export interface MarketObservationValidationResult {
  status: "VALID" | "REJECTED";
  reasons: string[];
}
