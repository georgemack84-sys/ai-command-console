import type { EvidenceConflictRecord } from "./types/evidenceAggregationTypes";

export function buildEvidenceConflictRegistry(
  conflicts: readonly EvidenceConflictRecord[],
): Readonly<Record<string, EvidenceConflictRecord>> {
  return Object.freeze(Object.fromEntries(conflicts.map((conflict) => [conflict.conflictId, conflict])));
}
