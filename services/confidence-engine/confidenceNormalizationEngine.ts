export function normalizeConfidenceScore(rawScore: number): number {
  return Number(Math.max(0, Math.min(1, rawScore)).toFixed(3));
}
