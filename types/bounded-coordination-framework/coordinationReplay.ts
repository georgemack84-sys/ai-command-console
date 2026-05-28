export type CoordinationReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  proposalLineageHash: string;
  approvalGraphHash: string;
  overrideLineageHash: string;
  auditEpisodeHash: string;
  replayLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;
