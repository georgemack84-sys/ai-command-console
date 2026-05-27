import { clampMetric } from "./stabilityMetrics";
import type { StabilityTrend } from "./degradationAnalysis";

export type OperationalRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CATASTROPHIC";

export type SurvivabilityScore = {
  score: number;
  riskLevel: OperationalRiskLevel;
  stabilizationRequired: boolean;
  containmentRecommended: boolean;
  lockdownRecommended: boolean;
  reasons: string[];
};

export function scoreOperationalSurvivability({
  continuityConfidence = 0.4,
  replayInstabilityScore = 0.2,
  staleExecutionSpread = 0.15,
  dependencyInstabilityScore = 0.1,
  escalationPressure = 0.2,
  recoverySuccessConfidence = 0.45,
  disputed = false,
  freezeRequired = false,
  containmentRequired = false,
  degradationRate = 0.25,
  collapseRisk = 0.2,
  trend = "STABLE" as StabilityTrend,
}: {
  continuityConfidence?: number;
  replayInstabilityScore?: number;
  staleExecutionSpread?: number;
  dependencyInstabilityScore?: number;
  escalationPressure?: number;
  recoverySuccessConfidence?: number;
  disputed?: boolean;
  freezeRequired?: boolean;
  containmentRequired?: boolean;
  degradationRate?: number;
  collapseRisk?: number;
  trend?: StabilityTrend;
}): SurvivabilityScore {
  const reasons: string[] = [];
  let score = clampMetric(continuityConfidence, 0.4);

  score -= clampMetric(replayInstabilityScore, 0.2) * 0.32;
  score -= clampMetric(staleExecutionSpread, 0.15) * 0.16;
  score -= clampMetric(dependencyInstabilityScore, 0.1) * 0.16;
  score -= clampMetric(escalationPressure, 0.2) * 0.18;
  score -= (1 - clampMetric(recoverySuccessConfidence, 0.45)) * 0.18;
  score -= clampMetric(degradationRate, 0.25) * 0.22;
  score -= clampMetric(collapseRisk, 0.2) * 0.2;

  if (disputed) {
    score -= 0.28;
    reasons.push("disputed_stewardship_truth");
  }
  if (freezeRequired) {
    score -= 0.18;
    reasons.push("freeze_required");
  }
  if (containmentRequired) {
    score -= 0.22;
    reasons.push("containment_required");
  }
  if (trend === "DECLINING") {
    score -= 0.08;
    reasons.push("declining_operational_trend");
  }
  if (trend === "COLLAPSING") {
    score -= 0.18;
    reasons.push("collapsing_operational_trend");
  }

  score = clampMetric(score, 0.2);

  const riskLevel: OperationalRiskLevel =
    score <= 0.12 ? "CATASTROPHIC"
      : score <= 0.28 ? "CRITICAL"
        : score <= 0.48 ? "HIGH"
          : score <= 0.72 ? "MODERATE"
            : "LOW";

  const stabilizationRequired = freezeRequired || containmentRequired || riskLevel !== "LOW";
  const containmentRecommended = containmentRequired || riskLevel === "CRITICAL" || riskLevel === "CATASTROPHIC";
  const lockdownRecommended = riskLevel === "CATASTROPHIC" || (clampMetric(collapseRisk, 0.2) >= 0.85);

  if (lockdownRecommended) {
    reasons.push("lockdown_recommended");
  }

  return {
    score,
    riskLevel,
    stabilizationRequired,
    containmentRecommended,
    lockdownRecommended,
    reasons: Array.from(new Set(reasons)),
  };
}
