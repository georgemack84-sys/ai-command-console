import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function verifyApprovalReplay(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("approvalreplayambiguity") || normalized.includes("staleapproval")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_APPROVAL_REPLAY_AMBIGUITY",
      message: "Approval replay ambiguity or stale approval markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
