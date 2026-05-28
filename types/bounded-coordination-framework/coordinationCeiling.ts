export type CoordinationCeiling = Readonly<{
  maxDepth: number;
  maxBranchFactor: number;
  maxDelegations: number;
  maxEscalationDepth: number;
  maxWorkflowNodes: number;
  maxCoordinationDurationMs: number;
}>;
