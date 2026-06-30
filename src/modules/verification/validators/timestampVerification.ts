import { isNonEmptyString, isValidTimestamp } from "../../../core";
import type { MarketObservation } from "../../markets";
import type { StageVerificationResult } from "../records/verificationResult";

export function verifyObservationTimestamps(
  observation: Partial<MarketObservation> & Record<string, unknown>,
): StageVerificationResult {
  if (!isNonEmptyString(observation.timestamp)) {
    return { status: "FAILED", failed_stage: "TIMESTAMP_VALIDATION", failure_reason: "TIMESTAMP_MISSING" };
  }

  if (!isValidTimestamp(observation.timestamp)) {
    return { status: "FAILED", failed_stage: "TIMESTAMP_VALIDATION", failure_reason: "TIMESTAMP_INVALID" };
  }

  const rawValues = observation.raw_values as { received_at?: unknown } | undefined;
  if (!rawValues || !isNonEmptyString(rawValues.received_at)) {
    return { status: "FAILED", failed_stage: "TIMESTAMP_VALIDATION", failure_reason: "RECEIVED_AT_MISSING" };
  }

  if (!isValidTimestamp(rawValues.received_at)) {
    return { status: "FAILED", failed_stage: "TIMESTAMP_VALIDATION", failure_reason: "RECEIVED_AT_INVALID" };
  }

  return { status: "PASSED" };
}
