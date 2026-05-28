import type { EvidenceAggregationError, EvidenceReference } from "./types/evidenceAggregationTypes";

export function validateEvidenceReferences(
  references: readonly EvidenceReference[],
): readonly EvidenceAggregationError[] {
  const errors: EvidenceAggregationError[] = [];
  for (const reference of references) {
    if (!reference.lineage.parentEvidenceIds || !reference.lineage.sourceSnapshots.length) {
      errors.push({
        code: "EVIDENCE_AGGREGATION_MISSING_LINEAGE",
        message: "Evidence reference must preserve immutable lineage ancestry.",
        path: `evidenceReferences.${reference.evidenceId}.lineage`,
      });
    }
  }
  return Object.freeze(errors);
}
