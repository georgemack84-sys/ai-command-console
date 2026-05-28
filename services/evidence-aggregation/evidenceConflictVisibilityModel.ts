import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceConflictRecord, EvidenceConflictVisibilityRecord } from "./types/evidenceAggregationTypes";

export function buildEvidenceConflictVisibility(
  conflicts: readonly EvidenceConflictRecord[],
): EvidenceConflictVisibilityRecord {
  const visibleConflictIds = Object.freeze(conflicts.filter((conflict) => conflict.visible).map((conflict) => conflict.conflictId));
  return Object.freeze({
    visibleConflictIds,
    unresolvedConflictCount: visibleConflictIds.length,
    visibilityHash: hashEvidenceValue("evidence-conflict-visibility", visibleConflictIds),
  });
}
