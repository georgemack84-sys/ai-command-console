export type ApprovalConflictEvidenceRecord = Readonly<{
  evidenceId: string;
  conflictId: string;
  recommendationId: string;
  attackId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  recommendationLineageId: string;
  attackLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
