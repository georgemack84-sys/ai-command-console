import type { MarketObservation, MarketType } from "./marketObservationTypes";

const supportedMarketTypes: ReadonlySet<MarketType> = new Set([
  "spread",
  "alternate_spread",
  "moneyline",
  "totals",
  "alternate_total",
  "team_total",
  "player_props",
  "team_props",
  "game_props",
  "special_props",
]);

export interface ObservationValidationResult {
  status: "VALID" | "INVALID" | "REJECTED";
  reasons: string[];
}

export function validateMarketObservation(observation: Partial<MarketObservation>): ObservationValidationResult {
  const reasons: string[] = [];

  const requiredStringFields: Array<keyof MarketObservation> = [
    "observation_id",
    "market_id",
    "sport",
    "league",
    "event_id",
    "event_name",
    "market_type",
    "market_subtype",
    "participant",
    "source_id",
    "timestamp",
    "ownership_hash",
    "schema_version",
  ];

  for (const field of requiredStringFields) {
    if (typeof observation[field] !== "string" || String(observation[field]).trim() === "") {
      reasons.push(`${field} is required`);
    }
  }

  if (observation.market_type && !supportedMarketTypes.has(observation.market_type)) {
    reasons.push("market_type is unsupported");
  }

  if (typeof observation.odds_value !== "number" || Number.isNaN(observation.odds_value)) {
    reasons.push("odds_value must be numeric");
  }

  if (
    typeof observation.implied_probability !== "number" ||
    observation.implied_probability < 0 ||
    observation.implied_probability > 1
  ) {
    reasons.push("implied_probability must be between 0 and 1");
  }

  if (typeof observation.collection_sequence !== "number" || observation.collection_sequence < 0) {
    reasons.push("collection_sequence must be a non-negative number");
  }

  if (observation.line_value !== null && typeof observation.line_value !== "number") {
    reasons.push("line_value must be numeric or null");
  }

  if (observation.timestamp && Number.isNaN(Date.parse(observation.timestamp))) {
    reasons.push("timestamp must be parseable");
  }

  return {
    status: reasons.length === 0 ? "VALID" : "REJECTED",
    reasons,
  };
}
