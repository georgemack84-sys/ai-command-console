import type { DeterministicConfidenceError, DeterministicConfidenceStatus, ReplayDrift } from "./types/confidenceTypes";

export function resolveConfidenceStatus(input: {
  errors: readonly DeterministicConfidenceError[];
  drifts: readonly ReplayDrift[];
  frozenByContainment: boolean;
}): DeterministicConfidenceStatus {
  if (input.errors.length > 0) {
    if (input.errors.some((error) => error.code === "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT") || input.frozenByContainment || input.drifts.some((drift) => drift.frozen)) {
      return "FROZEN";
    }
    return "FAILED_CLOSED";
  }

  return input.frozenByContainment ? "FROZEN" : "COMPLETED";
}
