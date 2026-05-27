import type { GovernanceEnvelope } from "./execution-truth-types";
import type { DeterministicRiskProfile } from "./execution-truth-types";
import type { SequentialDependencyValidationResult } from "../dependencies";

export function buildGovernanceEnvelope(
  riskProfile: DeterministicRiskProfile,
  dependencyValidation: SequentialDependencyValidationResult,
): GovernanceEnvelope {
  const requiredApprovals = new Set<string>();
  const blockedReasons: string[] = [];
  let escalationRequired = false;

  if (!dependencyValidation.ok) {
    blockedReasons.push("Dependency validation failed.");
  }
  if (!dependencyValidation.dependencyGraphFingerprint) {
    blockedReasons.push("Dependency graph fingerprint missing.");
  }
  if (riskProfile.overallRisk === "R6_FORBIDDEN") {
    blockedReasons.push("Forbidden risk detected.");
  }
  if (riskProfile.failClosed) {
    blockedReasons.push("Risk profile entered fail-closed mode.");
  }

  for (const signal of riskProfile.stepSignals) {
    if (signal.targetEnvironment === "production") {
      requiredApprovals.add("production");
      escalationRequired = true;
    }
    if (signal.rollbackCapability === "none" || signal.rollbackCapability === "unknown") {
      requiredApprovals.add("rollback");
    }
    if (signal.autonomySensitivity === "critical") {
      requiredApprovals.add("autonomy");
    }
    if (signal.destructive && signal.targetEnvironment === "production" && !signal.idempotent) {
      blockedReasons.push(`Step ${signal.stepId} is a destructive production action without deterministic idempotency.`);
    }
    if (signal.externalSideEffect && signal.targetEnvironment === "production" && !signal.idempotent) {
      blockedReasons.push(`Step ${signal.stepId} has production side effects without idempotency.`);
    }
  }

  if (riskProfile.overallRisk === "R4_HIGH" || riskProfile.overallRisk === "R5_CRITICAL") {
    requiredApprovals.add("high_risk");
    escalationRequired = true;
  }

  return {
    allowed: blockedReasons.length === 0,
    requiredApprovals: [...requiredApprovals].sort((left, right) => left.localeCompare(right)),
    blockedReasons,
    escalationRequired,
  };
}
