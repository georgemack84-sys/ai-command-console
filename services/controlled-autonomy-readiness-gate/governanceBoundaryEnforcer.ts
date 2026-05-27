import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function enforceGovernanceBoundary(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (normalized.includes("policymismatch") || normalized.includes("missinggovernancelineage")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_BOUNDARY_VIOLATION",
      message: "Policy mismatch or missing governance lineage markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
