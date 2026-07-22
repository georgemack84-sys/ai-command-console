import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  CanonicalDecisionRelationshipType,
  DecisionDependencyGraphContract,
  DecisionGraphIntegrityHash,
  DecisionGraphNodeState,
  DecisionGraphRoadmapInput,
  DecisionGraphRoadmapNodeInput,
  DecisionGraphRoadmapReasonCode,
  DecisionGraphRoadmapRelationshipInput,
  DecisionGraphRoadmapValidation,
  DecisionGraphReplayContract,
  DecisionRelationshipTypeRegistry,
} from "./types";

export const DECISION_GRAPH_CONTRACT_VERSION = "decision-dependency-graph/v1";
export const DECISION_GRAPH_SCHEMA_VERSION = "decision-graph-node/v1";
export const DECISION_RELATIONSHIP_REGISTRY_VERSION = "decision-relationship-registry/v1";
export const DECISION_GRAPH_STATE_MODEL_VERSION = "decision-graph-state-model/v1";

export const CANONICAL_DECISION_RELATIONSHIP_TYPES: readonly CanonicalDecisionRelationshipType[] = Object.freeze([
  "depends_on",
  "blocks",
  "conflicts_with",
  "supersedes",
  "supports",
  "weakens",
  "escalates_to",
  "requires_operator_approval",
  "requires_governance_review",
  "requires_simulation",
  "requires_recovery_plan",
  "requires_certification",
]);

export const DECISION_GRAPH_NODE_STATES: readonly DecisionGraphNodeState[] = Object.freeze([
  "CREATED",
  "REGISTERED",
  "RELATIONSHIPS_PENDING",
  "RELATIONSHIPS_RESOLVED",
  "DEPENDENCY_VALIDATED",
  "CONFLICT_DETECTED",
  "BLOCKED",
  "READY_FOR_ORDERING",
  "ORDERED",
  "SUPERSEDED",
  "ESCALATED",
  "CERTIFICATION_REQUIRED",
  "REJECTED",
  "ARCHIVED",
]);

const ACTIVE_STATES = new Set<DecisionGraphNodeState>([
  "CREATED",
  "REGISTERED",
  "RELATIONSHIPS_PENDING",
  "RELATIONSHIPS_RESOLVED",
  "DEPENDENCY_VALIDATED",
  "CONFLICT_DETECTED",
  "BLOCKED",
  "READY_FOR_ORDERING",
  "ORDERED",
]);

