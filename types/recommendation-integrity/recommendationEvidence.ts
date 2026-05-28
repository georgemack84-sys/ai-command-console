export type RecommendationEvidenceRecord = Readonly<{
  evidenceId: string;
  recommendationId: string;
  coordinationId: string;
  attackId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  attackLineageId: string;
  readinessLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
