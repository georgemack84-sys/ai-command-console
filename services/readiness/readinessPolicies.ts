import type { AutonomousRecoveryReadinessState } from "./readinessTypes";
import { CONSTITUTIONAL_READINESS_THRESHOLDS } from "./readinessThresholds";

export function determineReadinessState(input: {
  constitutionalBlocked: boolean;
  disputed: boolean;
  missingRollback: boolean;
  containmentUnreliable: boolean;
  auditInsufficient: boolean;
  score: number;
  degraded: boolean;
  governanceIncomplete: boolean;
  strongSignals: boolean;
}) : AutonomousRecoveryReadinessState {
  if (input.constitutionalBlocked) return "CONSTITUTIONALLY_BLOCKED";
  if (input.disputed) return "DISPUTED";
  if (input.missingRollback || input.containmentUnreliable || input.auditInsufficient || input.score < 35) return "NOT_READY";
  if (input.degraded) return "DEGRADED";
  if (input.governanceIncomplete || input.score < 70) return "GOVERNANCE_REVIEW_REQUIRED";
  if (!input.strongSignals || input.score < 82) return "LIMITED_READINESS";
  return "SUPERVISED_READY";
}

export function determineConstitutionalReadinessState(input: {
  readinessConfidence: number;
  blockingRisks: string[];
  warnings: string[];
  constitutionalSafe: boolean;
}) {
  if (!input.constitutionalSafe || input.blockingRisks.length > 0) return "GOVERNANCE_BLOCKED" as const;
  if (input.readinessConfidence < CONSTITUTIONAL_READINESS_THRESHOLDS.low) return "READINESS_CONFIDENCE_LOW" as const;
  if (input.warnings.length > 0 || input.readinessConfidence < CONSTITUTIONAL_READINESS_THRESHOLDS.medium) {
    return "OPERATOR_REVIEW_REQUIRED" as const;
  }
  if (input.readinessConfidence < CONSTITUTIONAL_READINESS_THRESHOLDS.high) return "CONDITIONALLY_READY" as const;
  return "LIMITED_READY" as const;
}
