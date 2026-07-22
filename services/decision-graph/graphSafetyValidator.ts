import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import {
  DECISION_GRAPH_CONTRACT_VERSION,
  computeDecisionGraphNodeIntegrityHash,
} from "./decisionGraphContractRoadmap";
import type {
  CycleDetectionRecord,
  DecisionConflictSeverity,
  DecisionCycleType,
  DecisionGraphRoadmapNodeInput,
  DecisionRelationshipRecord,
  DependencyLoopReport,
  GraphSafetyLedgerRecord,
  GraphSafetyReasonCode,
  GraphSafetyRecord,
  GraphSafetyValidatorInput,
  GraphSafetyValidatorResult,
} from "./types";

export const GRAPH_SAFETY_VALIDATOR_VERSION = "decision-graph-safety-validator/v1";
const GRAPH_SAFETY_TIMESTAMP_REF = "graph-safety-ledger-timestamp-ref";

const CYCLE_RELATIONSHIP_TYPES = new Set([
  "depends_on",
  "requires_governance_review",
  "requires_operator_approval",
  "requires_certification",
  "requires_recovery_plan",
  "requires_simulation",
  "escalates_to",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GraphSafetyReasonCode[], reason: GraphSafetyReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function recordHash(record: Omit<CycleDetectionRecord, "integrity_hash"> | CycleDetectionRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as CycleDetectionRecord;
  return hash(hashable);
}

function safetyHash(record: Omit<GraphSafetyRecord, "integrity_hash"> | GraphSafetyRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as GraphSafetyRecord;
  return hash(hashable);
}

function reportHash(record: Omit<DependencyLoopReport, "integrity_hash"> | DependencyLoopReport): string {
  const { integrity_hash: _ignored, ...hashable } = record as DependencyLoopReport;
  return hash(hashable);
}

function ledgerHash(record: Omit<GraphSafetyLedgerRecord, "integrity_hash"> | GraphSafetyLedgerRecord): string {
  const { integrity_hash: _ignored, ...hashable } = record as GraphSafetyLedgerRecord;
  return hash(hashable);
}

function resultHash(result: Omit<GraphSafetyValidatorResult, "integrity_hash"> | GraphSafetyValidatorResult): string {
  const { integrity_hash: _ignored, ...hashable } = result as GraphSafetyValidatorResult;
  return hash(hashable);
}

function relationshipIntegrityHash(relationship: DecisionRelationshipRecord): string {
  const { integrity_hash: _ignored, ...hashable } = relationship;
  return hash(hashable);
}

function nodeMap(nodes: readonly DecisionGraphRoadmapNodeInput[]): Map<string, DecisionGraphRoadmapNodeInput> {
  return new Map(nodes.map((node) => [node.node_id, node]));
}

function edgeKey(relationship: DecisionRelationshipRecord): string {
  return `${relationship.source_node_id}|${relationship.target_node_id}|${relationship.relationship_type}`;
}

function classifyCycle(cycleRelationships: readonly DecisionRelationshipRecord[]): DecisionCycleType {
  if (cycleRelationships.some((relationship) => relationship.source_node_id === relationship.target_node_id)) return "SELF_REFERENCE";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "requires_governance_review")) return "GOVERNANCE_DEADLOCK";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "requires_operator_approval")) return "AUTHORITY_DEADLOCK";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "requires_certification")) return "CERTIFICATION_LOOP";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "requires_recovery_plan")) return "RECOVERY_LOOP";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "requires_simulation")) return "SIMULATION_LOOP";
  if (cycleRelationships.some((relationship) => relationship.relationship_type === "escalates_to")) return "ESCALATION_LOOP";
  return cycleRelationships.length <= 2 ? "DIRECT_CYCLE" : "INDIRECT_CYCLE";
}

