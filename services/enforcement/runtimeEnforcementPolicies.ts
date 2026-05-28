export const RUNTIME_ENFORCEMENT_THRESHOLDS = {
  minimumEnforcementConfidence: 0.6,
  supervisionRequiredEscalationPressure: 0.65,
} as const;

export function evaluateRuntimeEnforcementPolicies(input: {
  governanceAllowed: boolean;
  governanceConfidence: number;
  constitutionalState: string;
  disputedTruthPresent: boolean;
  containmentRequired: boolean;
  escalationRequired: boolean;
  escalationLineagePresent: boolean;
  emergencyLockActive: boolean;
  sovereigntyState?: string;
  immutableAuditAvailable: boolean;
  supervisionState?: string;
}) {
  const blockedReasons: string[] = [];

  if (!input.immutableAuditAvailable) blockedReasons.push("immutable_audit_unavailable");
  if (input.disputedTruthPresent) blockedReasons.push("disputed_truth_blocks_execution");
  if (!input.governanceAllowed || input.constitutionalState === "DENIED") blockedReasons.push("constitutional_denial_active");
  if (input.governanceConfidence < RUNTIME_ENFORCEMENT_THRESHOLDS.minimumEnforcementConfidence) {
    blockedReasons.push("governance_confidence_below_threshold");
  }
  if (["DISPUTED", "LOCKED", "EMERGENCY_GOVERNANCE"].includes(input.constitutionalState)) {
    blockedReasons.push("ambiguous_or_locked_governance");
  }
  if (input.containmentRequired) blockedReasons.push("containment_precedence_active");
  if (input.emergencyLockActive) blockedReasons.push("emergency_lock_active");
  if (input.escalationRequired && !input.escalationLineagePresent) blockedReasons.push("missing_escalation_lineage");
  if (["CRITICAL", "COLLAPSING", "EMERGENCY_CONTAINMENT"].includes(input.sovereigntyState ?? "")) {
    blockedReasons.push("sovereignty_state_blocks_execution");
  }
  if (["BLOCKED", "FROZEN", "DISPUTED", "CONTAINING"].includes(input.supervisionState ?? "")) {
    blockedReasons.push("supervision_state_blocks_execution");
  }

  return {
    minimumEnforcementConfidence: RUNTIME_ENFORCEMENT_THRESHOLDS.minimumEnforcementConfidence,
    blockedReasons: Array.from(new Set(blockedReasons)),
  };
}
