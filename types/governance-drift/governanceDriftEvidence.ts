export type GovernanceDriftEvidenceRecord = Readonly<{
  evidenceId: string;
  driftId: string;
  replayAttackId: string;
  conflictId: string;
  recommendationId: string;
  attackId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replayLineageId: string;
  approvalConflictLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
