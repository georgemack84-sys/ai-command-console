function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

export function modelSystemicCollapse(input: {
  systemicRisk: number;
  escalationPressure: number;
  containmentPressure: number;
  survivabilityConfidence: number;
  governanceReliability: number;
}) {
  const collapseRisk = clamp(
    (input.systemicRisk * 0.35)
    + (input.escalationPressure * 0.2)
    + (input.containmentPressure * 0.2)
    + ((1 - input.survivabilityConfidence) * 0.15)
    + ((1 - input.governanceReliability) * 0.1),
  );

  return {
    collapseRisk,
    uncertaintyLevel: clamp(
      Math.max(
        1 - input.survivabilityConfidence,
        1 - input.governanceReliability,
      ),
    ),
  };
}
