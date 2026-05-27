import type { CoordinationGovernanceError, IntentCoordinationTopology } from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function validateCoordinationDependencies(topology: IntentCoordinationTopology): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  const nodeIds = new Set(topology.nodes.map((node) => node.intentId));

  for (const relationship of topology.relationships) {
    if (!nodeIds.has(relationship.parentIntentId) || !nodeIds.has(relationship.childIntentId)) {
      errors.push(createCoordinationGovernanceError(
        "COORDINATION_TOPOLOGY_INVALID",
        "All coordination relationships must reference explicit topology nodes.",
        `relationships.${relationship.relationshipId}`,
      ));
    }
  }

  return Object.freeze(errors);
}