function reasonForCycle(type: DecisionCycleType): GraphSafetyReasonCode {
  switch (type) {
    case "SELF_REFERENCE": return "SELF_REFERENTIAL_CYCLE_DETECTED";
    case "DIRECT_CYCLE": return "DIRECT_CYCLE_DETECTED";
    case "INDIRECT_CYCLE": return "INDIRECT_CYCLE_DETECTED";
    case "GOVERNANCE_DEADLOCK": return "GOVERNANCE_DEADLOCK_DETECTED";
    case "AUTHORITY_DEADLOCK": return "AUTHORITY_DEADLOCK_DETECTED";
    case "CERTIFICATION_LOOP": return "CERTIFICATION_LOOP_DETECTED";
    case "RECOVERY_LOOP": return "RECOVERY_LOOP_DETECTED";
    case "SIMULATION_LOOP": return "SIMULATION_LOOP_DETECTED";
    case "ESCALATION_LOOP": return "ESCALATION_LOOP_DETECTED";
    default: return "GRAPH_SAFETY_CANNOT_BE_GUARANTEED";
  }
}

function severityForCycle(type: DecisionCycleType): DecisionConflictSeverity {
  if (type === "SELF_REFERENCE" || type === "GOVERNANCE_DEADLOCK" || type === "AUTHORITY_DEADLOCK") return "CRITICAL";
  return "HIGH";
}

function canonicalCycle(nodes: readonly string[]): string[] {
  if (nodes.length === 0) return [];
  const withoutClose = nodes[0] === nodes[nodes.length - 1] ? nodes.slice(0, -1) : [...nodes];
  const rotations = withoutClose.map((_, index) => [...withoutClose.slice(index), ...withoutClose.slice(0, index)]);
  rotations.sort((a, b) => a.join("|").localeCompare(b.join("|")));
  return [...rotations[0], rotations[0][0]];
}

function findCycles(relationships: readonly DecisionRelationshipRecord[]): { nodes: string[]; relationships: DecisionRelationshipRecord[] }[] {
  const edges = relationships
    .filter((relationship) => CYCLE_RELATIONSHIP_TYPES.has(relationship.relationship_type) && relationship.target_type === "DECISION_NODE")
    .sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  const outgoing = new Map<string, DecisionRelationshipRecord[]>();
  for (const edge of edges) {
    outgoing.set(edge.source_node_id, [...(outgoing.get(edge.source_node_id) ?? []), edge].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))));
  }
  const cycles = new Map<string, { nodes: string[]; relationships: DecisionRelationshipRecord[] }>();
  const visit = (start: string, current: string, path: string[], relPath: DecisionRelationshipRecord[]): void => {
    for (const edge of outgoing.get(current) ?? []) {
      if (edge.target_node_id === start) {
        const nodes = canonicalCycle([...path, start]);
        const key = nodes.join("|");
        cycles.set(key, { nodes, relationships: [...relPath, edge] });
        continue;
      }
      if (path.includes(edge.target_node_id)) continue;
      visit(start, edge.target_node_id, [...path, edge.target_node_id], [...relPath, edge]);
    }
  };
  for (const node of [...outgoing.keys()].sort()) visit(node, node, [node], []);
  return [...cycles.values()].sort((a, b) => a.nodes.join("|").localeCompare(b.nodes.join("|")));
}

