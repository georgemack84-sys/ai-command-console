import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceReference } from "./types/evidenceAggregationTypes";

export function freezeEvidenceReference(reference: EvidenceReference): EvidenceReference {
  return Object.freeze({
    ...reference,
    canonicalHash: reference.canonicalHash || hashEvidenceValue("evidence-reference", reference),
    lineage: Object.freeze({
      parentEvidenceIds: [...reference.lineage.parentEvidenceIds],
      sourceSnapshots: [...reference.lineage.sourceSnapshots],
    }),
  });
}
