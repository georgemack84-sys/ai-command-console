export function buildSovereigntyEvidence(input: {
  sovereigntyState: string;
  immutableAuditHealthy: boolean;
  blockedReasons: string[];
  createdAt: number;
}) {
  return {
    evidenceId: `sovereignty-evidence:${input.createdAt}`,
    sovereigntyState: input.sovereigntyState,
    immutableAuditHealthy: input.immutableAuditHealthy,
    blockedReasons: [...new Set(input.blockedReasons)].sort(),
    advisoryOnly: true as const,
    createdAt: input.createdAt,
  };
}
