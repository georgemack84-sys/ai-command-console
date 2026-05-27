import { hashEvidenceValue } from "./evidenceHashEngine";
import type {
  EvidenceAggregationInput,
  EvidenceAggregationLineageEntry,
  EvidenceReference,
} from "./types/evidenceAggregationTypes";

export function buildEvidenceLineageEntries(input: {
  aggregationInput: EvidenceAggregationInput;
  references: readonly EvidenceReference[];
}): readonly EvidenceAggregationLineageEntry[] {
  return Object.freeze(input.references.map((reference) => Object.freeze({
    entryId: `${input.aggregationInput.aggregationSessionId}:${reference.evidenceId}:lineage`,
    aggregationSessionId: input.aggregationInput.aggregationSessionId,
    evidenceId: reference.evidenceId,
    createdAt: reference.collectedAt,
    deterministicHash: hashEvidenceValue("evidence-lineage-entry", {
      aggregationSessionId: input.aggregationInput.aggregationSessionId,
      evidenceId: reference.evidenceId,
      collectedAt: reference.collectedAt,
    }),
  })));
}
