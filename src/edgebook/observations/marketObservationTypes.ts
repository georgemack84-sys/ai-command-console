export type MarketType =
  | "spread"
  | "alternate_spread"
  | "moneyline"
  | "totals"
  | "alternate_total"
  | "team_total"
  | "player_props"
  | "team_props"
  | "game_props"
  | "special_props";

export interface MarketObservation {
  observation_id: string;
  market_id: string;
  sport: string;
  league: string;
  event_id: string;
  event_name: string;
  market_type: MarketType;
  market_subtype: string;
  participant: string;
  line_value: number | null;
  odds_value: number;
  implied_probability: number;
  source_id: string;
  timestamp: string;
  collection_sequence: number;
  ownership_hash: string;
  schema_version: string;
}

export interface RawMarketObservation {
  raw_market_observation: MarketObservation;
  source_reference: {
    source_id: string;
    observed_at: string;
  };
  validation_record: {
    validation_id: string;
    status: "VALID" | "INVALID" | "LIMITED" | "REJECTED";
    reasons: string[];
    timestamp: string;
  };
  ownership_record: {
    ownership_hash: string;
    owner_id: string;
    tenant_id: string;
    source_id: string;
    market_id: string;
    timestamp: string;
    version: string;
  };
}
