import { clampMetric } from "../stability/stabilityMetrics";

export function computeDivergenceScore(parts: {
  driftVelocity: number;
  replayDrift: number;
  escalationInstability: number;
  dependencySpread: number;
  orphanedOperationGrowth: number;
  disputePressure: number;
}) {
  return clampMetric(
    (parts.driftVelocity * 0.24)
    + (parts.replayDrift * 0.18)
    + (parts.escalationInstability * 0.16)
    + (parts.dependencySpread * 0.14)
    + (parts.orphanedOperationGrowth * 0.14)
    + (parts.disputePressure * 0.14),
    0.2,
  );
}
