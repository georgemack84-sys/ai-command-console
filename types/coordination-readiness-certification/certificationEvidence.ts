export type CertificationEvidenceRecord = Readonly<{
  evidenceId: string;
  certificationId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  overrideLineageId: string;
  boundaryLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
