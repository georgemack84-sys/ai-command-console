import type { ConstitutionalReplayStabilityError, ReplayStabilityClassification } from "./replayStateTypes";

export function resolveReplayFailureState(errors: readonly ConstitutionalReplayStabilityError[]): ReplayStabilityClassification {
  if (errors.some((item) =>
    item.code.includes("ISOLATION")
    || item.code.includes("BOUNDARY")
    || item.code.includes("TOPOLOGY")
    || item.code.includes("INFERRED")
    || item.code.includes("REPLAY_CORRUPTION"))) {
    return "INVALID";
  }
  if (errors.some((item) =>
    item.code.includes("GOVERNANCE")
    || item.code.includes("CONTAINMENT")
    || item.code.includes("VALIDATOR_MISMATCH")
    || item.code.includes("ESCALATION_CORRUPTION")
    || item.code.includes("CONFIDENCE_CORRUPTION"))) {
    return "FROZEN";
  }
  if (errors.some((item) =>
    item.code.includes("DRIFT")
    || item.code.includes("LINEAGE_BREAK")
    || item.code.includes("OVERRIDE_CORRUPTION"))) {
    return "DISPUTED";
  }
  return "STABLE";
}