const STATE_TRANSITIONS: Readonly<Record<DecisionGraphNodeState, readonly DecisionGraphNodeState[]>> = Object.freeze({
  CREATED: ["REGISTERED", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  REGISTERED: ["RELATIONSHIPS_PENDING", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  RELATIONSHIPS_PENDING: ["RELATIONSHIPS_RESOLVED", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  RELATIONSHIPS_RESOLVED: ["DEPENDENCY_VALIDATED", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  DEPENDENCY_VALIDATED: ["READY_FOR_ORDERING", "CONFLICT_DETECTED", "BLOCKED", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  CONFLICT_DETECTED: ["REJECTED", "ARCHIVED"],
  BLOCKED: ["REJECTED", "ARCHIVED"],
  READY_FOR_ORDERING: ["ORDERED", "SUPERSEDED", "ESCALATED", "CERTIFICATION_REQUIRED", "REJECTED"],
  ORDERED: ["ARCHIVED"],
  SUPERSEDED: ["ARCHIVED"],
  ESCALATED: ["ARCHIVED"],
  CERTIFICATION_REQUIRED: ["ORDERED", "REJECTED", "ARCHIVED"],
  REJECTED: ["ARCHIVED"],
  ARCHIVED: [],
});

function hashGraphValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionGraphRoadmapReasonCode[], reason: DecisionGraphRoadmapReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function nodeHashPayload(node: DecisionGraphRoadmapNodeInput, contractVersion = DECISION_GRAPH_CONTRACT_VERSION): Record<string, unknown> {
  return {
    node_id: node.node_id,
    decision_candidate_id: node.decision_candidate_id,
    tenant_id: node.tenant_id,
    mission_id: node.mission_id,
    decision_type: node.decision_type,
    priority: node.priority,
    state: node.state,
    dependency_refs: normalizeStrings(node.dependency_refs),
    conflict_refs: normalizeStrings(node.conflict_refs),
    blocker_refs: normalizeStrings(node.blocker_refs),
    supporting_refs: normalizeStrings(node.supporting_refs),
    governance_refs: normalizeStrings(node.governance_refs),
    replay_refs: normalizeStrings(node.replay_refs),
    source_candidate_hash: node.source_candidate_hash,
    contract_version: contractVersion,
  };
}

function relationshipHashPayload(relationship: DecisionGraphRoadmapRelationshipInput): Record<string, unknown> {
  return {
    relationship_id: relationship.relationship_id,
    graph_id: relationship.graph_id,
    tenant_id: relationship.tenant_id,
    mission_id: relationship.mission_id,
    source_node_id: relationship.source_node_id,
    target_node_id: relationship.target_node_id,
    relationship_type: relationship.relationship_type,
    governance_refs: normalizeStrings(relationship.governance_refs),
    replay_refs: normalizeStrings(relationship.replay_refs),
  };
}

export function computeDecisionGraphNodeIntegrityHash(
  node: DecisionGraphRoadmapNodeInput,
  contractVersion = DECISION_GRAPH_CONTRACT_VERSION,
): string {
  return hashGraphValue("decision-graph-roadmap-node", nodeHashPayload(node, contractVersion));
}

export function computeDecisionGraphRelationshipIntegrityHash(relationship: DecisionGraphRoadmapRelationshipInput): string {
  return hashGraphValue("decision-graph-roadmap-relationship", relationshipHashPayload(relationship));
}

export function createDecisionGraphIntegrityHash(
  node: DecisionGraphRoadmapNodeInput,
  contractVersion = DECISION_GRAPH_CONTRACT_VERSION,
): DecisionGraphIntegrityHash {
  const computedHash = computeDecisionGraphNodeIntegrityHash(node, contractVersion);
  const replayComputedHash = computeDecisionGraphNodeIntegrityHash({
    ...node,
    integrity_hash: computedHash,
  }, contractVersion);

  return Object.freeze({
    hash_id: `hash:${node.node_id}:${contractVersion}`,
    node_id: node.node_id,
    contract_version: contractVersion,
    hash_algorithm: "sha256",
    canonical_payload_ref: hashGraphValue("decision-graph-roadmap-node-payload", nodeHashPayload(node, contractVersion)),
    computed_hash: computedHash,
    replay_computed_hash: replayComputedHash,
    hash_state: computedHash === replayComputedHash ? "MATCHED" : "MISMATCHED",
  });
}

export function createDecisionRelationshipTypeRegistry(
  overrides: Partial<DecisionRelationshipTypeRegistry> = {},
): DecisionRelationshipTypeRegistry {
  const core = {
    registry_id: "decision-relationship-registry",
    registry_version: DECISION_RELATIONSHIP_REGISTRY_VERSION,
    allowed_relationship_types: CANONICAL_DECISION_RELATIONSHIP_TYPES,
    relationship_direction_rules: {
      depends_on: "source depends on target",
      blocks: "source blocks target",
      conflicts_with: "source conflicts with target",
      supersedes: "source supersedes target",
      supports: "source supports target",
      weakens: "source weakens target",
      escalates_to: "source escalates to target or authority reference",
      requires_operator_approval: "source requires operator approval before orchestration",
      requires_governance_review: "source requires governance review before orchestration",
      requires_simulation: "source requires simulation before consideration",
      requires_recovery_plan: "source requires recovery plan before orchestration",
      requires_certification: "source requires certification gate before orchestration",
    },
    relationship_cardinality_rules: Object.fromEntries(
      CANONICAL_DECISION_RELATIONSHIP_TYPES.map((type) => [type, "MANY_TO_MANY"]),
    ) as DecisionRelationshipTypeRegistry["relationship_cardinality_rules"],
    inverse_relationship_rules: Object.fromEntries(
      CANONICAL_DECISION_RELATIONSHIP_TYPES.map((type) => [type, null]),
    ) as DecisionRelationshipTypeRegistry["inverse_relationship_rules"],
    prohibited_relationship_combinations: ["depends_on+self", "hidden_relationship", "cross_tenant_relationship"],
    governance_required_types: CANONICAL_DECISION_RELATIONSHIP_TYPES,
    replay_required_types: CANONICAL_DECISION_RELATIONSHIP_TYPES,
  };

  const registry = {
    ...core,
    ...overrides,
  };

  return Object.freeze({
    ...registry,
    allowed_relationship_types: Object.freeze([...registry.allowed_relationship_types]),
    governance_required_types: Object.freeze([...registry.governance_required_types]),
    replay_required_types: Object.freeze([...registry.replay_required_types]),
    integrity_hash: hashGraphValue("decision-relationship-registry", {
      ...registry,
      integrity_hash: undefined,
    }),
  });
}

export function createDecisionDependencyGraphContract(
  input: Omit<DecisionDependencyGraphContract, "integrity_hash">,
): DecisionDependencyGraphContract {
  const { integrity_hash: _ignoredIntegrityHash, ...hashableInput } = input as Omit<DecisionDependencyGraphContract, "integrity_hash"> & {
    integrity_hash?: string;
  };
  const contract = {
    ...hashableInput,
    allowed_relationship_types: Object.freeze([...hashableInput.allowed_relationship_types]),
    graph_state_model: Object.freeze([...hashableInput.graph_state_model]),
  };

  return Object.freeze({
    ...contract,
    integrity_hash: hashGraphValue("decision-dependency-graph-contract", contract),
  });
}

export function createDecisionGraphReplayContract(
  input: Omit<DecisionGraphReplayContract, "expected_replay_hash">,
): DecisionGraphReplayContract {
  const replayCore = {
    ...input,
    candidate_refs: normalizeStrings(input.candidate_refs),
    relationship_refs: normalizeStrings(input.relationship_refs),
    governance_refs: normalizeStrings(input.governance_refs),
    integrity_hash_refs: normalizeStrings(input.integrity_hash_refs),
  };

  return Object.freeze({
    ...replayCore,
    expected_replay_hash: hashGraphValue("decision-graph-replay-contract", replayCore),
  });
}

export function buildDecisionGraphRoadmapInput(
  tenantId: string,
  missionId: string,
  graphId: string,
  nodes: readonly DecisionGraphRoadmapNodeInput[],
  relationships: readonly DecisionGraphRoadmapRelationshipInput[],
): DecisionGraphRoadmapInput {
  const registry = createDecisionRelationshipTypeRegistry();
  const contract = createDecisionDependencyGraphContract({
    contract_id: `contract:${graphId}`,
    contract_version: DECISION_GRAPH_CONTRACT_VERSION,
    graph_id: graphId,
    tenant_id: tenantId,
    mission_id: missionId,
    graph_scope: "TENANT_MISSION",
    allowed_node_types: ["RECOMMENDATION", "SIMULATION", "CONSTRAINT", "GOVERNANCE", "ESCALATION", "OBSERVABILITY"],
    allowed_relationship_types: registry.allowed_relationship_types,
    graph_state_model: DECISION_GRAPH_NODE_STATES,
    integrity_rules_ref: "decision-graph-integrity-rules/v1",
    replay_contract_ref: `replay:${graphId}`,
    governance_contract_ref: `governance:${tenantId}:${missionId}`,
    certification_ref: `certification:${graphId}`,
    created_at: "2026-07-03T00:00:00.000Z",
  });
  const replay = createDecisionGraphReplayContract({
    replay_contract_id: `replay:${graphId}`,
    graph_id: graphId,
    tenant_id: tenantId,
    mission_id: missionId,
    contract_version: contract.contract_version,
    schema_version: DECISION_GRAPH_SCHEMA_VERSION,
    relationship_registry_version: registry.registry_version,
    graph_state_model_version: DECISION_GRAPH_STATE_MODEL_VERSION,
    candidate_refs: nodes.map((node) => node.decision_candidate_id),
    relationship_refs: relationships.map((relationship) => relationship.relationship_id),
    governance_refs: [
      ...nodes.flatMap((node) => node.governance_refs),
      ...relationships.flatMap((relationship) => relationship.governance_refs),
    ],
    integrity_hash_refs: nodes.map((node) => node.integrity_hash ?? ""),
  });

  return Object.freeze({
    contract,
    registry,
    nodes: Object.freeze([...nodes].sort((a, b) => a.node_id.localeCompare(b.node_id))),
    relationships: Object.freeze([...relationships].sort((a, b) => a.relationship_id.localeCompare(b.relationship_id))),
    replay,
  });
}

function validateContract(input: DecisionGraphRoadmapInput, reasons: DecisionGraphRoadmapReasonCode[]): boolean {
  const contract = input.contract;
  const valid = contract.contract_id.length > 0
    && contract.contract_version.length > 0
    && contract.graph_id.length > 0
    && contract.tenant_id.length > 0
    && contract.mission_id.length > 0
    && contract.graph_scope === "TENANT_MISSION"
    && contract.integrity_rules_ref.length > 0
    && contract.replay_contract_ref.length > 0
    && contract.governance_contract_ref.length > 0
    && contract.certification_ref.length > 0
    && contract.integrity_hash === createDecisionDependencyGraphContract({ ...contract }).integrity_hash;

  addReason(reasons, valid ? "GRAPH_CONTRACT_SCHEMA_DEFINED" : "GRAPH_CONTRACT_SCHEMA_INVALID");
  return valid;
}

function validateRegistry(input: DecisionGraphRoadmapInput, reasons: DecisionGraphRoadmapReasonCode[]): boolean {
  const allowed = new Set(input.registry.allowed_relationship_types);
  const complete = CANONICAL_DECISION_RELATIONSHIP_TYPES.every((type) => allowed.has(type));
  const registered = input.relationships.every((relationship) => allowed.has(relationship.relationship_type));

  addReason(reasons, complete && registered ? "RELATIONSHIP_TYPES_REGISTERED" : "UNKNOWN_RELATIONSHIP_TYPE_REJECTED");
  return complete && registered;
}

function validateNodes(input: DecisionGraphRoadmapInput, reasons: DecisionGraphRoadmapReasonCode[]): boolean {
  const states = new Set(input.contract.graph_state_model);
  const schemaValid = input.nodes.length > 0 && input.nodes.every((node) => (
    node.node_id.length > 0
    && node.decision_candidate_id.length > 0
    && node.tenant_id === input.contract.tenant_id
    && node.mission_id === input.contract.mission_id
    && node.source_candidate_hash.length > 0
    && node.governance_refs.length > 0
    && node.replay_refs.length > 0
  ));
  const missingCandidate = input.nodes.some((node) => node.decision_candidate_id.length === 0);
  const validStates = input.nodes.every((node) => states.has(node.state));
  const validTransitions = input.nodes.every((node) => {
    if (!node.previous_state) return true;
    if (!ACTIVE_STATES.has(node.previous_state) && node.state !== "ARCHIVED") return false;
    return STATE_TRANSITIONS[node.previous_state].includes(node.state);
  });
  const governanceRefsPresent = input.nodes.every((node) => node.governance_refs.length > 0);
  const replayRefsPresent = input.nodes.every((node) => node.replay_refs.length > 0);
  const hashesPresent = input.nodes.every((node) => Boolean(node.integrity_hash));
  const hashesMatch = input.nodes.every((node) => node.integrity_hash === computeDecisionGraphNodeIntegrityHash(node, input.contract.contract_version));
  const hiddenRelationships = input.nodes.some((node) => (node.hidden_relationship_refs ?? []).length > 0);

  addReason(reasons, schemaValid ? "NODE_SCHEMA_VALID" : "NODE_SCHEMA_INCOMPLETE");
  if (missingCandidate) addReason(reasons, "MISSING_CANDIDATE_LINK");
  addReason(reasons, validStates ? "GRAPH_STATE_MODEL_DEFINED" : "INVALID_GRAPH_STATE_REJECTED");
  if (!validTransitions) addReason(reasons, "INVALID_STATE_TRANSITION_REJECTED");
  addReason(reasons, governanceRefsPresent ? "GOVERNANCE_REFS_PRESENT" : "GOVERNANCE_REFS_MISSING");
  addReason(reasons, replayRefsPresent ? "REPLAY_REFS_PRESENT" : "REPLAY_REFS_MISSING");
  if (!hashesPresent) addReason(reasons, "MISSING_INTEGRITY_HASH_REJECTED");
  addReason(reasons, hashesPresent && hashesMatch ? "NODE_INTEGRITY_HASH_REPRODUCIBLE" : "HASH_MISMATCH_DETECTED");
  if (hiddenRelationships) addReason(reasons, "HIDDEN_RELATIONSHIP_REJECTED");

  return schemaValid && !missingCandidate && validStates && validTransitions && governanceRefsPresent && replayRefsPresent && hashesPresent && hashesMatch && !hiddenRelationships;
}

function validateRelationships(input: DecisionGraphRoadmapInput, reasons: DecisionGraphRoadmapReasonCode[]): boolean {
  const nodeIds = new Set(input.nodes.map((node) => node.node_id));
  const tenantScoped = input.relationships.every((relationship) => relationship.tenant_id === input.contract.tenant_id);
  const missionScoped = input.relationships.every((relationship) => relationship.mission_id === input.contract.mission_id);
  const endpointsPresent = input.relationships.every((relationship) => nodeIds.has(relationship.source_node_id) && nodeIds.has(relationship.target_node_id));
  const noSelfDependency = input.relationships.every((relationship) => relationship.source_node_id !== relationship.target_node_id);
  const refsPresent = input.relationships.every((relationship) => relationship.governance_refs.length > 0 && relationship.replay_refs.length > 0);
  const hashesMatch = input.relationships.every((relationship) => (
    !relationship.integrity_hash
    || relationship.integrity_hash === computeDecisionGraphRelationshipIntegrityHash(relationship)
  ));
  const hidden = input.relationships.some((relationship) => relationship.hidden === true);

  addReason(reasons, tenantScoped ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_RELATIONSHIP_REJECTED");
  addReason(reasons, missionScoped ? "MISSION_SCOPE_VALID" : "CROSS_TENANT_RELATIONSHIP_REJECTED");
  if (!noSelfDependency) addReason(reasons, "SELF_DEPENDENCY_REJECTED");
  if (!refsPresent) {
    addReason(reasons, input.relationships.every((relationship) => relationship.governance_refs.length > 0) ? "GOVERNANCE_REFS_PRESENT" : "GOVERNANCE_REFS_MISSING");
    addReason(reasons, input.relationships.every((relationship) => relationship.replay_refs.length > 0) ? "REPLAY_REFS_PRESENT" : "REPLAY_REFS_MISSING");
  }
  addReason(reasons, hashesMatch ? "RELATIONSHIP_INTEGRITY_HASH_REPRODUCIBLE" : "HASH_MISMATCH_DETECTED");
  if (hidden) addReason(reasons, "HIDDEN_RELATIONSHIP_REJECTED");

  return tenantScoped && missionScoped && endpointsPresent && noSelfDependency && refsPresent && hashesMatch && !hidden;
}

function replayHash(input: DecisionGraphRoadmapInput): string {
  return hashGraphValue("decision-graph-roadmap-replay", {
    contract: input.contract,
    registry: input.registry,
    nodes: input.nodes.map((node) => nodeHashPayload(node, input.contract.contract_version)),
    relationships: input.relationships.map(relationshipHashPayload),
  });
}

function validateReplay(input: DecisionGraphRoadmapInput, reasons: DecisionGraphRoadmapReasonCode[]): { valid: boolean; hash: string } {
  const hash = replayHash(input);
  const replayCore = {
    replay_contract_id: input.replay.replay_contract_id,
    graph_id: input.replay.graph_id,
    tenant_id: input.replay.tenant_id,
    mission_id: input.replay.mission_id,
    contract_version: input.replay.contract_version,
    schema_version: input.replay.schema_version,
    relationship_registry_version: input.replay.relationship_registry_version,
    graph_state_model_version: input.replay.graph_state_model_version,
    candidate_refs: input.nodes.map((node) => node.decision_candidate_id),
    relationship_refs: input.relationships.map((relationship) => relationship.relationship_id),
    governance_refs: [
      ...input.nodes.flatMap((node) => node.governance_refs),
      ...input.relationships.flatMap((relationship) => relationship.governance_refs),
    ],
    integrity_hash_refs: input.nodes.map((node) => node.integrity_hash ?? ""),
  };
  const expectedReplay = createDecisionGraphReplayContract(replayCore);
  const replayValid = input.replay.expected_replay_hash === expectedReplay.expected_replay_hash
    && input.replay.candidate_refs.length === expectedReplay.candidate_refs.length
    && input.replay.relationship_refs.length === expectedReplay.relationship_refs.length;

  addReason(reasons, replayValid ? "GRAPH_CONTRACT_REPLAY_COMPATIBLE" : "REPLAY_DIVERGENCE_REJECTED");
  addReason(reasons, "NO_HIDDEN_GRAPH_CONTEXT_REQUIRED");
  return { valid: replayValid, hash };
}

export function validateDecisionGraphRoadmapContract(input: DecisionGraphRoadmapInput): DecisionGraphRoadmapValidation {
  const reasons: DecisionGraphRoadmapReasonCode[] = [];
  const contractValid = validateContract(input, reasons);
  const registryValid = validateRegistry(input, reasons);
  const nodesValid = validateNodes(input, reasons);
  const relationshipsValid = validateRelationships(input, reasons);
  const replay = validateReplay(input, reasons);
  const valid = contractValid && registryValid && nodesValid && relationshipsValid && replay.valid;

  return Object.freeze({
    valid,
    certificationStatus: valid ? "PASS" : "FAIL",
    reasonCodes: normalizeStrings(reasons) as readonly DecisionGraphRoadmapReasonCode[],
    contractHash: input.contract.integrity_hash,
    replayHash: replay.hash,
    graph_contract_schema_defined: contractValid,
    relationship_types_registered: registryValid,
    graph_state_model_defined: input.contract.graph_state_model.every((state) => DECISION_GRAPH_NODE_STATES.includes(state)),
    node_integrity_hash_reproducible: nodesValid,
    invalid_relationship_types_rejected: registryValid,
    graph_contract_replay_compatible: replay.valid,
    failClosed: true as const,
    deterministic: true as const,
  });
}

export const DecisionGraphContractRoadmap = Object.freeze({
  buildInput: buildDecisionGraphRoadmapInput,
  createContract: createDecisionDependencyGraphContract,
  createIntegrityHash: createDecisionGraphIntegrityHash,
  createRegistry: createDecisionRelationshipTypeRegistry,
  createReplay: createDecisionGraphReplayContract,
  hashNode: computeDecisionGraphNodeIntegrityHash,
  hashRelationship: computeDecisionGraphRelationshipIntegrityHash,
  validate: validateDecisionGraphRoadmapContract,
});
