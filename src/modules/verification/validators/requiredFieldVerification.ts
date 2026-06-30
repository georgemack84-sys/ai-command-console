import { isNonEmptyString } from "../../../core";
import type { MarketObservation } from "../../markets";
import type { StageVerificationResult } from "../records/verificationResult";

const requiredFields = [
  "market_id",
  "sport",
  "league",
  "event_id",
  "market_type",
  "market_subtype",
  "participant",
  "odds_value",
  "timestamp",
  "source_id",
  "ownership_hash",
  "schema_version",
  "raw_values",
] as const;

export function verifyRequiredFields(observation: Partial<MarketObservation> & Record<string, unknown>): StageVerificationResult {
  for (const field of requiredFields) {
    const value = observation[field];
    if (value === null || value === undefined || (typeof value === "string" && !isNonEmptyString(value))) {
      return { status: "FAILED", failed_stage: "REQUIRED_FIELD_VALIDATION", failure_reason: `${field.toUpperCase()}_MISSING` };
    }
  }

  return { status: "PASSED" };
}
