import { clampMetric } from "./stabilityMetrics";

export type StabilityTrend = "IMPROVING" | "STABLE" | "DECLINING" | "COLLAPSING";

export type DegradationAnalysis = {
  degradationRate: number;
  accelerationFactor: number;
  affectedSubsystems: string[];
  trend: StabilityTrend;
  reasons: string[];
};

export function analyzeDegradation({
  staleExecutions = 0,
  degradedDependencies = [],
  replayDivergence = false,
  repeatedRecoveryFailures = 0,
  unresolvedEscalations = 0,
  containmentRequired = false,
  freezeRequired = false,
  disputed = false,
}: {
  staleExecutions?: number;
  degradedDependencies?: string[];
  replayDivergence?: boolean;
  repeatedRecoveryFailures?: number;
  unresolvedEscalations?: number;
  containmentRequired?: boolean;
  freezeRequired?: boolean;
  disputed?: boolean;
}): DegradationAnalysis {
  const reasons: string[] = [];
  const affectedSubsystems = [...degradedDependencies];
  let degradationRate = 0.08;
  let accelerationFactor = 0.05;

  if (staleExecutions > 0) {
    degradationRate += Math.min(0.3, staleExecutions * 0.07);
    reasons.push("stale_execution_spread");
  }
  if (degradedDependencies.length > 0) {
    degradationRate += Math.min(0.35, degradedDependencies.length * 0.09);
    accelerationFactor += Math.min(0.2, degradedDependencies.length * 0.03);
    reasons.push("degraded_dependencies_present");
  }
  if (replayDivergence) {
    degradationRate += 0.22;
    accelerationFactor += 0.16;
    reasons.push("replay_divergence_detected");
  }
  if (repeatedRecoveryFailures > 0) {
    degradationRate += Math.min(0.25, repeatedRecoveryFailures * 0.08);
    accelerationFactor += Math.min(0.25, repeatedRecoveryFailures * 0.06);
    reasons.push("repeated_recovery_failures");
  }
  if (unresolvedEscalations > 0) {
    degradationRate += Math.min(0.2, unresolvedEscalations * 0.07);
    accelerationFactor += Math.min(0.18, unresolvedEscalations * 0.05);
    reasons.push("unresolved_escalations");
  }
  if (containmentRequired) {
    degradationRate += 0.18;
    reasons.push("containment_required");
  }
  if (freezeRequired) {
    degradationRate += 0.14;
    reasons.push("freeze_required");
  }
  if (disputed) {
    degradationRate += 0.18;
    reasons.push("disputed_truth");
  }

  degradationRate = clampMetric(degradationRate, 0.25);
  accelerationFactor = clampMetric(accelerationFactor, 0.1);

  const trend: StabilityTrend =
    disputed || containmentRequired || (freezeRequired && degradationRate >= 0.65) || degradationRate >= 0.82
      ? "COLLAPSING"
      : replayDivergence || freezeRequired || degradationRate >= 0.48 || accelerationFactor >= 0.4
        ? "DECLINING"
        : degradationRate <= 0.12 && !freezeRequired && !disputed
          ? "STABLE"
          : "IMPROVING";

  if (trend === "STABLE" && reasons.length === 0) {
    reasons.push("no_material_degradation_signals");
  }

  return {
    degradationRate,
    accelerationFactor,
    affectedSubsystems,
    trend,
    reasons,
  };
}
