export type ConstitutionalSnapshotVisualization = Readonly<{
  snapshotId: string;
  snapshotType: import("./replayReconstruction").SnapshotType;
  missionId: string;
  executionId?: string;
  autonomyLevel: import("./replayReconstruction").AutonomyLevel;
  lineageId: string;
  parentSnapshotId?: string;
  branchId?: string;
  sourceTruthRefs: readonly string[];
  visibleHashCount: number;
  warningCount: number;
  errorCount: number;
}>;
