export type ConstitutionalState =
  | "CONSTITUTIONAL"
  | "RESTRICTED"
  | "DISPUTED"
  | "ESCALATED"
  | "CONTAINED"
  | "DENIED"
  | "QUARANTINED"
  | "VIOLATING"
  | "LOCKED"
  | "EMERGENCY_GOVERNANCE";

export const CONSTITUTIONAL_POLICY_REGISTRY: Record<
  ConstitutionalState,
  { allow: boolean; requiredApprovals: string[]; priority: number }
> = {
  DENIED: { allow: false, requiredApprovals: ["constitutional_governance_review"], priority: 0 },
  DISPUTED: { allow: false, requiredApprovals: ["disputed_truth_review"], priority: 1 },
  EMERGENCY_GOVERNANCE: { allow: false, requiredApprovals: ["emergency_governance_review"], priority: 2 },
  CONTAINED: { allow: false, requiredApprovals: ["containment_review"], priority: 3 },
  ESCALATED: { allow: false, requiredApprovals: ["escalation_review"], priority: 4 },
  RESTRICTED: { allow: true, requiredApprovals: ["operator_review"], priority: 5 },
  CONSTITUTIONAL: { allow: true, requiredApprovals: [], priority: 6 },
  QUARANTINED: { allow: false, requiredApprovals: ["quarantine_review"], priority: 0 },
  VIOLATING: { allow: false, requiredApprovals: ["violation_review"], priority: 0 },
  LOCKED: { allow: false, requiredApprovals: ["lock_review"], priority: 0 },
};
