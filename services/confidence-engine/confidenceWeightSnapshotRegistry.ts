import { SUPPORTED_WEIGHT_TABLE_VERSIONS } from "./contracts/confidenceContracts";
import type { DeterministicConfidenceError } from "./types/confidenceTypes";

export function resolveConfidenceWeightSnapshot(version: string): {
  weightSnapshotId: string;
  errors: readonly DeterministicConfidenceError[];
} {
  if (!SUPPORTED_WEIGHT_TABLE_VERSIONS.includes(version as (typeof SUPPORTED_WEIGHT_TABLE_VERSIONS)[number])) {
    return {
      weightSnapshotId: `confidence-weight:${version}`,
      errors: Object.freeze([{
        code: "DETERMINISTIC_CONFIDENCE_WEIGHT_TABLE_MISMATCH",
        message: "Confidence weight table version is not registered for deterministic replay.",
        path: "weightTableVersion",
      }]),
    };
  }

  return {
    weightSnapshotId: `confidence-weight:${version}`,
    errors: Object.freeze([]),
  };
}
