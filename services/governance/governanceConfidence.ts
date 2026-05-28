import { clampMetric } from "../stability/stabilityMetrics";
import type { OperationalSovereigntyAssessment } from "../sovereignty/operationalSovereigntyEngine";

export type GovernanceConfidenceResult = {
  confidence: number;
  confidenceBand: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  requiresHumanReview: boolean;
};

export function evaluateGovernanceConfidence(input: {
  evidenceCount: number;
  expectedEvidenceCount: number;
  disputedTruthPresent: boolean;
  sovereigntyAssessment?: OperationalSovereigntyAssessment;
}) : GovernanceConfidenceResult {
  const completeness = input.expectedEvidenceCount === 0
    ? 1
    : Math.max(0, Math.min(1, input.evidenceCount / input.expectedEvidenceCount));
  const sovereignty = input.sovereigntyAssessment;
  const reasons: string[] = [];

  if (completeness < 1) reasons.push("evidence_incomplete");
  if (input.disputedTruthPresent) reasons.push("disputed_truth_present");
  if (sovereignty && sovereignty.sovereigntyState !== "STABLE") reasons.push(`sovereignty_${sovereignty.sovereigntyState.toLowerCase()}`);
  if ((sovereignty?.systemicRisk ?? 0) >= 0.65) reasons.push("systemic_risk_high");
  if ((sovereignty?.escalationPressure ?? 0) >= 0.7) reasons.push("escalation_pressure_high");
  if ((sovereignty?.containmentEffectiveness ?? 1) < 0.55) reasons.push("containment_effectiveness_low");
  if ((sovereignty?.governanceIntegrity ?? 1) < 0.6) reasons.push("governance_integrity_degraded");
  if ((sovereignty?.survivabilityConfidence ?? 1) < 0.6) reasons.push("survivability_confidence_low");

  const confidence = clampMetric(
    completeness
      - (input.disputedTruthPresent ? 0.35 : 0)
      - ((sovereignty?.systemicRisk ?? 0) * 0.2)
      - (((sovereignty?.escalationPressure ?? 0) >= 0.7) ? 0.12 : 0)
      - (((sovereignty?.containmentEffectiveness ?? 1) < 0.55) ? 0.12 : 0)
      - (((sovereignty?.governanceIntegrity ?? 1) < 0.6) ? 0.12 : 0)
      - (((sovereignty?.survivabilityConfidence ?? 1) < 0.6) ? 0.12 : 0),
    0.05,
  );

  return {
    confidence,
    confidenceBand: confidence >= 0.75 ? "HIGH" : confidence >= 0.45 ? "MEDIUM" : "LOW",
    reasons,
    requiresHumanReview: input.disputedTruthPresent || confidence < 0.75,
  };
}
