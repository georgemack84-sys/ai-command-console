export type CoordinationBoundaryContract = Readonly<{
  maxRelationshipDepth: number;
  maxRelationships: number;
  maxEscalationEdges: number;
  maxScopeBindings: number;
  maxDependencyEdges: number;
  maxContainmentDurationMs: number;
}>;

export type CoordinationContainment = Readonly<{
  containmentId: string;
  withinRelationshipDepth: boolean;
  withinRelationshipCount: boolean;
  withinEscalationCeiling: boolean;
  withinScopeCeiling: boolean;
  withinDependencyCeiling: boolean;
  replayContained: boolean;
  lifecycleContained: boolean;
  reasons: readonly string[];
  createdAt: string;
}>;
