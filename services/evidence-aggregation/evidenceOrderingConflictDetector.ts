import type { EvidenceAggregationError, EvidenceReference } from "./types/evidenceAggregationTypes";

export function detectEvidenceOrderingConflicts(
  references: readonly EvidenceReference[],
): readonly EvidenceAggregationError[] {
  const seen = new Set<string>();
  const errors: EvidenceAggregationError[] = [];
  for (const reference of references) {
    const orderingKey = [
      reference.evidenceType,
      reference.collectedAt,
      reference.canonicalHash,
      reference.sourceId,
      reference.schemaVersion,
      reference.evidenceId,
    ].join("|");
    if (seen.has(orderingKey)) {
      errors.push({
        code: "EVIDENCE_AGGREGATION_UNSTABLE_ORDERING",
        message: "Duplicate deterministic ordering key detected.",
        path: `evidenceReferences.${reference.evidenceId}`,
      });
    }
    seen.add(orderingKey);
  }
  return Object.freeze(errors);
}
