import { evaluateRecoveryConstitution } from "../constitutional/recoveryConstitution";
import { enforceRecoveryConstitution } from "../constitutional/recoveryEnforcement";
import { collectRecoveryDecisionEvidence } from "./recoveryDecisionEvidence";
import { applyRecoveryDecisionPolicies } from "./recoveryDecisionPolicies";
import { scoreRecoveryDecision } from "./recoveryDecisionScoring";
import type { RecoveryDecisionIntelligenceResult } from "./recoveryDecisionTypes";

export function buildRecoveryDecisionIntelligence(input: {
  executionId: string;
  evidence: {
    dashboard: Record<string, any>;
    forecasting: Record<string, any>;
  };
  generatedAt: string;
}): RecoveryDecisionIntelligenceResult {
  const collected = collectRecoveryDecisionEvidence(input.evidence);
  const dashboard = collected.dashboard;
  const forecastSummary = collected.forecasting?.summary || {};

  const constitutional = evaluateRecoveryConstitution({
    executionId: input.executionId,
    governanceDisputes: (dashboard.governanceDisputes || []).map((entry: Record<string, unknown>) => String(entry.executionId || "unknown_dispute")),
    immutableEvidenceValid: collected.immutableEvidenceValid,
    replayVerificationState: dashboard.replayVerificationState,
    operatorFreeze: Boolean(dashboard.stewardship?.shouldFreeze || dashboard.continuityConvergence?.requiresFreeze),
    leaseViolation: (dashboard.leaseConflicts || []).length > 0,
    auditSuppressed: (dashboard.auditHistory || []).length === 0,
    forecast: { summary: forecastSummary },
  });
  const enforcement = enforceRecoveryConstitution(constitutional);

  const scoring = scoreRecoveryDecision({
    governanceRisk: Math.max(
      forecastSummary.governanceInstabilityRisk ?? 0.25,
      dashboard.recoveryPrioritization?.governanceReviewRequired ? 0.72 : 0.35,
    ),
    continuityImpact: Math.max(
      dashboard.continuityConvergence?.divergenceScore ?? 0.25,
      1 - (dashboard.continuityConvergence?.continuityConfidence ?? dashboard.continuityConfidence ?? 0.25),
    ),
    operationalTrustProjection: forecastSummary.operationalTrustProjection ?? 0.25,
    evidenceQuality: Math.min(collected.evidenceSources.length / 8 || 0.2, 1),
    disputed: (dashboard.governanceDisputes || []).length > 0 || dashboard.replayVerificationState === "DIVERGED",
    containmentPressure: forecastSummary.containmentPressure ?? 0.25,
  });

  const policies = applyRecoveryDecisionPolicies({
    constitutionalAction: enforcement.constitutionalAction,
    constitutionallyAllowed: enforcement.constitutionallyAllowed,
    governanceRisk: scoring.governanceRisk,
    continuityImpact: scoring.continuityImpact,
    requiresContainment: Boolean(dashboard.continuityConvergence?.requiresContainment || forecastSummary.containmentPressure >= 0.65),
    requiresEscalation: Boolean(dashboard.continuityConvergence?.requiresEscalation || forecastSummary.governanceInstabilityRisk >= 0.65),
    disputed: (dashboard.governanceDisputes || []).length > 0,
  });
  const reasons = Array.from(new Set([
    ...enforcement.reasons,
    ...((forecastSummary.confidenceDegradationReasons || []).map((reason: unknown) => String(reason))),
  ]));

  return {
    decisionId: `decision:${input.executionId}:${input.generatedAt}`,
    executionId: input.executionId,
    recommendedAction: policies.recommendedAction,
    constitutionalAction: enforcement.constitutionalAction,
    constitutionallyAllowed: enforcement.constitutionallyAllowed,
    requiresApproval: policies.requiresApproval,
    requiresEscalation: policies.requiresEscalation,
    requiresContainment: policies.requiresContainment,
    decisionConfidence: scoring.decisionConfidence,
    governanceRisk: scoring.governanceRisk,
    continuityImpact: scoring.continuityImpact,
    riskScore: scoring.riskScore,
    uncertaintyLevel: scoring.uncertaintyLevel,
    reasons,
    blockedReasons: enforcement.constitutionallyAllowed ? [] : enforcement.reasons,
    constitutionalViolations: enforcement.violations,
    forecastLineageIds: collected.forecastLineageIds,
    mutable: false,
    generatedAt: input.generatedAt,
  };
}
