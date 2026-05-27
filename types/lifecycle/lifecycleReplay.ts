export type LifecycleReplayBinding = Readonly<{
  replayBindingId: string;
  governanceSnapshotHash: string;
  readinessCertificationHash: string;
  proposalLineageHash: string;
  escalationLineageHash: string;
  correlationLineageHash: string;
  coordinationLineageHash: string;
  currentLifecycleHash: string;
  replaySnapshotHash: string;
  reconstructionHash: string;
  valid: boolean;
  createdAt: string;
}>;
