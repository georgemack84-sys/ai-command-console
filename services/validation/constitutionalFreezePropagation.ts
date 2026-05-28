import { dedupeReasons } from "./validationPolicies";
import type { GovernanceDecision } from "./validationContracts";

export function evaluateConstitutionalFreezePropagation(input: {
  governanceDecision: GovernanceDecision;
  disputed: boolean;
  containmentActive: boolean;
  constitutionalConflict: boolean;
  operatorSupremacyPreserved: boolean;
  immutableAuditIdPresent: boolean;
  driftDetected: boolean;
  versionConflict: boolean;
}) {
  const freezeReasons = dedupeReasons([
    ...(input.disputed ? ["governance_disputed"] : []),
    ...(["FREEZE", "BLOCKED", "DISPUTED"].includes(input.governanceDecision) ? [`governance_decision:${input.governanceDecision}`] : []),
    ...(input.containmentActive ? ["containment_active"] : []),
    ...(input.constitutionalConflict ? ["constitutional_conflict"] : []),
    ...(input.operatorSupremacyPreserved ? [] : ["operator_supremacy_not_preserved"]),
    ...(input.immutableAuditIdPresent ? [] : ["immutable_audit_lineage_missing"]),
    ...(input.driftDetected ? ["validation_drift_detected"] : []),
    ...(input.versionConflict ? ["validation_version_conflict"] : []),
  ]);

  return {
    frozen: freezeReasons.length > 0,
    freezeReasons,
  };
}
