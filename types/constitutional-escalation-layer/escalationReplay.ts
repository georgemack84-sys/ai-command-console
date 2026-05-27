export type ConstitutionalEscalationReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  overrideLineageHash: string;
  auditLineageHash: string;
  triggerLineageHash: string;
  proposalLineageHash: string;
  confidenceLineageHash: string;
  topologyLineageHash?: string;
  snapshotLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
