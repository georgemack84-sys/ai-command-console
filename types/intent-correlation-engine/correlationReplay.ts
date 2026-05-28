export interface CorrelationReplayBinding {
  replayBindingId: string;
  sourceReplayIds: readonly string[];
  governanceSnapshotHash: string;
  readinessCertificationHash: string;
  proposalLineageHash: string;
  escalationLineageHash?: string;
  confidenceLineageHash?: string;
  approvalLineageHash?: string;
  createdAt: string;
  bindingHash: string;
}
