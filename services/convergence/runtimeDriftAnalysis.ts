import { clampMetric } from "../stability/stabilityMetrics";

export type RuntimeDriftAnalysis = {
  driftVelocity: number;
  replayDrift: number;
  escalationInstability: number;
  dependencySpread: number;
  orphanedOperationGrowth: number;
  survivabilityDegradationVelocity: number;
  reasons: string[];
};

export function analyzeRuntimeDrift({
  degradationRate = 0,
  replayInstabilityScore = 0,
  escalationPressure = 0,
  dependencyInstabilityScore = 0,
  orphanedOperationCount = 0,
  survivabilityScore = 1,
  disputed = false,
}: {
  degradationRate?: number;
  replayInstabilityScore?: number;
  escalationPressure?: number;
  dependencyInstabilityScore?: number;
  orphanedOperationCount?: number;
  survivabilityScore?: number;
  disputed?: boolean;
}): RuntimeDriftAnalysis {
  const driftVelocity = clampMetric(
    (degradationRate * 0.35)
      + (replayInstabilityScore * 0.22)
      + (escalationPressure * 0.18)
      + (dependencyInstabilityScore * 0.15)
      + (Math.min(1, orphanedOperationCount * 0.15) * 0.1)
      + (disputed ? 0.18 : 0),
    0.2,
  );

  return {
    driftVelocity,
    replayDrift: clampMetric(replayInstabilityScore, 0.1),
    escalationInstability: clampMetric(escalationPressure + (disputed ? 0.2 : 0), 0.2),
    dependencySpread: clampMetric(dependencyInstabilityScore, 0.1),
    orphanedOperationGrowth: clampMetric(orphanedOperationCount * 0.2, 0.1),
    survivabilityDegradationVelocity: clampMetric(1 - survivabilityScore, 0.2),
    reasons: Array.from(new Set([
      ...(driftVelocity >= 0.35 ? ["drift_velocity_elevated"] : []),
      ...(replayInstabilityScore >= 0.35 ? ["replay_drift_accumulating"] : []),
      ...(disputed ? ["disputed_state_accelerates_drift"] : []),
    ])),
  };
}
