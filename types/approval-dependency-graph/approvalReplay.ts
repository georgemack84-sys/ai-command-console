export type ApprovalReplayBinding = Readonly<{
  reconstructionHash: string;
  replaySnapshotHash: string;
  replayLineageHash: string;
  proposalHash: string;
  graphSeedHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
