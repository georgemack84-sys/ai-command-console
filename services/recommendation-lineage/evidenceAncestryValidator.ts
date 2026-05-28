import type {
  EvidenceLineageRecord,
  RecommendationLineageError,
} from "./recommendationLineageStateTypes";

export function validateEvidenceAncestry(
  record: EvidenceLineageRecord,
): readonly RecommendationLineageError[] {
  const errors: RecommendationLineageError[] = [];
  if (record.snapshotIds.length === 0) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_EVIDENCE_GAP",
      message: "Evidence ancestry is incomplete.",
      path: "evidenceSnapshots",
    });
  }
  if (record.snapshotIds.length !== record.evidenceHashes.length) {
    errors.push({
      code: "RECOMMENDATION_LINEAGE_EVIDENCE_DRIFT",
      message: "Evidence snapshot and hash counts diverged.",
      path: "evidenceHashes",
    });
  }
  return Object.freeze(errors);
}
