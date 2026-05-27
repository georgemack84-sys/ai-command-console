import type { EvidenceAggregationError, EvidenceAggregationInput, EvidenceIntegrityRecord } from "./types/evidenceAggregationTypes";
import { hashEvidenceValue } from "./evidenceHashEngine";

export function validateEvidenceIntegrity(
  input: EvidenceAggregationInput,
): {
  record: EvidenceIntegrityRecord;
  errors: readonly EvidenceAggregationError[];
} {
  const integrityStatus =
    input.recommendationSynthesisResult.freeze.frozen
      ? "incomplete"
      : input.recommendationSynthesisResult.errors.length > 0
        ? "conflicted"
        : "verified";
  const record = Object.freeze({
    integrityStateId: input.recommendationSynthesisInput.integrityStateId,
    integrityStatus,
    recommendationDeterministic:
      input.recommendationSynthesisResult.recommendations.every((item) => item.determinismRecord.deterministic),
    integrityHash: hashEvidenceValue("evidence-integrity-record", {
      integrityStateId: input.recommendationSynthesisInput.integrityStateId,
      integrityStatus,
    }),
  } satisfies EvidenceIntegrityRecord);
  const errors: EvidenceAggregationError[] = [];
  if (integrityStatus !== "verified") {
    errors.push({
      code: "EVIDENCE_AGGREGATION_UNRESOLVED_CONFLICT",
      message: "Evidence aggregation requires fully verified integrity state.",
      path: "integrityStatus",
    });
  }
  return { record, errors: Object.freeze(errors) };
}
