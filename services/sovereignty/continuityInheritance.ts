export function inheritContinuitySignals(input: {
  survivabilityProjection: number;
  continuityConfidence: number;
  uncertaintyLevel: number;
  collapseRisk: number;
}) {
  return {
    continuityConfidence: Number(((input.survivabilityProjection * 0.55) + (input.continuityConfidence * 0.45)).toFixed(4)),
    continuityRisk: Number(Math.max(input.collapseRisk, input.uncertaintyLevel).toFixed(4)),
  };
}
