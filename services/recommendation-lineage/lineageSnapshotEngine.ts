import type {
  RecommendationLineageGraph,
  RecommendationLineageInput,
  RecommendationLineageSnapshot,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function buildLineageSnapshot(
  input: RecommendationLineageInput,
  graph: RecommendationLineageGraph,
): RecommendationLineageSnapshot {
  return Object.freeze({
    snapshotId: hashRecommendationLineageValue("recommendation-lineage-snapshot-id", {
      recommendationId: input.recommendationId,
      lineageId: input.lineageId,
    }),
    recommendationId: input.recommendationId,
    lineageId: input.lineageId,
    evidenceSnapshotIds: Object.freeze(input.evidenceSnapshots.map((snapshot) => snapshot.snapshotId)),
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    scoringSnapshotId: input.scoringSnapshot.scoringSnapshotId,
    policySnapshotId: input.policySnapshot.policySnapshotId,
    approvalSnapshotId: input.approvalSnapshot.approvalSnapshotId,
    replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    escalationSnapshotId: input.escalationDeterminismResult.record.escalationId,
    interventionSnapshotId: input.humanSupremacyResult.record.supremacyId,
    snapshotHash: hashRecommendationLineageValue("recommendation-lineage-snapshot", {
      graphHash: graph.graphHash,
      recommendationId: input.recommendationId,
      lineageId: input.lineageId,
    }),
  });
}
