export type TriggerReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  proposalLineageHash: string;
  approvalGraphHash: string;
  overrideLineageHash: string;
  snapshotLineageHash: string;
  replayLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
