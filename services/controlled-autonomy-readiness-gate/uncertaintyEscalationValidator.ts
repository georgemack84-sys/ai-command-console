import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateUncertaintyEscalation(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (normalized.includes("escalationsuppression") || normalized.includes("hiddenscheduling")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ESCALATION_SUPPRESSION",
      message: "Escalation suppression or hidden scheduling markers were detected.",
      path: "metadata",
    }));
  }
  if (!input.constitutionalReadinessResult.escalationReadiness.escalationStable) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ESCALATION_NOT_DETERMINISTIC",
      message: "Escalation semantics are not deterministic.",
      path: "constitutionalReadinessResult.escalationReadiness.escalationStable",
    }));
  }
  return Object.freeze(errors);
}
