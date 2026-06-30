import { isNonEmptyString, isValidTimestamp } from "../../../core";
import type { MarketObservation, MarketObservationValidationResult, MarketType } from "../schemas/marketObservationTypes";
import { isSupportedMarketObservationSchemaVersion } from "../versioning/marketSchemaVersion";

export const validMarketTypes: ReadonlySet<MarketType> = new Set([
  "SPREAD",
  "MONEYLINE",
  "TOTALS",
  "PLAYER_PROP",
  "ALTERNATE_LINE",
]);

export const prohibitedMarketObservationFields = [
  "edge_score",
  "confidence_score",
  "recommendation",
  "pick",
  "expected_value",
  "wager_instruction",
  "bet_advice",
  "projected_winner",
] as const;

function hasOwn(value: object, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, field);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateMarketObservationSchema(
  observation: Partial<MarketObservation> & Record<string, unknown>,
): MarketObservationValidationResult {
  const reasons: string[] = [];

  for (const field of prohibitedMarketObservationFields) {
    if (hasOwn(observation, field)) {
      reasons.push(`${field} is prohibited during EdgeBook Phase 1.2`);
    }
  }

  for (const field of [
    "market_id",
    "sport",
    "league",
    "event_id",
    "market_type",
    "market_subtype",
    "participant",
    "source_id",
    "ownership_hash",
    "schema_version",
  ] as const) {
    if (!isNonEmptyString(observation[field])) {
      reasons.push(`${field} is required`);
    }
  }

  if (!isNumber(observation.odds_value)) {
    reasons.push("odds_value must be a number");
  }

  if (!isValidTimestamp(observation.timestamp)) {
    reasons.push("timestamp must be valid");
  }

  if (!validMarketTypes.has(observation.market_type as MarketType)) {
    reasons.push("market_type is invalid");
  }

  if (!isSupportedMarketObservationSchemaVersion(observation.schema_version)) {
    reasons.push("schema_version is unsupported");
  }

  if (!observation.raw_values || typeof observation.raw_values !== "object") {
    reasons.push("raw_values is required");
  } else {
    const rawValues = observation.raw_values as unknown as Record<string, unknown>;
    if (!hasOwn(rawValues, "raw_payload")) {
      reasons.push("raw_values.raw_payload must be preserved");
    }
    if (!isValidTimestamp(rawValues.received_at)) {
      reasons.push("raw_values.received_at must be valid");
    }
  }

  switch (observation.market_type) {
    case "SPREAD":
      if (!isNumber(observation.line_value)) reasons.push("SPREAD line_value must be a number");
      if (!isNonEmptyString(observation.participant)) reasons.push("SPREAD participant is required");
      break;
    case "MONEYLINE":
      if (observation.line_value !== null) reasons.push("MONEYLINE line_value must be null");
      if (!isNumber(observation.odds_value)) reasons.push("MONEYLINE odds_value must be a number");
      break;
    case "TOTALS":
      if (observation.participant !== "OVER" && observation.participant !== "UNDER") {
        reasons.push("TOTALS participant must be OVER or UNDER");
      }
      if (!isNumber(observation.line_value)) reasons.push("TOTALS line_value must be a number");
      break;
    case "PLAYER_PROP":
      if (!isNonEmptyString(observation.participant)) reasons.push("PLAYER_PROP participant is required");
      if (!isNonEmptyString(observation.market_subtype)) reasons.push("PLAYER_PROP market_subtype is required");
      if (!isNumber(observation.line_value)) reasons.push("PLAYER_PROP line_value must be a number");
      break;
    case "ALTERNATE_LINE":
      if (!isNonEmptyString(observation.participant)) reasons.push("ALTERNATE_LINE participant is required");
      if (!isNonEmptyString(observation.market_subtype)) reasons.push("ALTERNATE_LINE market_subtype is required");
      if (!isNumber(observation.line_value)) reasons.push("ALTERNATE_LINE line_value must be a number");
      break;
    default:
      break;
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}
