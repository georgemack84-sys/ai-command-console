export type BoundedOrchestrationReplayRecord = Readonly<{
  replayId: string;
  orchestrationId: string;
  coordinationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  routingLineageId: string;
  routingReplayLogId: string;
  chronologyEntryIds: readonly string[];
  createdAt: string;
  replayHash: string;
}>;
