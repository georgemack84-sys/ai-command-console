import type {
  CoordinationFrameworkError,
  CoordinationIsolation,
  CoordinationTopologyGraph,
} from "@/types/bounded-coordination-framework";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createCoordinationError } from "./coordinationErrors";
import { hashCoordinationValue } from "./coordinationGraphHasher";

export function bindOrchestrationIsolation(input: {
  graph: CoordinationTopologyGraph;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  createdAt: string;
}): { isolation: CoordinationIsolation; errors: readonly CoordinationFrameworkError[] } {
  const authorityIds = new Set(input.governanceView.authorityBoundaries.map((boundary) => boundary.authorityId));
  const authorityDrift = input.graph.nodes.some((node) => !authorityIds.has(node.authorityBoundaryId));
  const overrideReachable = input.overrideContract.lineage.entries.length > 0;
  const isolated = !authorityDrift && overrideReachable;
  const errors: CoordinationFrameworkError[] = [];
  if (authorityDrift) {
    errors.push(createCoordinationError("COORDINATION_AUTHORITY_DRIFT", "Coordination topology referenced an unknown authority boundary.", "authorityBoundaryId"));
  }
  if (!overrideReachable) {
    errors.push(createCoordinationError("COORDINATION_OVERRIDE_UNREACHABLE", "Coordination topology requires reachable override lineage.", "override"));
  }

  return {
    isolation: Object.freeze({
      isolationId: hashCoordinationValue("coordination-isolation-id", {
        graphHash: input.graph.graphHash,
        createdAt: input.createdAt,
      }),
      isolated,
      overrideReachable,
      deniedRuntimeOperations: Object.freeze([
        "execute",
        "dispatch",
        "schedule",
        "queue-control",
        "process-control",
        "lock-control",
        "worker-control",
      ]),
      deniedTopologyPatterns: Object.freeze([
        "recursive",
        "self-modifying",
        "mesh",
        "dynamic-fanout",
        "hidden-branch",
      ]),
      createdAt: input.createdAt,
    }),
    errors: Object.freeze(errors),
  };
}
