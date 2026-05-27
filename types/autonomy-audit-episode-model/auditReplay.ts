export type AuditReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  triggerLineageHash: string;
  proposalLineageHash: string;
  approvalGraphHash: string;
  overrideLineageHash: string;
  snapshotLineageHash: string;
  confidenceStateHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
