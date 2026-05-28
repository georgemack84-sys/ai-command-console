import type {
  EvidenceLineageRecord,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function resolveEvidenceSnapshot(input: RecommendationLineageInput): EvidenceLineageRecord {
  return Object.freeze({
    snapshotIds: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.snapshotId)),
    evidenceHashes: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.evidenceHash)),
    provenanceRefs: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.provenanceRef)),
    sourceVersions: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.sourceVersion)),
    acquiredAt: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.acquiredAt)),
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-evidence-record", input.evidenceSnapshots),
  });
}