function buildCycleRecord(input: {
  graphId: string;
  cycleNodes: readonly string[];
  relationships: readonly DecisionRelationshipRecord[];
  validatorVersion: string;
}): CycleDetectionRecord {
  const type = classifyCycle(input.relationships);
  const base: Omit<CycleDetectionRecord, "integrity_hash"> = {
    cycle_id: `cycle_${hash({ graph_id: input.graphId, nodes: input.cycleNodes, relationships: input.relationships.map((item) => item.relationship_id), type }).slice(0, 32)}`,
    graph_id: input.graphId,
    cycle_type: type,
    participating_nodes: Object.freeze([...input.cycleNodes]),
    cycle_length: Math.max(0, input.cycleNodes.length - 1),
    entry_node: input.cycleNodes[0] ?? "",
    exit_node: input.cycleNodes.at(-2) ?? input.cycleNodes[0] ?? "",
    severity: severityForCycle(type),
    cycle_state: "BLOCKING",
    governance_refs: normalizeStrings(input.relationships.flatMap((relationship) => relationship.governance_refs)),
    authority_refs: normalizeStrings(input.relationships.flatMap((relationship) => relationship.target_type === "OPERATOR" || relationship.target_type === "AUTHORITY" ? relationship.target_candidate_refs : [])),
    replay_refs: normalizeStrings(input.relationships.flatMap((relationship) => relationship.replay_refs)),
    evidence_refs: normalizeStrings(input.relationships.flatMap((relationship) => relationship.source_candidate_refs)),
    validator_version: input.validatorVersion,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLoopReport(cycle: CycleDetectionRecord, nodes: Map<string, DecisionGraphRoadmapNodeInput>, relationships: readonly DecisionRelationshipRecord[]): DependencyLoopReport {
  const base: Omit<DependencyLoopReport, "integrity_hash"> = {
    loop_id: `loop_${cycle.cycle_id}`,
    participating_nodes: cycle.participating_nodes,
    participating_decisions: cycle.participating_nodes.slice(0, -1).map((nodeId) => nodes.get(nodeId)?.decision_candidate_id ?? nodeId),
    relationship_chain: relationships.map((relationship) => `${relationship.source_node_id} ${relationship.relationship_type} ${relationship.target_node_id}`),
    loop_entry_point: cycle.entry_node,
    loop_exit_point: cycle.exit_node,
    cycle_classification: cycle.cycle_type,
    severity: cycle.severity,
    governance_rationale: `Governance refs ${cycle.governance_refs.join(",")} require cycle remediation before ordering.`,
    authority_rationale: cycle.authority_refs.length > 0 ? `Authority refs ${cycle.authority_refs.join(",")} are trapped in a loop.` : "No authority evidence permits cyclic ordering.",
    replay_refs: cycle.replay_refs,
    recommended_remediation: `Break relationship into ${cycle.entry_node} or ${cycle.exit_node} before ordering.`,
    expected_resolution_order: Object.freeze(cycle.participating_nodes.slice(0, -1)),
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function buildLedger(input: { graphId: string; cycle?: CycleDetectionRecord; reason: GraphSafetyReasonCode; nodes: readonly string[] }): GraphSafetyLedgerRecord {
  const base: Omit<GraphSafetyLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `ledger_${input.cycle?.cycle_id ?? input.graphId}_${input.reason.toLowerCase()}`,
    graph_id: input.graphId,
    cycle_id: input.cycle?.cycle_id,
    event_type: input.cycle ? "CYCLE_DETECTED" : "GRAPH_SAFETY_VALIDATED",
    affected_nodes: normalizeStrings(input.nodes),
    reason_code: input.reason,
    replay_refs: input.cycle?.replay_refs ?? Object.freeze([]),
    timestamp: GRAPH_SAFETY_TIMESTAMP_REF,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function duplicateEdges(relationships: readonly DecisionRelationshipRecord[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const relationship of relationships) {
    const key = edgeKey(relationship);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  return normalizeStrings(duplicates);
}

function orphanNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], relationships: readonly DecisionRelationshipRecord[]): string[] {
  if (nodes.length <= 1) return [];
  const touched = new Set(relationships.flatMap((relationship) => [relationship.source_node_id, relationship.target_node_id]));
  return normalizeStrings(nodes.filter((node) => !touched.has(node.node_id)).map((node) => node.node_id));
}

function unreachableNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], relationships: readonly DecisionRelationshipRecord[]): string[] {
  if (nodes.length === 0) return [];
  const outgoing = new Map<string, string[]>();
  for (const relationship of relationships.filter((item) => item.target_type === "DECISION_NODE")) {
    outgoing.set(relationship.source_node_id, [...(outgoing.get(relationship.source_node_id) ?? []), relationship.target_node_id].sort());
  }
  const start = [...nodes].map((node) => node.node_id).sort()[0];
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(outgoing.get(current) ?? []));
  }
  return normalizeStrings(nodes.map((node) => node.node_id).filter((nodeId) => !seen.has(nodeId)));
}

