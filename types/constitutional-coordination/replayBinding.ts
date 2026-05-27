export type ConstitutionalReplayBinding = Readonly<{
  replaySnapshotId: string;
  replaySnapshotHash: string;
  replayLineageId: string;
  lifecycleHash: string;
  containmentReplayHash: string;
  valid: boolean;
  deterministic: boolean;
  createdAt: string;
  bindingHash: string;
}>;
