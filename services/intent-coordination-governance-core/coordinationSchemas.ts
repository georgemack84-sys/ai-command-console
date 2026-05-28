import type {
  CoordinationGovernanceError,
  CoordinationState,
  CoordinationTransition,
  IntentCoordinationNode,
  IntentCoordinationTopology,
  IntentRelationshipType,
  IntentRelationship,
} from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

const RELATIONSHIP_TYPES: readonly IntentRelationshipType[] = [
  "dependency",
  "reference",
  "approval",
  "observation",
  "escalation",
];

const STATES: readonly CoordinationState[] = [
  "proposed",
  "validated",
  "governed",
  "bounded",
  "reviewed",
  "escalated",
  "frozen",
  "revoked",
  "archived",
];

const TRANSITIONS: readonly CoordinationTransition[] = [
  "validate",
  "govern",
  "bound",
  "review",
  "escalate",
  "freeze",
  "revoke",
  "archive",
];

export function validateCoordinationTimestamp(timestamp: string, path: string): readonly CoordinationGovernanceError[] {
  return Object.freeze(
    !timestamp || Number.isNaN(Date.parse(timestamp))
      ? [createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Coordination timestamps must be immutable and valid.", path)]
      : [],
  );
}

export function validateIntentRelationship(relationship: IntentRelationship): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  if (!RELATIONSHIP_TYPES.includes(relationship.relationshipType)) {
    errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Unknown coordination relationship type.", "relationshipType"));
  }
  if (!relationship.governanceBindings.length) {
    errors.push(createCoordinationGovernanceError("COORDINATION_GOVERNANCE_MISMATCH", "Coordination relationships require governance bindings.", "governanceBindings"));
  }
  if (relationship.replaySafe !== true) {
    errors.push(createCoordinationGovernanceError("COORDINATION_REPLAY_MISMATCH", "Coordination relationships must remain replay-safe.", "replaySafe"));
  }
  if (relationship.executionAuthority !== false) {
    errors.push(createCoordinationGovernanceError("COORDINATION_EXECUTION_LEAK", "Coordination can never carry execution authority.", "executionAuthority"));
  }
  return Object.freeze(errors);
}

export function validateIntentCoordinationNode(node: IntentCoordinationNode): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  if (!STATES.includes(node.state)) {
    errors.push(createCoordinationGovernanceError("INVALID_COORDINATION_TRANSITION", "Unknown coordination state.", `nodes.${node.intentId}.state`));
  }
  if (!node.scopeBindings.length) {
    errors.push(createCoordinationGovernanceError("COORDINATION_CONTAINMENT_VIOLATION", "Coordination nodes require explicit scope bindings.", `nodes.${node.intentId}.scopeBindings`));
  }
  errors.push(...validateCoordinationTimestamp(node.createdAt, `nodes.${node.intentId}.createdAt`));
  return Object.freeze(errors);
}

export function validateCoordinationTopologySchema(topology: IntentCoordinationTopology): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  if (!topology.rootIntentId) {
    errors.push(createCoordinationGovernanceError("COORDINATION_TOPOLOGY_INVALID", "Coordination topology requires an explicit root intent.", "rootIntentId"));
  }
  if (topology.derivedOnly !== true) {
    errors.push(createCoordinationGovernanceError("COORDINATION_EXECUTION_LEAK", "Coordination topology must remain derived-only.", "derivedOnly"));
  }
  return Object.freeze(errors);
}

export function validateCoordinationTransitionValue(transition: CoordinationTransition): readonly CoordinationGovernanceError[] {
  return Object.freeze(
    TRANSITIONS.includes(transition)
      ? []
      : [createCoordinationGovernanceError("INVALID_COORDINATION_TRANSITION", "Unknown coordination transition.", "requestedTransition")],
  );
}
