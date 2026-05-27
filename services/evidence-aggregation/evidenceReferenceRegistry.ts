import { canonicalizeEvidenceToString } from "./evidenceCanonicalizer";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceReference } from "./types/evidenceAggregationTypes";

export function buildEvidenceReferenceRegistry(
  references: readonly EvidenceReference[],
): Readonly<Record<string, EvidenceReference>> {
  return Object.freeze(
    Object.fromEntries(
      references.map((reference) => [
        reference.evidenceId,
        Object.freeze({
          ...reference,
          canonicalHash: hashEvidenceValue(
            "evidence-reference-canonical",
            canonicalizeEvidenceToString(reference),
          ),
        }),
      ]),
    ),
  );
}
