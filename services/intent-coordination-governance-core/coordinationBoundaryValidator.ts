import type { CoordinationBoundaryContract, CoordinationGovernanceError } from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function validateCoordinationBoundaries(contract: CoordinationBoundaryContract): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  const numericFields = [
    ["maxRelationshipDepth", contract.maxRelationshipDepth],
    ["maxRelationships", contract.maxRelationships],
    ["maxEscalationEdges", contract.maxEscalationEdges],
    ["maxScopeBindings", contract.maxScopeBindings],
    ["maxDependencyEdges", contract.maxDependencyEdges],
    ["maxContainmentDurationMs", contract.maxContainmentDurationMs],
  ] as const;

  for (const [field, value] of numericFields) {
    if (!Number.isFinite(value) || value <= 0) {
      errors.push(createCoordinationGovernanceError("COORDINATION_CONTAINMENT_VIOLATION", `Boundary ${field} must be a positive finite number.`, field));
    }
  }

  return Object.freeze(errors);
}
