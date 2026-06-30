import { validateMarketObservationSchema } from "../../markets";
import type { MarketObservation } from "../../markets";
import type { StageVerificationResult } from "../records/verificationResult";

export function verifyMarketSchema(
  observation: Partial<MarketObservation> & Record<string, unknown>,
): StageVerificationResult {
  const result = validateMarketObservationSchema(observation);
  if (result.status === "VALID") {
    return { status: "PASSED" };
  }

  if (result.reasons.some((reason) => reason.includes("market_type is invalid"))) {
    return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "MARKET_TYPE_UNKNOWN" };
  }

  if (result.reasons.some((reason) => reason.includes("schema_version is required"))) {
    return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "SCHEMA_VERSION_MISSING" };
  }

  if (result.reasons.some((reason) => reason.includes("schema_version is unsupported"))) {
    return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "SCHEMA_VERSION_UNSUPPORTED" };
  }

  if (result.reasons.some((reason) => reason.includes("raw_values is required") || reason.includes("raw_values.raw_payload"))) {
    return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "RAW_VALUES_MISSING" };
  }

  if (result.reasons.some((reason) => reason.includes("must be") || reason.includes("participant"))) {
    return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "TYPE_SPECIFIC_RULE_FAILED" };
  }

  return { status: "FAILED", failed_stage: "SCHEMA_VALIDATION", failure_reason: "SCHEMA_INVALID" };
}
