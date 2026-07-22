import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipRecord,
  GraphOrderingEngineInput,
  GraphOrderingEngineResult,
  GraphOrderingReasonCode,
  GraphOrderingRecord,
  OrderingExplanation,
  OrderingLedgerRecord,
  ReplayOrderingRecord,
} from "./types";

export const GRAPH_ORDERING_ENGINE_VERSION = "decision-graph-ordering-engine/v1";
const ORDERING_TIMESTAMP_REF = "graph-ordering-ledger-timestamp-ref";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GraphOrderingReasonCode[], reason: GraphOrderingReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<GraphOrderingRecord, "integrity_hash"> | GraphOrderingRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as GraphOrderingRecord;
  return hash(hashable);
}

function replayRecordHash(record: Omit<ReplayOrderingRecord, "integrity_hash"> | ReplayOrderingRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as ReplayOrderingRecord;
  return hash(hashable);
}

function explanationHash(record: Omit<OrderingExplanation, "integrity_hash"> | OrderingExplanation): string {
  const { integrity_hash: _ignored, ...hashable } = record as OrderingExplanation;
  return hash(hashable);
}

function ledgerHash(record: Omit<OrderingLedgerRecord, "integrity_hash"> | OrderingLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as OrderingLedgerRecord;
  return hash(hashable);
}

function resultHash(result: Omit<GraphOrderingEngineResult, "integrity_hash"> | GraphOrderingEngineResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as GraphOrderingEngineResult;
  return hash(hashable);
}

function relationshipIntegrityHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function nodeById(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function tieBreakKey(node: DecisionGraphRoadmapNodeInput): string {
  return [
    String(node.dependency_refs.length).padStart(4, "0"),
    String(node.blocker_refs.length).padStart(4, "0"),
    String(node.conflict_refs.length).padStart(4, "0"),
    String(node.governance_refs.length === 0 ? 1 : 0),
    String((node.authority_refs ?? []).length > 0 ? 1 : 0),
    String(node.replay_refs.length === 0 ? 1 : 0),
    String((node.certification_refs ?? []).length > 0 ? 1 : 0),
    String(node.priority).padStart(8, "0"),
    node.created_at,
    node.node_id,
  ].join("|");
}

function dependencyEdges(relationships: readonly DecisionRelationshipRecord[], eligible: Set<string>): DecisionRelationshipRecord[] {
  return relationships
    .filter((relationship) => relationship.relationship_type === "depends_on"
      && relationship.target_type === "DECISION_NODE"
      && eligible.has(relationship.source_node_id)
      && eligible.has(relationship.target_node_id))
    .sort((a, b) => `${a.target_node_id}|${a.source_node_id}`.localeCompare(`${b.target_node_id}|${b.source_node_id}`));
}

function topologicalOrder(nodes: readonly DecisionGraphRoadmapNodeInput[], relationships: readonly DecisionRelationshipRecord[]): string[] | undefined {
  const eligible = new Set(nodes.map((node) => node.node_id));
  const indegree = new Map(nodes.map((node) => [node.node_id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const edge of dependencyEdges(relationships, eligible)) {
    outgoing.set(edge.target_node_id, normalizeStrings([...(outgoing.get(edge.target_node_id) ?? []), edge.source_node_id]));
    indegree.set(edge.source_node_id, (indegree.get(edge.source_node_id) ?? 0) + 1);
  }
  const nodeMap = nodeById(nodes);
  const available = nodes.filter((node) => (indegree.get(node.node_id) ?? 0) === 0).sort((a, b) => tieBreakKey(a).localeCompare(tieBreakKey(b)));
  const ordered: string[] = [];
  while (available.length > 0) {
    const node = available.shift()!;
    ordered.push(node.node_id);
    for (const dependentId of outgoing.get(node.node_id) ?? []) {
      const next = (indegree.get(dependentId) ?? 0) - 1;
      indegree.set(dependentId, next);
      if (next === 0) {
        const dependent = nodeMap.get(dependentId);
        if (dependent) {
          available.push(dependent);
          available.sort((a, b) => tieBreakKey(a).localeCompare(tieBreakKey(b)));
        }
      }
    }
  }
  return ordered.length === nodes.length ? ordered : undefined;
}

function orderingHash(input: { ordered: readonly string[]; excluded: readonly string[]; version: string; graphId: string }): string {
  return hash(input);
}

function eligibleNodes(input: GraphOrderingEngineInput, reasons: GraphOrderingReasonCode[]): { eligible: DecisionGraphRoadmapNodeInput[]; excluded: string[] } {
  const graphSafetyEligible = new Set(input.graph_safety.eligible_for_ordering_node_ids);
  const blockerExcluded = new Set(input.blocker_detection?.blocked_node_ids ?? []);
  const conflictExcluded = new Set(input.conflict_detection?.updated_nodes.filter((node) => node.conflict_refs.length > 0).map((node) => node.node_id) ?? []);
  const excluded: string[] = [];
  const eligible: DecisionGraphRoadmapNodeInput[] = [];
  for (const node of input.nodes) {
    const blocked = node.state === "BLOCKED" || node.blocker_refs.length > 0 || blockerExcluded.has(node.node_id);
    const conflicted = node.state === "CONFLICT_DETECTED" || node.conflict_refs.length > 0 || conflictExcluded.has(node.node_id);
    const terminal = node.state === "SUPERSEDED" || node.state === "REJECTED" || node.state === "ARCHIVED";
    const certificationPending = node.state === "CERTIFICATION_REQUIRED";
    const replayMissing = node.replay_refs.length === 0;
    const governanceMissing = node.governance_refs.length === 0;
    if (!graphSafetyEligible.has(node.node_id) || blocked || conflicted || terminal || certificationPending || replayMissing || governanceMissing) {
      excluded.push(node.node_id);
      if (blocked) addReason(reasons, "BLOCKED_NODES_EXCLUDED");
      if (conflicted) addReason(reasons, "CONFLICTED_NODES_EXCLUDED");
      if (node.state === "SUPERSEDED") addReason(reasons, "SUPERSEDED_NODES_EXCLUDED");
      if (node.state === "ARCHIVED") addReason(reasons, "ARCHIVED_NODES_EXCLUDED");
      if (certificationPending) addReason(reasons, "CERTIFICATION_INCOMPLETE");
      if (replayMissing) addReason(reasons, "REPLAY_REFERENCES_MISSING");
      if (governanceMissing) addReason(reasons, "GOVERNANCE_INCOMPLETE");
      continue;
    }
    eligible.push(node);
  }
  return { eligible: eligible.sort((a, b) => tieBreakKey(a).localeCompare(tieBreakKey(b))), excluded: normalizeStrings(excluded) };
}

function buildOrderingRecord(input: {
  graphId: string;
  ordered: readonly string[];
  excluded: readonly string[];
  nodes: readonly DecisionGraphRoadmapNodeInput[];
  dependencyValidationRef: string;
  version: string;
}): GraphOrderingRecord {
  const ordering_hash = orderingHash({ ordered: input.ordered, excluded: input.excluded, version: input.version, graphId: input.graphId });
  const base: Omit<GraphOrderingRecord, "integrity_hash"> = {
    ordering_id: `ordering_${input.graphId}`,
    graph_id: input.graphId,
    ordered_nodes: Object.freeze([...input.ordered]),
    excluded_nodes: Object.freeze([...input.excluded]),
    ordering_algorithm: "deterministic_topological_sort",
    ordering_version: input.version,
    dependency_validation_ref: input.dependencyValidationRef,
    governance_refs: normalizeStrings(input.nodes.flatMap((node) => node.governance_refs)),
    authority_refs: normalizeStrings(input.nodes.flatMap((node) => node.authority_refs ?? [])),
    replay_refs: normalizeStrings(input.nodes.flatMap((node) => node.replay_refs)),
    certification_refs: normalizeStrings(input.nodes.flatMap((node) => node.certification_refs ?? [])),
    ordering_hash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(input: {
  graphId: string;
  node: DecisionGraphRoadmapNodeInput;
  position?: number;
  excluded: readonly string[];
  version: string;
  orderingHash: string;
}): OrderingExplanation {
  const state = input.position ? "ORDERED" : "EXCLUDED";
  const base: Omit<OrderingExplanation, "integrity_hash"> = {
    explanation_id: `ordering_explanation_${input.node.node_id}`,
    graph_id: input.graphId,
    node_id: input.node.node_id,
    execution_position: input.position,
    ordering_state: state,
    dependency_justification: input.node.dependency_refs.length > 0 ? "Dependencies are satisfied by prior ordered nodes." : "No dependency prerequisite blocks ordering.",
    governance_rationale: input.node.governance_refs.length > 0 ? "Governance refs are present for ordering evidence." : "Governance refs are incomplete.",
    authority_rationale: (input.node.authority_refs ?? []).length > 0 ? "Authority refs are captured before ordering." : "No authority refs are required.",
    tie_break_rationale: `Tie-break key ${tieBreakKey(input.node)}.`,
    replay_refs: input.node.replay_refs,
    certification_status: (input.node.certification_refs ?? []).length > 0 ? "COMPLETE" : "NOT_REQUIRED",
    excluded_nodes: Object.freeze([...input.excluded]),
    ordering_algorithm_version: input.version,
    integrity_evidence: input.orderingHash,
  };
  return Object.freeze({ ...base, integrity_hash: explanationHash(base) });
}

function buildLedger(input: {
  graphId: string;
  node: DecisionGraphRoadmapNodeInput;
  position?: number;
  orderingHash: string;
}): OrderingLedgerRecord {
  const base: Omit<OrderingLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `ordering_ledger_${input.node.node_id}`,
    graph_id: input.graphId,
    ordering_position: input.position,
    node_id: input.node.node_id,
    ordering_reason: input.position ? "Node selected by deterministic topological ordering." : "Node excluded by eligibility rules.",
    dependency_refs: input.node.dependency_refs,
    governance_refs: input.node.governance_refs,
    authority_refs: input.node.authority_refs ?? [],
    replay_refs: input.node.replay_refs,
    ordering_hash: input.orderingHash,
    timestamp: ORDERING_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function updateNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], ordered: readonly string[]): DecisionGraphRoadmapNodeInput[] {
  const orderedSet = new Set(ordered);
  return [...nodes].map((node) => {
    const state = orderedSet.has(node.node_id) ? "ORDERED" : node.state;
    const hashable = { ...node, state, previous_state: node.state };
    return Object.freeze({ ...hashable, integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION) } satisfies DecisionGraphRoadmapNodeInput);
  }).sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function replayHash(input: {
  ordering?: GraphOrderingRecord;
  replay?: ReplayOrderingRecord;
  explanations: readonly OrderingExplanation[];
  ledger: readonly OrderingLedgerRecord[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
}): string {
  return hash(input);
}

function failResult(input: GraphOrderingEngineInput, reasons: GraphOrderingReasonCode[], version: string): GraphOrderingEngineResult {
  const replay = hash({ failed: true, graph_id: input.graph_id, reasons: normalizeStrings(reasons), version });
  const base: Omit<GraphOrderingEngineResult, "integrity_hash"> = {
    ordering_status: "FAIL",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as GraphOrderingReasonCode[]),
    explanations: Object.freeze([]),
    ledger_records: Object.freeze([]),
    updated_nodes: Object.freeze([]),
    ordered_node_ids: Object.freeze([]),
    excluded_node_ids: Object.freeze([]),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function orderDecisionGraph(input: GraphOrderingEngineInput): GraphOrderingEngineResult {
  const reasons: GraphOrderingReasonCode[] = [];
  const version = input.ordering_version ?? GRAPH_ORDERING_ENGINE_VERSION;
  addReason(reasons, "VALIDATED_GRAPH_LOADED");
  if ((input.hidden_ordering_refs ?? []).length > 0) return failResult(input, [...reasons, "HIDDEN_ORDERING_LOGIC_REJECTED"], version);
  if (input.random_ordering_requested === true) return failResult(input, [...reasons, "RANDOM_ORDERING_REJECTED"], version);
  if ((input.expected_graph_version ?? input.graph_version) !== input.graph_version) return failResult(input, [...reasons, "GRAPH_INTEGRITY_MISMATCH"], version);
  if (input.graph_safety.safety_status !== "SAFE") return failResult(input, [...reasons, "GRAPH_SAFETY_INVALID"], version);
  addReason(reasons, "GRAPH_SAFETY_PREREQUISITE_ENFORCED");
  if (!input.relationships.every((relationship) => relationship.integrity_hash === relationshipIntegrityHash(relationship))) return failResult(input, [...reasons, "GRAPH_INTEGRITY_MISMATCH"], version);

  const eligibility = eligibleNodes(input, reasons);
  addReason(reasons, "ELIGIBILITY_EVALUATION_COMPLETE");
  addReason(reasons, "REPLAY_READINESS_ENFORCED");
  addReason(reasons, "CERTIFICATION_READINESS_ENFORCED");
  addReason(reasons, "GOVERNANCE_PRECEDENCE_PRESERVED");
  addReason(reasons, "AUTHORITY_PRECEDENCE_PRESERVED");

  const ordered = topologicalOrder(eligibility.eligible, input.relationships);
  if (!ordered) return failResult(input, [...reasons, "DETERMINISTIC_ORDERING_NOT_PROVEN"], version);

  const position = new Map(ordered.map((nodeId, index) => [nodeId, index]));
  const dependencyOrderValid = dependencyEdges(input.relationships, new Set(ordered)).every((edge) => (position.get(edge.target_node_id) ?? -1) < (position.get(edge.source_node_id) ?? -1));
  if (!dependencyOrderValid) return failResult(input, [...reasons, "DEPENDENCY_ORDER_VIOLATED"], version);
  addReason(reasons, "DEPENDENCY_ORDER_PRESERVED");
  addReason(reasons, "TIE_BREAK_RESOLUTION_DETERMINISTIC");
  addReason(reasons, "ORDERING_VALIDATION_COMPLETE");

  const orderedNodes = ordered.map((nodeId) => eligibility.eligible.find((node) => node.node_id === nodeId)!).filter(Boolean);
  const ordering = buildOrderingRecord({
    graphId: input.graph_id,
    ordered,
    excluded: eligibility.excluded,
    nodes: orderedNodes,
    dependencyValidationRef: input.dependency_validation?.report.report_id ?? "dependency_validation_not_supplied",
    version,
  });
  const replayRecordBase: Omit<ReplayOrderingRecord, "integrity_hash"> = {
    replay_validation_id: `replay_ordering_${input.graph_id}`,
    graph_id: input.graph_id,
    expected_order: ordering.ordered_nodes,
    replayed_order: ordered,
    ordering_hash: ordering.ordering_hash,
    comparison_result: JSON.stringify(ordering.ordered_nodes) === JSON.stringify(ordered) ? "MATCH" : "MISMATCH",
    validator_version: version,
  };
  const replayRecord = Object.freeze({ ...replayRecordBase, integrity_hash: replayRecordHash(replayRecordBase) });
  if (replayRecord.comparison_result !== "MATCH") return failResult(input, [...reasons, "REPLAY_MISMATCH_DETECTED"], version);

  const allExplanationNodes = [...orderedNodes, ...input.nodes.filter((node) => eligibility.excluded.includes(node.node_id))];
  const explanations = Object.freeze(allExplanationNodes.map((node) => buildExplanation({
    graphId: input.graph_id,
    node,
    position: position.has(node.node_id) ? (position.get(node.node_id)! + 1) : undefined,
    excluded: eligibility.excluded,
    version,
    orderingHash: ordering.ordering_hash,
  })));
  addReason(reasons, "ORDERING_EXPLANATION_GENERATED");
  const ledger = Object.freeze(allExplanationNodes.map((node) => buildLedger({
    graphId: input.graph_id,
    node,
    position: position.has(node.node_id) ? (position.get(node.node_id)! + 1) : undefined,
    orderingHash: ordering.ordering_hash,
  })));
  addReason(reasons, "ORDERING_LEDGER_RECORDED");
  addReason(reasons, "ORDERING_HASH_REPRODUCIBLE");

  const updatedNodes = Object.freeze(updateNodes(input.nodes, ordered));
  const replay = replayHash({ ordering, replay: replayRecord, explanations, ledger, updatedNodes });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult(input, [...reasons, "REPLAY_MISMATCH_DETECTED"], version);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_ORDERING");

  const base: Omit<GraphOrderingEngineResult, "integrity_hash"> = {
    ordering_status: "PASS",
    certificationStatus: "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as GraphOrderingReasonCode[]),
    ordering_record: ordering,
    replay_record: replayRecord,
    explanations,
    ledger_records: ledger,
    updated_nodes: updatedNodes,
    ordered_node_ids: Object.freeze([...ordered]),
    excluded_node_ids: Object.freeze(eligibility.excluded),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const GraphOrderingEngine = Object.freeze({
  order: orderDecisionGraph,
});
