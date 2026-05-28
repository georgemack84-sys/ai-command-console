import type { ConstitutionalEnforcementAction } from "../decision/recoveryDecisionTypes";
import { compareConstitutionalActions } from "./recoveryConstraints";

export function evaluateRecoveryConstitution(input: {
  executionId: string;
  governanceDisputes?: string[];
  immutableEvidenceValid?: boolean;
  replayVerificationState?: string;
  operatorFreeze?: boolean;
  leaseViolation?: boolean;
  auditSuppressed?: boolean;
  forecast?: {
    summary?: {
      advisoryOnly?: boolean;
      collapseRisk?: number;
      containmentPressure?: number;
      governanceInstabilityRisk?: number;
    };
  };
}) {
  const reasons: string[] = [];
  const violations: string[] = [];
  let requiredAction: ConstitutionalEnforcementAction = "ALLOW";

  const elevate = (action: ConstitutionalEnforcementAction, reason: string, violation?: string) => {
    if (compareConstitutionalActions(action, requiredAction) < 0) {
      requiredAction = action;
    }
    reasons.push(reason);
    if (violation) {
      violations.push(violation);
    }
  };

  if (input.governanceDisputes?.length) {
    elevate("DENY", "governance_dispute_present", "disputed_truth_blocks_recovery");
  }
  if (input.immutableEvidenceValid === false) {
    elevate("DENY", "immutable_evidence_invalid", "immutable_evidence_protected");
  }
  if (input.replayVerificationState === "DIVERGED") {
    elevate("FREEZE", "replay_divergence_detected", "replay_history_immutable");
  }
  if (input.operatorFreeze) {
    elevate("FREEZE", "operator_freeze_enforced", "freeze_authority_enforced");
  }
  if (input.leaseViolation) {
    elevate("DENY", "lease_authority_violation", "lease_authority_violation");
  }
  if (input.auditSuppressed) {
    elevate("DENY", "audit_suppression_detected", "audit_evidence_protected");
  }
  if ((input.forecast?.summary?.collapseRisk ?? 0) >= 0.8) {
    elevate("CONTAIN", "forecast_collapse_risk_high", "forecast_restriction_increase");
  }
  if ((input.forecast?.summary?.governanceInstabilityRisk ?? 0) >= 0.7) {
    elevate("ESCALATE", "forecast_governance_instability_high");
  }
  if ((input.forecast?.summary?.containmentPressure ?? 0) >= 0.65) {
    elevate("CONTAIN", "forecast_containment_pressure_high");
  }

  return {
    requiredAction,
    reasons: Array.from(new Set(reasons)),
    violations: Array.from(new Set(violations)),
    evidence: [],
  };
}
