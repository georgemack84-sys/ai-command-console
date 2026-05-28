export function buildSovereigntyLineage(input: {
  derivedFrom: string[];
  inheritedConstraints: string[];
  createdAt: number;
}) {
  return {
    lineageId: `sovereignty-lineage:${input.createdAt}`,
    derivedFrom: Array.from(new Set(input.derivedFrom)),
    inheritedConstraints: Array.from(new Set(input.inheritedConstraints)).sort(),
    replaySafe: true as const,
  };
}