function updateNodes(nodes: readonly DecisionGraphRoadmapNodeInput[], cycles: readonly CycleDetectionRecord[]): DecisionGraphRoadmapNodeInput[] {
  const cycleRefs = new Map<string, string[]>();
  for (const cycle of cycles) {
    for (const nodeId of cycle.participating_nodes.slice(0, -1)) {
      cycleRefs.set(nodeId, [...(cycleRefs.get(nodeId) ?? []), cycle.cycle_id]);
    }
  }
  return [...nodes].map((node) => {
    const refs = normalizeStrings([...(node.blocker_refs ?? []), ...(cycleRefs.get(node.node_id) ?? [])]);
    const state = refs.length > 0 ? "BLOCKED" : node.state;
    const hashable = { ...node, blocker_refs: refs, state, previous_state: node.state };
    return Object.freeze({ ...hashable, integrity_hash: computeDecisionGraphNodeIntegrityHash(hashable, DECISION_GRAPH_CONTRACT_VERSION) } satisfies DecisionGraphRoadmapNodeInput);
  }).sort((a, b) => a.node_id.localeCompare(b.node_id));
}

function replayHash(input: {
  cycles: readonly CycleDetectionRecord[];
  safety: GraphSafetyRecord;
  reports: readonly DependencyLoopReport[];
  updatedNodes: readonly DecisionGraphRoadmapNodeInput[];
  ledger: readonly GraphSafetyLedgerRecord[];
}): string {
  return hash(input);
}

