import type {
  EvidenceLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { resolveEvidenceSnapshot } from "./evidenceSnapshotResolver";
import { validateEvidenceAncestry } from "./evidenceAncestryValidator";

export function buildEvidenceLineage(input: RecommendationLineageInput): {
  record: EvidenceLineageRecord;
  errors: readonly RecommendationLineageError[];
} {
  const record = resolveEvidenceSnapshot(input);
  return Object.freeze({
    record,
    errors: validateEvidenceAncestry(record),
  });
}
