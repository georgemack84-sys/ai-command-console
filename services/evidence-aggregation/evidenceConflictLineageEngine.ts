import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceConflictRecord } from "./types/evidenceAggregationTypes";

export function buildEvidenceConflictLineage(
  conflicts: readonly EvidenceConflictRecord[],
): string {
  return hashEvidenceValue("evidence-conflict-lineage", conflicts);
}
