export function orderRecommendationEvidence(evidenceReferences: readonly string[]): readonly string[] {
  return Object.freeze([...evidenceReferences].sort((left, right) => left.localeCompare(right)));
}
