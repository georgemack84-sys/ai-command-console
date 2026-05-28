export function buildCivilizationRiskAssessment(input: {
  systemicRisk: number;
  survivabilityConfidence: number;
  autonomyRisk: number;
  operationalStability: number;
}) {
  const civilizationScaleRisk = Number(Math.max(input.systemicRisk, 1 - input.survivabilityConfidence, input.autonomyRisk).toFixed(4));
  return {
    systemicRisk: input.systemicRisk,
    civilizationScaleRisk,
    failClosed: civilizationScaleRisk >= 0.7 || input.operationalStability < 0.5,
    survivabilityConfidence: input.survivabilityConfidence,
  };
}
