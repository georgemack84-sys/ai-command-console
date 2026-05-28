export type ConstitutionalReadinessLevel =
  | "CR0_UNVERIFIED"
  | "CR1_REPLAY_VALID"
  | "CR2_GOVERNANCE_VALID"
  | "CR3_APPROVAL_VALID"
  | "CR4_OVERRIDE_VALID"
  | "CR5_ESCALATION_VALID"
  | "CR6_CONTAINMENT_VALID"
  | "CR7_CONSTITUTIONALLY_READY";

export type ReadinessAutonomyState =
  | "observe"
  | "recommend"
  | "prepare"
  | "escalate"
  | "paused"
  | "denied"
  | "revoked"
  | "archived";
