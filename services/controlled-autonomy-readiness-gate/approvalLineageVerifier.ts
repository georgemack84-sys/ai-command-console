import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function verifyApprovalLineage(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.evidence.evidenceRefs.length === 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_APPROVAL_LINEAGE_MISSING",
      message: "Approval lineage evidence is missing from constitutional readiness evidence.",
      path: "constitutionalReadinessResult.evidence.evidenceRefs",
    })]);
  }
  return Object.freeze([]);
}
