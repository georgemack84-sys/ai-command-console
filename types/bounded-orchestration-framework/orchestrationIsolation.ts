import type { BoundedOrchestrationContainmentState } from "./orchestrationContainment";

export type OrchestrationIsolationScope = Readonly<{
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  approvalScopeHash?: string;
  missionId: string;
  coordinationId: string;
  proposalId: string;
  containmentState: BoundedOrchestrationContainmentState;
}>;

export type OrchestrationIsolationAssessment = Readonly<{
  isolated: boolean;
  leakedScopes: readonly string[];
  scope: OrchestrationIsolationScope;
}>;
