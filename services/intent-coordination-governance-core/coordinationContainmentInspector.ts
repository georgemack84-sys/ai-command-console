import type {
  CoordinationBoundaryContract,
  CoordinationContainment,
  CoordinationGovernanceError,
} from "@/types/intent-coordination-governance-core";
import type { TopologyStats } from "./coordinationTopologyValidator";
import { createCoordinationGovernanceError } from "./coordinationErrors";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function inspectCoordinationContainment(input: {
  boundaryContract: CoordinationBoundaryContract;
  topologyStats: TopologyStats;
  replayValid: boolean;
  lifecycleValid: boolean;
  createdAt: string;
}): Readonly<{
  containment: CoordinationContainment;
  errors: readonly CoordinationGovernanceError[];
}> {
  const withinRelationshipDepth = input.topologyStats.maxDepthObserved <= input.boundaryContract.maxRelationshipDepth;
  const withinRelationshipCount = input.topologyStats.relationshipCount <= input.boundaryContract.maxRelationships;
  const withinEscalationCeiling = input.topologyStats.escalationEdgesObserved <= input.boundaryContract.maxEscalationEdges;
  const withinScopeCeiling = input.topologyStats.scopeBindingsObserved <= input.boundaryContract.maxScopeBindings;
  const withinDependencyCeiling = input.topologyStats.dependencyEdgesObserved <= input.boundaryContract.maxDependencyEdges;
  const reasons = Object.freeze([
    withinRelationshipDepth ? "Relationship depth remains within constitutional ceiling." : "Relationship depth exceeded constitutional ceiling.",
    withinEscalationCeiling ? "Escalation edges remain bounded." : "Escalation edges exceeded constitutional ceiling.",
    input.replayValid ? "Replay containment preserved." : "Replay containment invalid.",
    input.lifecycleValid ? "Lifecycle containment preserved." : "Lifecycle containment invalid.",
  ]);

  const errors: CoordinationGovernanceError[] = [];
  if (!withinRelationshipDepth || !withinRelationshipCount || !withinEscalationCeiling || !withinScopeCeiling || !withinDependencyCeiling) {
    errors.push(createCoordinationGovernanceError("COORDINATION_CONTAINMENT_VIOLATION", "Coordination containment boundaries were exceeded.", "containment"));
  }

  return Object.freeze({
    containment: Object.freeze({
      containmentId: hashCoordinationGovernanceValue("intent-coordination-containment-id", {
        topologyStats: input.topologyStats,
        createdAt: input.createdAt,
      }),
      withinRelationshipDepth,
      withinRelationshipCount,
      withinEscalationCeiling,
      withinScopeCeiling,
      withinDependencyCeiling,
      replayContained: input.replayValid,
      lifecycleContained: input.lifecycleValid,
      reasons,
      createdAt: input.createdAt,
    }),
    errors: Object.freeze(errors),
  });
}

export type { TopologyStats };
