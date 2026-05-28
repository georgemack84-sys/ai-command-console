import type { CoordinationGovernanceError, IntentCoordinationTopology } from "@/types/intent-coordination-governance-core";
import { validateIntentRelationship } from "./coordinationSchemas";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function validateCoordinationRelationships(topology: IntentCoordinationTopology): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  for (const relationship of topology.relationships) {
    errors.push(...validateIntentRelationship(relationship));
    if (relationship.parentIntentId === relationship.childIntentId) {
      errors.push(createCoordinationGovernanceError(
        "COORDINATION_RECURSION_DETECTED",
        "Self-referential coordination is constitutionally forbidden.",
        `relationships.${relationship.relationshipId}`,
      ));
    }
  }
  return Object.freeze(errors);
}
