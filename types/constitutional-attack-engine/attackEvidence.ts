export type AttackEvidenceRecord = Readonly<{
  evidenceId: string;
  attackId: string;
  coordinationId: string;
  readinessCertificationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  certificationLineageId: string;
  boundaryLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
