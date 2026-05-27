export type OverrideReplayBinding = Readonly<{
  reconstructionHash: string;
  replaySnapshotHash: string;
  replayLineageHash: string;
  approvalGraphHash: string;
  proposalHash: string;
  overrideLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
