export function computeSurvivabilityScore({
  continuityRiskScore,
  workerAvailabilityScore,
  dependencyStabilityScore,
  replayDivergenceDetected,
}: {
  continuityRiskScore: number;
  workerAvailabilityScore: number;
  dependencyStabilityScore: number;
  replayDivergenceDetected: boolean;
}) {
  const baseline = 100 - continuityRiskScore;
  const adjusted =
    baseline * 0.6
    + workerAvailabilityScore * 20
    + dependencyStabilityScore * 20
    - (replayDivergenceDetected ? 20 : 0);
  return Math.max(0, Math.min(100, adjusted));
}
