import type { EvidenceReference } from "./types/evidenceAggregationTypes";

function compareEvidence(left: EvidenceReference, right: EvidenceReference): number {
  return (
    left.evidenceType.localeCompare(right.evidenceType) ||
    left.collectedAt.localeCompare(right.collectedAt) ||
    left.canonicalHash.localeCompare(right.canonicalHash) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.schemaVersion.localeCompare(right.schemaVersion) ||
    left.evidenceId.localeCompare(right.evidenceId)
  );
}

export function orderEvidenceReferences(
  references: readonly EvidenceReference[],
): readonly EvidenceReference[] {
  return Object.freeze([...references].sort(compareEvidence));
}
