export type EscalationState =
  | "stable"
  | "degraded"
  | "elevated"
  | "restricted"
  | "frozen"
  | "critical";

export type EscalationReason =
  | "confidence_degradation"
  | "replay_break"
  | "governance_mismatch"
  | "approval_incomplete"
  | "orchestration_ambiguity"
  | "boundary_drift"
  | "policy_uncertainty"
  | "unknown_state";
