import type { ApprovalConflictWeaknessSeverity } from "./approvalConflictStates";

export type ApprovalConflictWeaknessClass =
  | "APPROVAL_DEPENDENCY_REVOCATION_RISK"
  | "APPROVAL_STALE_REPLAY_RISK"
  | "APPROVAL_OPERATOR_CONFLICT_RISK"
  | "APPROVAL_ESCALATION_OVERRIDE_RISK"
  | "APPROVAL_INHERITANCE_RISK"
  | "APPROVAL_CIRCULAR_CHAIN_RISK"
  | "APPROVAL_GOVERNANCE_LINKAGE_RISK"
  | "APPROVAL_REPLAY_BREAK_RISK"
  | "APPROVAL_ISOLATION_RISK"
  | "APPROVAL_HIDDEN_ORCHESTRATION_RISK";

export type ApprovalConflictWeakness = Readonly<{
  weaknessId: string;
  conflictId: string;
  classification: ApprovalConflictWeaknessClass;
  severity: ApprovalConflictWeaknessSeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;
