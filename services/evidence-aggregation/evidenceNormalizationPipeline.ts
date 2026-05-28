import { canonicalizeEvidenceValue } from "./evidenceCanonicalizer";
import { freezeEvidenceReference } from "./evidenceImmutableReferenceModel";
import type { EvidenceReference } from "./types/evidenceAggregationTypes";

export function normalizeEvidenceReferences(
  references: readonly EvidenceReference[],
): readonly EvidenceReference[] {
  return Object.freeze(
    references.map((reference) =>
      freezeEvidenceReference(canonicalizeEvidenceValue(reference)),
    ),
  );
}
