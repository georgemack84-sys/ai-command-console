import { SUPPORTED_SCORING_MODEL_VERSIONS } from "./contracts/confidenceContracts";
import type { DeterministicConfidenceError } from "./types/confidenceTypes";

export function resolveConfidenceModelSnapshot(version: string): {
  modelSnapshotId: string;
  errors: readonly DeterministicConfidenceError[];
} {
  if (!SUPPORTED_SCORING_MODEL_VERSIONS.includes(version as (typeof SUPPORTED_SCORING_MODEL_VERSIONS)[number])) {
    return {
      modelSnapshotId: `confidence-model:${version}`,
      errors: Object.freeze([{
        code: "DETERMINISTIC_CONFIDENCE_SCORING_VERSION_UNKNOWN",
        message: "Confidence scoring model version is not registered for deterministic replay.",
        path: "scoringModelVersion",
      }]),
    };
  }

  return {
    modelSnapshotId: `confidence-model:${version}`,
    errors: Object.freeze([]),
  };
}
