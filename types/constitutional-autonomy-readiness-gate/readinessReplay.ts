export type ConstitutionalReadinessReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  approvalLineageHash: string;
  overrideLineageHash: string;
  escalationLineageHash: string;
  auditLineageHash: string;
  confidenceLineageHash: string;
  proposalLineageHash: string;
  snapshotLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
