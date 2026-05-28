function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

export function projectContinuity(input: {
  survivabilityConfidence: number;
  governanceReliability: number;
  operationalStability: number;
}) {
  const projection = clamp(
    (input.survivabilityConfidence * 0.45)
    + (input.governanceReliability * 0.3)
    + (input.operationalStability * 0.25),
  );

  return {
    continuityProjection: projection,
    degradationTrend: clamp(1 - projection),
  };
}
