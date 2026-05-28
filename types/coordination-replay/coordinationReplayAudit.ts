export type CoordinationReplayAuditArtifact = Readonly<{
  auditId: string;
  replayId: string;
  whyAllowed: readonly string[];
  whyBlocked: readonly string[];
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  containmentState: string;
  routeTarget: string;
  evidenceHash: string;
}>;
