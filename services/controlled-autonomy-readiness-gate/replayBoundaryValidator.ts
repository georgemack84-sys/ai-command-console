import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateReplayBoundary(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (normalized.includes("inferredreconstruction") || normalized.includes("missinglineageassumption")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_REPLAY_BOUNDARY_VIOLATION",
      message: "Inferred replay reconstruction or missing-lineage assumption markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
