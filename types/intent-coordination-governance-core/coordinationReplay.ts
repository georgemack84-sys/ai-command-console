export type CoordinationReplayBinding = Readonly<{
  reconstructionHash: string;
  governanceSnapshotHash: string;
  readinessCertificationHash: string;
  escalationLineageHash: string;
  proposalLineageHash: string;
  lifecycleStateHash: string;
  topologyHash: string;
  containmentHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;

export type CoordinationReplayReconstruction = Readonly<{
  reconstructionId: string;
  coordinationHash: string;
  replayBinding: CoordinationReplayBinding;
  topologyHash: string;
  lifecycleState: string;
  deterministic: true;
}>;
