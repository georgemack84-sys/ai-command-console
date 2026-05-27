export type RoutingReplayLog = Readonly<{
  replayLogId: string;
  coordinationId: string;
  proposalId: string;
  approvalId?: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  containmentState: import("./routingContainment").RoutingContainmentState;
  target: import("./routingTransitions").CoordinationRouteTarget;
  blockedReasons: readonly string[];
  createdAt: string;
  deterministicHash: string;
}>;
