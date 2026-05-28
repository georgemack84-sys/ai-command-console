import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateGovernanceSupremacy(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (!input.constitutionalReadinessResult.governanceBinding.governanceBound) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_NOT_IMMUTABLE",
      message: "Governance binding is not immutable or detached from readiness.",
      path: "constitutionalReadinessResult.governanceBinding.governanceBound",
    }));
  }
  if (normalized.includes("governancesuppression") || normalized.includes("governancebypass")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_SUPPRESSION",
      message: "Governance suppression or bypass markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
