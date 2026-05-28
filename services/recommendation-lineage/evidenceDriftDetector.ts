import type {
  EvidenceLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function detectEvidenceDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: EvidenceLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.lineageInput.metadata?.evidenceDrift === true || new Set(input.record.evidenceHashes).size !== input.record.evidenceHashes.length) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_EVIDENCE_DRIFT",
      message: "Evidence lineage drift or duplication was detected.",
      path: "evidenceSnapshots",
    }]);
  }
  return Object.freeze([]);
}
