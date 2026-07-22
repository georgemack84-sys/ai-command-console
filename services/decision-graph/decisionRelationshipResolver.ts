import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  CANONICAL_DECISION_RELATIONSHIP_TYPES,
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
  createDecisionRelationshipTypeRegistry,
} from "./decisionGraphContractRoadmap";
import type {
  CanonicalDecisionRelationshipType,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipHint,
  DecisionRelationshipLedgerEvent,
  DecisionRelationshipLineage,
  DecisionRelationshipRecord,
  DecisionRelationshipResolverInput,
  DecisionRelationshipResolverReasonCode,
  DecisionRelationshipResolverResult,
  DecisionRelationshipTargetType,
} from "./types";

export const DECISION_RELATIONSHIP_RESOLVER_VERSION = "decision-relationship-resolver/v1";

const RULE_PRIORITY: readonly CanonicalDecisionRelationshipType[] = Object.freeze([
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

const REQUIREMENT_TARGET_TYPES: Readonly<Record<CanonicalDecisionRelationshipType, DecisionRelationshipTargetType>> = Object.freeze({
  depends_on: "DECISION_NODE",
  blocks: "DECISION_NODE",
  conflicts_with: "DECISION_NODE",
  supersedes: "DECISION_NODE",
  supports: "DECISION_NODE",
  weakens: "DECISION_NODE",
  escalates_to: "AUTHORITY",
  requires_operator_approval: "OPERATOR",
  requires_governance_review: "GOVERNANCE",
  requires_simulation: "SIMULATION",
  requires_recovery_plan: "RECOVERY",
  requires_certification: "CERTIFICATION",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionRelationshipResolverReasonCode[], reason: DecisionRelationshipResolverReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<DecisionRelationshipRecord, "integrity_hash"> | DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as DecisionRelationshipRecord;
  return hash(hashable);
}

function lineageHash(lineage: Omit<DecisionRelationshipLineage, "integrity_hash"> | DecisionRelationshipLineage): string {
  const { integrity_hash: _ignored, ...hashable } = lineage as DecisionRelationshipLineage;
  return hash(hashable);
}

function ledgerHash(event: Omit<DecisionRelationshipLedgerEvent, "integrity_hash"> | DecisionRelationshipLedgerEvent): string {
  const { integrity_hash: _ignored, ...hashable } = event as DecisionRelationshipLedgerEvent;
  return hash(hashable);
}

function resultHash(result: Omit<DecisionRelationshipResolverResult, "integrity_hash"> | DecisionRelationshipResolverResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as DecisionRelationshipResolverResult;
  return hash(hashable);
}

function relationshipBasisHash(hint: DecisionRelationshipHint): string {
  return hash({
    relationship_basis: normalizeStrings(hint.relationship_basis),
  });
}

function relationshipId(input: {
  graphId: string;
  hint: DecisionRelationshipHint;
  resolverVersion: string;
}): string {
  return `relationship_${hash({
    graph_id: input.graphId,
    source_node_id: input.hint.source_node_id,
    target_ref: input.hint.target_ref,
    relationship_type: input.hint.relationship_type,
    relationship_basis_hash: relationshipBasisHash(input.hint),
    resolver_version: input.resolverVersion,
  }).slice(0, 32)}`;
}

function duplicateKey(hint: DecisionRelationshipHint, resolverVersion: string): string {
  return [
    hint.source_node_id,
    hint.target_ref,
    hint.relationship_type,
    relationshipBasisHash(hint),
    resolverVersion,
  ].join("|");
}

function sortHints(hints: readonly DecisionRelationshipHint[]): DecisionRelationshipHint[] {
  return [...hints].sort((a, b) => {
    const priority = RULE_PRIORITY.indexOf(a.relationship_type) - RULE_PRIORITY.indexOf(b.relationship_type);
    if (priority !== 0) return priority;
    return duplicateKey(a, DECISION_RELATIONSHIP_RESOLVER_VERSION).localeCompare(duplicateKey(b, DECISION_RELATIONSHIP_RESOLVER_VERSION));
  });
}

function nodeMap(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function validateHint(
  input: DecisionRelationshipResolverInput,
  hint: DecisionRelationshipHint,
  nodes: Map<string, DecisionGraphRoadmapNodeInput>,
  reasons: DecisionRelationshipResolverReasonCode[],
): boolean {
  const registry = input.registry ?? createDecisionRelationshipTypeRegistry();
  const source = nodes.get(hint.source_node_id);
  const targetType = hint.target_type ?? REQUIREMENT_TARGET_TYPES[hint.relationship_type];
  const target = nodes.get(hint.target_ref);

  if (hint.hidden === true) {
    addReason(reasons, "HIDDEN_RELATIONSHIP");
    return false;
  }
  if (!registry.allowed_relationship_types.includes(hint.relationship_type)) {
    addReason(reasons, "UNKNOWN_RELATIONSHIP_TYPE");
    return false;
  }
  if (!source) {
    addReason(reasons, "RELATIONSHIP_WITH_MISSING_SOURCE_NODE");
    return false;
  }
  if (source.tenant_id !== input.tenant_id) {
    addReason(reasons, "CROSS_TENANT_RELATIONSHIP");
    return false;
  }
  if (source.mission_id !== input.mission_id) {
    addReason(reasons, "CROSS_MISSION_RELATIONSHIP");
    return false;
  }
  if (targetType === "DECISION_NODE") {
    if (!target) {
      addReason(reasons, "RELATIONSHIP_WITH_MISSING_TARGET_NODE");
      return false;
    }
    if (target.tenant_id !== source.tenant_id || target.tenant_id !== input.tenant_id) {
      addReason(reasons, "CROSS_TENANT_RELATIONSHIP");
      return false;
    }
    if (target.mission_id !== source.mission_id || target.mission_id !== input.mission_id) {
      addReason(reasons, "CROSS_MISSION_RELATIONSHIP");
      return false;
    }
  }
  if (targetType !== "DECISION_NODE" && hint.target_ref.length === 0) {
    addReason(reasons, "RELATIONSHIP_WITH_MISSING_TARGET_NODE");
    return false;
  }
  if ((hint.relationship_type === "depends_on" || hint.relationship_type === "blocks") && hint.source_node_id === hint.target_ref) {
    addReason(reasons, "SELF_DEPENDENCY");
    return false;
  }
  if (hint.relationship_type === "supersedes" && hint.source_node_id === hint.target_ref) {
    addReason(reasons, "SELF_SUPERSESSION");
    return false;
  }
  if (hint.governance_refs.length === 0) {
    addReason(reasons, "RELATIONSHIP_WITHOUT_GOVERNANCE_REF");
    return false;
  }
  if (hint.replay_refs.length === 0) {
    addReason(reasons, "RELATIONSHIP_WITHOUT_REPLAY_REF");
    return false;
  }
  if (hint.relationship_basis.length === 0) {
    addReason(reasons, "RELATIONSHIP_BASIS_MISSING");
    return false;
  }
  if (hint.target_type && hint.target_type !== targetType) {
    addReason(reasons, "AMBIGUOUS_RELATIONSHIP_DIRECTION");
    return false;
  }

  return true;
}

function deduplicateHints(
  hints: readonly DecisionRelationshipHint[],
  resolverVersion: string,
  reasons: DecisionRelationshipResolverReasonCode[],
): { hints: DecisionRelationshipHint[]; removedIds: string[] } {
  const byKey = new Map<string, DecisionRelationshipHint>();
  const removedIds: string[] = [];

  for (const hint of sortHints(hints)) {
    const key = duplicateKey(hint, resolverVersion);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, hint);
      continue;
    }

    const conflicting = existing.governance_refs.join("|") !== hint.governance_refs.join("|")
      || existing.replay_refs.join("|") !== hint.replay_refs.join("|")
      || existing.confidence_basis.join("|") !== hint.confidence_basis.join("|");
    if (conflicting) addReason(reasons, "DUPLICATE_RELATIONSHIP_CONFLICT");
    removedIds.push(key);
  }

  if (removedIds.length > 0) addReason(reasons, "DUPLICATE_RELATIONSHIPS_REMOVED");
  return { hints: [...byKey.values()], removedIds: normalizeStrings(removedIds) };
}

function validateCombinations(hints: readonly DecisionRelationshipHint[], reasons: DecisionRelationshipResolverReasonCode[]): boolean {
  const pairTypes = new Map<string, Set<CanonicalDecisionRelationshipType>>();
  let valid = true;

  for (const hint of hints) {
    const pair = `${hint.source_node_id}->${hint.target_ref}`;
    const reverse = `${hint.target_ref}->${hint.source_node_id}`;
    if (!pairTypes.has(pair)) pairTypes.set(pair, new Set());
    pairTypes.get(pair)!.add(hint.relationship_type);

    const reverseTypes = pairTypes.get(reverse);
    if (
      (hint.relationship_type === "depends_on" && reverseTypes?.has("depends_on"))
      || (hint.relationship_type === "supersedes" && reverseTypes?.has("supersedes"))
    ) {
      valid = false;
    }
  }

  for (const types of pairTypes.values()) {
    const hasSupport = types.has("supports");
    const contradictory = types.has("blocks") || types.has("conflicts_with");
    if (hasSupport && contradictory) valid = false;
  }

  if (!valid) addReason(reasons, "INVALID_RELATIONSHIP_COMBINATION");
  else addReason(reasons, "RELATIONSHIP_COMBINATION_VALIDATED");
  return valid;
}

function buildRelationship(
  input: DecisionRelationshipResolverInput,
  hint: DecisionRelationshipHint,
  nodes: Map<string, DecisionGraphRoadmapNodeInput>,
  resolverVersion: string,
): DecisionRelationshipRecord {
  const source = nodes.get(hint.source_node_id)!;
  const target = nodes.get(hint.target_ref);
  const targetType = hint.target_type ?? REQUIREMENT_TARGET_TYPES[hint.relationship_type];
  const base: Omit<DecisionRelationshipRecord, "integrity_hash"> = {
    relationship_id: relationshipId({ graphId: input.graph_id, hint, resolverVersion }),
    graph_id: input.graph_id,
    source_node_id: hint.source_node_id,
    target_node_id: hint.target_ref,
    target_type: targetType,
    relationship_type: hint.relationship_type,
    direction: "SOURCE_TO_TARGET",
    relationship_basis: normalizeStrings(hint.relationship_basis),
    confidence_basis: normalizeStrings(hint.confidence_basis),
    governance_refs: normalizeStrings(hint.governance_refs),
    replay_refs: normalizeStrings(hint.replay_refs),
    source_candidate_refs: Object.freeze([source.decision_candidate_id]),
    target_candidate_refs: Object.freeze([target?.decision_candidate_id ?? hint.target_ref]),
    resolver_version: resolverVersion,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLineage(
  relationship: DecisionRelationshipRecord,
  hint: DecisionRelationshipHint,
): DecisionRelationshipLineage {
  const base: Omit<DecisionRelationshipLineage, "integrity_hash"> = {
    lineage_id: `lineage_${relationship.relationship_id}`,
    relationship_id: relationship.relationship_id,
    source_node_id: relationship.source_node_id,
    target_node_id: relationship.target_node_id,
    source_candidate_ref: relationship.source_candidate_refs[0] ?? "",
    target_candidate_ref: relationship.target_candidate_refs[0] ?? "",
    relationship_type: relationship.relationship_type,
    relationship_basis_refs: relationship.relationship_basis,
    evidence_refs: normalizeStrings(hint.evidence_refs ?? []),
    risk_refs: normalizeStrings(hint.risk_refs ?? []),
    confidence_refs: relationship.confidence_basis,
    governance_refs: relationship.governance_refs,
    replay_refs: relationship.replay_refs,
    resolver_version: relationship.resolver_version,
  };
  return Object.freeze({ ...base, integrity_hash: lineageHash(base) });
}

function updateNodes(
  nodes: readonly DecisionGraphRoadmapNodeInput[],
  relationships: readonly DecisionRelationshipRecord[],
): DecisionGraphRoadmapNodeInput[] {
  const updated = new Map(nodes.map((node) => [node.node_id, { ...node }]));
  const append = (nodeId: string, field: keyof DecisionGraphRoadmapNodeInput, relationshipId: string): void => {
    const node = updated.get(nodeId);
    if (!node) return;
    const current = Array.isArray(node[field]) ? node[field] as readonly string[] : [];
    updated.set(nodeId, { ...node, [field]: normalizeStrings([...current, relationshipId]) });
  };

  for (const relationship of relationships) {
    switch (relationship.relationship_type) {
      case "depends_on":
        append(relationship.source_node_id, "dependency_refs", relationship.relationship_id);
        break;
      case "conflicts_with":
        append(relationship.source_node_id, "conflict_refs", relationship.relationship_id);
        break;
      case "blocks":
        append(relationship.target_node_id, "blocker_refs", relationship.relationship_id);
        break;
      case "supports":
        append(relationship.target_node_id, "supporting_refs", relationship.relationship_id);
        break;
      case "weakens":
        append(relationship.target_node_id, "weakening_refs", relationship.relationship_id);
        break;
      case "supersedes":
        append(relationship.source_node_id, "supersession_refs", relationship.relationship_id);
        break;
      case "escalates_to":
        append(relationship.source_node_id, "escalation_refs", relationship.relationship_id);
        break;
      case "requires_operator_approval":
      case "requires_governance_review":
        append(relationship.source_node_id, "blocker_refs", relationship.relationship_id);
        break;
      case "requires_simulation":
        append(relationship.source_node_id, "simulation_refs", relationship.relationship_id);
        break;
      case "requires_recovery_plan":
        append(relationship.source_node_id, "recovery_refs", relationship.relationship_id);
        break;
      case "requires_certification":
        append(relationship.source_node_id, "certification_refs", relationship.relationship_id);
        break;
      default:
        break;
    }
  }

  return [...updated.values()]
    .map((node) => {
      const nextState = node.state === "RELATIONSHIPS_PENDING" || node.state === "REGISTERED"
        ? "RELATIONSHIPS_RESOLVED"
        : node.state;
      const hashable = { ...node, state: nextState, previous_state: node.state };
      const next = {
        ...hashable,
        integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION),
      } satisfies DecisionGraphRoadmapNodeInput;
      return Object.freeze(next);
    })
    .sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function buildLedger(relationship: DecisionRelationshipRecord): DecisionRelationshipLedgerEvent {
  const base: Omit<DecisionRelationshipLedgerEvent, "integrity_hash"> = {
    event_id: `event_${relationship.relationship_id}`,
    relationship_id: relationship.relationship_id,
    event_type: "RELATIONSHIP_RESOLVED",
    replay_ref: relationship.replay_refs[0] ?? `replay_${relationship.relationship_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function replayHash(input: Omit<DecisionRelationshipResolverResult, "integrity_hash" | "certificationStatus" | "resolution_status" | "reasonCodes" | "deterministic" | "failClosed">): string {
  return hash({
    relationships: input.relationships,
    lineage: input.lineage,
    updated_nodes: input.updated_nodes,
    ledger_events: input.ledger_events,
    removed_duplicate_relationship_ids: input.removed_duplicate_relationship_ids,
  });
}

function failResult(
  reasons: DecisionRelationshipResolverReasonCode[],
  removedIds: readonly string[] = [],
): DecisionRelationshipResolverResult {
  const base: Omit<DecisionRelationshipResolverResult, "integrity_hash"> = {
    resolution_status: "FAIL",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DecisionRelationshipResolverReasonCode[]),
    relationships: Object.freeze([]),
    lineage: Object.freeze([]),
    updated_nodes: Object.freeze([]),
    ledger_events: Object.freeze([]),
    removed_duplicate_relationship_ids: Object.freeze([...removedIds]),
    replay_hash: hash({ failed: true, reasons: normalizeStrings(reasons), removedIds }),
    deterministic: true,
    failClosed: true,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function resolveDecisionRelationships(input: DecisionRelationshipResolverInput): DecisionRelationshipResolverResult {
  const reasons: DecisionRelationshipResolverReasonCode[] = [];
  const resolverVersion = input.resolver_version ?? DECISION_RELATIONSHIP_RESOLVER_VERSION;
  const registry = input.registry ?? createDecisionRelationshipTypeRegistry();
  const nodes = nodeMap(input.nodes);

  addReason(reasons, "GRAPH_NODES_RECEIVED");
  if (input.allow_implicit_relationships === true) return failResult(["GRAPH_NODES_RECEIVED", "IMPLICIT_UNRECORDED_RELATIONSHIP"]);
  if (!CANONICAL_DECISION_RELATIONSHIP_TYPES.every((type) => registry.allowed_relationship_types.includes(type))) {
    return failResult(["GRAPH_NODES_RECEIVED", "UNKNOWN_RELATIONSHIP_TYPE"]);
  }

  const scoped = input.nodes.every((node) => node.tenant_id === input.tenant_id && node.mission_id === input.mission_id);
  if (!scoped) return failResult(["GRAPH_NODES_RECEIVED", "CROSS_TENANT_RELATIONSHIP"]);
  addReason(reasons, "SCOPE_VALIDATED");
  addReason(reasons, "CANDIDATE_LINEAGE_COMPARED");

  const validHints: DecisionRelationshipHint[] = [];
  for (const hint of input.relationship_hints) {
    if (!validateHint(input, hint, nodes, reasons)) return failResult(reasons);
    validHints.push({
      ...hint,
      relationship_basis: Object.freeze(normalizeStrings(hint.relationship_basis)),
      confidence_basis: Object.freeze(normalizeStrings(hint.confidence_basis)),
      governance_refs: Object.freeze(normalizeStrings(hint.governance_refs)),
      replay_refs: Object.freeze(normalizeStrings(hint.replay_refs)),
      evidence_refs: Object.freeze(normalizeStrings(hint.evidence_refs ?? [])),
      risk_refs: Object.freeze(normalizeStrings(hint.risk_refs ?? [])),
    });
  }

  const deduped = deduplicateHints(validHints, resolverVersion, reasons);
  if (reasons.includes("DUPLICATE_RELATIONSHIP_CONFLICT")) return failResult(reasons, deduped.removedIds);
  if (!validateCombinations(deduped.hints, reasons)) return failResult(reasons, deduped.removedIds);

  addReason(reasons, "DEPENDENCY_MAPPING_COMPLETE");
  addReason(reasons, "SUPPORT_WEAKENING_RESOLUTION_COMPLETE");
  addReason(reasons, "SUPERSESSION_RESOLUTION_COMPLETE");
  addReason(reasons, "ESCALATION_RESOLUTION_COMPLETE");
  addReason(reasons, "RELATIONSHIP_DIRECTION_PRESERVED");

  const relationships = Object.freeze(deduped.hints.map((hint) => buildRelationship(input, hint, nodes, resolverVersion)).sort((a, b) => a.relationship_id.localeCompare(b.relationship_id)));
  const lineage = Object.freeze(relationships.map((relationship) => {
    const hint = deduped.hints.find((item) => relationshipId({ graphId: input.graph_id, hint: item, resolverVersion }) === relationship.relationship_id)!;
    return buildLineage(relationship, hint);
  }));
  const updatedNodes = Object.freeze(updateNodes(input.nodes, relationships));
  const ledger = Object.freeze(relationships.map(buildLedger));

  addReason(reasons, "RELATIONSHIP_LINEAGE_RECORDED");
  addReason(reasons, "GRAPH_NODE_REFS_UPDATED");
  addReason(reasons, "RELATIONSHIP_LEDGER_PERSISTED");

  const replay = replayHash({
    relationships,
    lineage,
    updated_nodes: updatedNodes,
    ledger_events: ledger,
    removed_duplicate_relationship_ids: deduped.removedIds,
    replay_hash: "",
  });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult([...reasons, "REPLAY_DIVERGENCE"], deduped.removedIds);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_RELATIONSHIPS");

  const base: Omit<DecisionRelationshipResolverResult, "integrity_hash"> = {
    resolution_status: "PASS",
    certificationStatus: "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as DecisionRelationshipResolverReasonCode[]),
    relationships,
    lineage,
    updated_nodes: updatedNodes,
    ledger_events: ledger,
    removed_duplicate_relationship_ids: Object.freeze(deduped.removedIds),
    replay_hash: replay,
    deterministic: true,
    failClosed: true,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const DecisionRelationshipResolver = Object.freeze({
  resolve: resolveDecisionRelationships,
});
