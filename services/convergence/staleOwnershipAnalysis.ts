export type StaleOwnershipAnalysis = {
  staleOwnershipClaims: string[];
  reasons: string[];
};

export function analyzeStaleOwnership({
  leaseConflicts = [],
  stewardshipState,
  escalationFrozen,
}: {
  leaseConflicts?: Array<Record<string, unknown>>;
  stewardshipState?: string;
  escalationFrozen?: boolean;
}): StaleOwnershipAnalysis {
  const staleOwnershipClaims = leaseConflicts.map((entry) =>
    `${String(entry.executionId || "unknown")}:${String(entry.ownerId || "unknown-owner")}`,
  );

  const reasons = [
    ...(staleOwnershipClaims.length > 0 ? ["stale_ownership_detected"] : []),
    ...(stewardshipState === "DISPUTED" ? ["disputed_stewardship_authority"] : []),
    ...(escalationFrozen ? ["frozen_escalation_authority_chain"] : []),
  ];

  return {
    staleOwnershipClaims,
    reasons,
  };
}
