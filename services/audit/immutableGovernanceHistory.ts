export function buildImmutableGovernanceHistory(input: {
  historyRefs: string[];
  lineageRefs: string[];
  createdAt: number;
}) {
  return {
    historyId: `immutable-governance-history:${input.createdAt}`,
    historyRefs: [...new Set(input.historyRefs)].sort(),
    lineageRefs: [...new Set(input.lineageRefs)].sort(),
    immutable: true as const,
    appendOnly: true as const,
    createdAt: input.createdAt,
  };
}
