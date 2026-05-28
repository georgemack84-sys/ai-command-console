import type { ConstitutionalWeaknessSeverity } from "./attackStates";

export type ConstitutionalWeaknessClass =
  | "GOVERNANCE_BYPASS_RISK"
  | "ESCALATION_ABUSE_RISK"
  | "DEPENDENCY_INTEGRITY_RISK"
  | "CONFIDENCE_SPOOF_RISK"
  | "REPLAY_BREAK_RISK"
  | "APPROVAL_TRACEABILITY_RISK"
  | "AUTHORITY_EXPANSION_RISK"
  | "HIDDEN_EXECUTION_RISK"
  | "ORCHESTRATION_DRIFT_RISK"
  | "ISOLATION_BOUNDARY_RISK";

export type ConstitutionalWeakness = Readonly<{
  weaknessId: string;
  attackId: string;
  classification: ConstitutionalWeaknessClass;
  severity: ConstitutionalWeaknessSeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;
