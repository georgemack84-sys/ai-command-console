export type ProposalReplayReconstruction = Readonly<{
  replayId: string;
  reconstructionHash: string;
  deterministic: boolean;
  lineageValid: boolean;
  snapshotHash: string;
  replayLineageHash: string;
}>;
