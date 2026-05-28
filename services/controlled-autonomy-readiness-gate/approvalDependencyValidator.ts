import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateApprovalDependencies(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (!input.constitutionalReadinessResult.approvalReadiness.approvalDeterministic) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_APPROVAL_UNSTABLE",
      message: "Approval determinism could not be certified.",
      path: "constitutionalReadinessResult.approvalReadiness.approvalDeterministic",
    }));
  }
  if (normalized.includes("approvalinstability") || normalized.includes("approvalinheritance")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_APPROVAL_INHERITANCE",
      message: "Approval instability or inheritance markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
