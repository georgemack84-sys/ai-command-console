import { orderEvidenceReferences } from "./evidenceOrderingEngine";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceReference } from "./types/evidenceAggregationTypes";

export function buildEvidenceDeterministicOrdering(
  references: readonly EvidenceReference[],
) {
  const ordered = orderEvidenceReferences(references);
  return Object.freeze({
    ordered,
    orderingHash: hashEvidenceValue(
      "evidence-ordering",
      ordered.map((reference) => ({
        evidenceId: reference.evidenceId,
        evidenceType: reference.evidenceType,
        collectedAt: reference.collectedAt,
        canonicalHash: reference.canonicalHash,
        sourceId: reference.sourceId,
        schemaVersion: reference.schemaVersion,
      })),
    ),
  });
}
