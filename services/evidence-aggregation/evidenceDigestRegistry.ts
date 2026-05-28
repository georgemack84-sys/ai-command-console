import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceReference } from "./types/evidenceAggregationTypes";

export function buildEvidenceDigestRegistry(
  references: readonly EvidenceReference[],
): Readonly<Record<string, string>> {
  return Object.freeze(
    Object.fromEntries(
      references.map((reference) => [
        reference.evidenceId,
        hashEvidenceValue("evidence-digest-entry", {
          evidenceId: reference.evidenceId,
          canonicalHash: reference.canonicalHash,
        }),
      ]),
    ),
  );
}
