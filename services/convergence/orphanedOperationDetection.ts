export type OrphanedOperationAnalysis = {
  orphanedOperations: string[];
  affectedExecutions: string[];
  reasons: string[];
};

export function detectOrphanedOperations({
  blockedRecoveries = [],
  quarantinedExecutions = [],
  leaseConflicts = [],
  activeRecoveries = [],
}: {
  blockedRecoveries?: Array<Record<string, unknown>>;
  quarantinedExecutions?: Array<Record<string, unknown>>;
  leaseConflicts?: Array<Record<string, unknown>>;
  activeRecoveries?: Array<Record<string, unknown>>;
}): OrphanedOperationAnalysis {
  const orphanedOperations = [
    ...blockedRecoveries.map((entry) => `blocked:${String(entry.executionId || "unknown")}`),
    ...quarantinedExecutions.map((entry) => `quarantined:${String(entry.executionId || "unknown")}`),
    ...leaseConflicts.map((entry) => `stale-lease:${String(entry.executionId || "unknown")}`),
  ];

  const affectedExecutions = Array.from(new Set([
    ...blockedRecoveries.map((entry) => String(entry.executionId || "")),
    ...quarantinedExecutions.map((entry) => String(entry.executionId || "")),
    ...leaseConflicts.map((entry) => String(entry.executionId || "")),
    ...activeRecoveries.map((entry) => String(entry.executionId || "")),
  ].filter(Boolean)));

  return {
    orphanedOperations,
    affectedExecutions,
    reasons: orphanedOperations.length > 0 ? ["orphaned_operations_detected"] : [],
  };
}
