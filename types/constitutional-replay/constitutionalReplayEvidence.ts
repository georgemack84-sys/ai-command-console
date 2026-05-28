export type ConstitutionalReplayEvidenceRecord = Readonly<{
  evidenceId: string;
  replayAttackId: string;
  conflictId: string;
  recommendationId: string;
  attackId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  approvalConflictLineageId: string;
  recommendationLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
