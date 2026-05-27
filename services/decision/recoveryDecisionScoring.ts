import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDecisionIntelligenceResult } from "./recoveryDecisionTypes";

export function scoreRecoveryDecision(input: {
  governanceRisk: number;
  continuityImpact: number;
  operationalTrustProjection: number;
  evidenceQuality: number;
  disputed: boolean;
  containmentPressure: number;
}): {
  governanceRisk: number;
  continuityImpact: number;
  riskScore: number;
  decisionConfidence: number;
  uncertaintyLevel: RecoveryDecisionIntelligenceResult["uncertaintyLevel"];
} {
  const riskScore = clampMetric(
    input.governanceRisk * 0.35
      + input.continuityImpact * 0.3
      + (1 - input.operationalTrustProjection) * 0.2
      + input.containmentPressure * 0.15,
    0.1,
  );
  const decisionConfidence = clampMetric(
    Math.min(input.evidenceQuality, 1 - riskScore) - (input.disputed ? 0.18 : 0),
    0.1,
  );

  return {
    governanceRisk: clampMetric(input.governanceRisk, 0.1),
    continuityImpact: clampMetric(input.continuityImpact, 0.1),
    riskScore,
    decisionConfidence,
    uncertaintyLevel:
      decisionConfidence >= 0.8 ? "LOW"
        : decisionConfidence >= 0.6 ? "MODERATE"
          : decisionConfidence >= 0.35 ? "HIGH"
            : "CRITICAL",
  };
}