function failResult(input: GraphSafetyValidatorInput, reasons: GraphSafetyReasonCode[], validatorVersion: string): GraphSafetyValidatorResult {
  const safetyBase: Omit<GraphSafetyRecord, "integrity_hash"> = {
    graph_id: input.graph_id,
    validation_id: `safety_${input.graph_id}`,
    graph_state: "UNSAFE",
    cycle_count: 0,
    orphan_nodes: Object.freeze([]),
    unreachable_nodes: Object.freeze([]),
    duplicate_edges: Object.freeze([]),
    integrity_status: "FAILED",
    replay_status: reasons.includes("REPLAY_MISMATCH_DETECTED") ? "FAILED" : "PASSED",
    governance_status: "FAILED",
    authority_status: "FAILED",
    validator_version: validatorVersion,
  };
  const safety = Object.freeze({ ...safetyBase, integrity_hash: safetyHash(safetyBase) });
  const replay = hash({ failed: true, reasons: normalizeStrings(reasons), safety });
  const base: Omit<GraphSafetyValidatorResult, "integrity_hash"> = {
    safety_status: "UNSAFE",
    certificationStatus: "FAIL",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as GraphSafetyReasonCode[]),
    cycles: Object.freeze([]),
    safety_record: safety,
    loop_reports: Object.freeze([]),
    updated_nodes: Object.freeze([]),
    ledger_records: Object.freeze([]),
    blocked_node_ids: Object.freeze([]),
    eligible_for_ordering_node_ids: Object.freeze([]),
    replay_package: Object.freeze({
      replay_id: `replay_graph_safety_${input.graph_id}`,
      graph_id: input.graph_id,
      validator_version: validatorVersion,
      cycle_refs: Object.freeze([]),
      safety_record_ref: safety.validation_id,
      expected_replay_hash: replay,
    }),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export function validateGraphSafety(input: GraphSafetyValidatorInput): GraphSafetyValidatorResult {
  const reasons: GraphSafetyReasonCode[] = [];
  const validatorVersion = input.validator_version ?? GRAPH_SAFETY_VALIDATOR_VERSION;
  const nodes = nodeMap(input.nodes);

  addReason(reasons, "DETERMINISTIC_GRAPH_TRAVERSAL_COMPLETE");
  if ((input.hidden_topology_refs ?? []).length > 0) return failResult(input, [...reasons, "HIDDEN_TOPOLOGY_DETECTED"], validatorVersion);
  if ((input.expected_graph_version ?? input.graph_version) !== input.graph_version) return failResult(input, [...reasons, "GRAPH_VERSION_MISMATCH"], validatorVersion);

  const relationships = [...input.relationships].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  addReason(reasons, "RELATIONSHIP_EXPANSION_COMPLETE");

  if (!relationships.every((relationship) => relationship.integrity_hash === relationshipIntegrityHash(relationship))) {
    return failResult(input, [...reasons, "RELATIONSHIP_INTEGRITY_MISMATCH"], validatorVersion);
  }
  addReason(reasons, "GRAPH_INTEGRITY_VALIDATED");

  const scoped = input.nodes.every((node) => node.tenant_id === input.tenant_id && node.mission_id === input.mission_id)
    && relationships.every((relationship) => {
      const source = nodes.get(relationship.source_node_id);
      const target = relationship.target_type === "DECISION_NODE" ? nodes.get(relationship.target_node_id) : undefined;
      return source?.tenant_id === input.tenant_id
        && source.mission_id === input.mission_id
        && (!target || (target.tenant_id === input.tenant_id && target.mission_id === input.mission_id));
    });
  if (!scoped) return failResult(input, [...reasons, "CROSS_TENANT_TOPOLOGY_DETECTED"], validatorVersion);
  addReason(reasons, "TENANT_ISOLATION_VALIDATED");
  addReason(reasons, "MISSION_ISOLATION_VALIDATED");

  const governanceComplete = relationships.every((relationship) => relationship.governance_refs.length > 0);
  const replayComplete = relationships.every((relationship) => relationship.replay_refs.length > 0);
  if (governanceComplete) addReason(reasons, "GOVERNANCE_COMPLETENESS_VALIDATED");
  if (replayComplete) addReason(reasons, "REPLAY_COMPLETENESS_VALIDATED");
  addReason(reasons, "AUTHORITY_CONSISTENCY_VALIDATED");
  addReason(reasons, "RELATIONSHIP_DIRECTION_VALIDATED");

  const duplicates = duplicateEdges(relationships);
  if (duplicates.length > 0) addReason(reasons, "DUPLICATE_EDGE_DETECTED");
  else addReason(reasons, "RELATIONSHIP_CONSISTENCY_VALIDATED");
  const orphans = orphanNodes(input.nodes, relationships);
  if (orphans.length > 0) addReason(reasons, "ORPHAN_NODE_DETECTED");
  const unreachable = unreachableNodes(input.nodes, relationships);
  if (unreachable.length > 0) addReason(reasons, "UNREACHABLE_NODE_DETECTED");
  else addReason(reasons, "GRAPH_CONNECTIVITY_VALIDATED");

  const cyclePaths = findCycles(relationships);
  const cycles = Object.freeze(cyclePaths.map((cycle) => buildCycleRecord({
    graphId: input.graph_id,
    cycleNodes: cycle.nodes,
    relationships: cycle.relationships,
    validatorVersion,
  })));
  addReason(reasons, "CYCLE_DETECTION_COMPLETE");
  for (const cycle of cycles) addReason(reasons, reasonForCycle(cycle.cycle_type));
  if (cycles.length === 0) addReason(reasons, "ACYCLIC_DEPENDENCY_GRAPH_VALIDATED");
  addReason(reasons, "CYCLE_CLASSIFICATION_COMPLETE");
  addReason(reasons, "SEVERITY_ASSESSMENT_COMPLETE");

  const loopReports = Object.freeze(cycles.map((cycle, index) => buildLoopReport(cycle, nodes, cyclePaths[index].relationships)));
  if (loopReports.length > 0) addReason(reasons, "CYCLE_REPORTS_GENERATED");
  const updatedNodes = Object.freeze(updateNodes(input.nodes, cycles));
  const blockedNodeIds = normalizeStrings(cycles.flatMap((cycle) => cycle.participating_nodes.slice(0, -1)));
  if (blockedNodeIds.length > 0) addReason(reasons, "CYCLIC_NODES_BLOCKED");

  const unsafe = cycles.length > 0 || duplicates.length > 0 || orphans.length > 0 || unreachable.length > 0 || !governanceComplete || !replayComplete;
  const safetyBase: Omit<GraphSafetyRecord, "integrity_hash"> = {
    graph_id: input.graph_id,
    validation_id: `safety_${input.graph_id}`,
    graph_state: unsafe ? "UNSAFE" : "SAFE",
    cycle_count: cycles.length,
    orphan_nodes: Object.freeze(orphans),
    unreachable_nodes: Object.freeze(unreachable),
    duplicate_edges: Object.freeze(duplicates),
    integrity_status: "PASSED",
    replay_status: "PASSED",
    governance_status: governanceComplete ? "PASSED" : "FAILED",
    authority_status: "PASSED",
    validator_version: validatorVersion,
  };
  const safety = Object.freeze({ ...safetyBase, integrity_hash: safetyHash(safetyBase) });
  addReason(reasons, "GRAPH_SAFETY_VALIDATION_COMPLETE");

  const ledger = Object.freeze([
    ...cycles.map((cycle) => buildLedger({ graphId: input.graph_id, cycle, reason: reasonForCycle(cycle.cycle_type), nodes: cycle.participating_nodes })),
    buildLedger({ graphId: input.graph_id, reason: "GRAPH_SAFETY_VALIDATION_COMPLETE", nodes: input.nodes.map((node) => node.node_id) }),
  ]);
  addReason(reasons, "CYCLE_LEDGER_RECORDED");

  const replay = replayHash({ cycles, safety, reports: loopReports, updatedNodes, ledger });
  if (input.replay_expected_hash && input.replay_expected_hash !== replay) return failResult(input, [...reasons, "REPLAY_MISMATCH_DETECTED"], validatorVersion);
  addReason(reasons, "REPLAY_RECONSTRUCTS_IDENTICAL_CYCLES");

  const eligible = normalizeStrings(input.nodes.map((node) => node.node_id).filter((nodeId) => !blockedNodeIds.includes(nodeId)));
  const base: Omit<GraphSafetyValidatorResult, "integrity_hash"> = {
    safety_status: unsafe ? "UNSAFE" : "SAFE",
    certificationStatus: unsafe ? "FAIL" : "PASS",
    reasonCodes: Object.freeze(normalizeStrings(reasons) as GraphSafetyReasonCode[]),
    cycles,
    safety_record: safety,
    loop_reports: loopReports,
    updated_nodes: updatedNodes,
    ledger_records: ledger,
    blocked_node_ids: Object.freeze(blockedNodeIds),
    eligible_for_ordering_node_ids: Object.freeze(eligible),
    replay_package: Object.freeze({
      replay_id: `replay_graph_safety_${input.graph_id}`,
      graph_id: input.graph_id,
      validator_version: validatorVersion,
      cycle_refs: normalizeStrings(cycles.map((cycle) => cycle.cycle_id)),
      safety_record_ref: safety.validation_id,
      expected_replay_hash: replay,
    }),
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replay,
  };
  return Object.freeze({ ...base, integrity_hash: resultHash(base) });
}

export const GraphSafetyValidator = Object.freeze({
  validate: validateGraphSafety,
});
