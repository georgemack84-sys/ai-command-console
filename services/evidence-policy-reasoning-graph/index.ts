import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateNarrative, getNarrative } from "@/services/decision-narrative-engine";
import { getExplanation, registerExplanation } from "@/services/explainability-contract";
import type { DecisionNarrative } from "@/types/decision-narrative-engine";
import type { ExplainabilityScenario, ExplanationRecord, ExplanationType } from "@/types/explainability-contract";
import type {
  GraphNodeCategory,
  GraphRelationshipType,
  ReasoningGraph,
  ReasoningGraphContract,
  ReasoningGraphEdge,
  ReasoningGraphFailure,
  ReasoningGraphInput,
  ReasoningGraphNode,
  ReasoningGraphObservabilitySurface,
  ReasoningGraphQueryCriteria,
  ReasoningGraphReplayResult,
  ReasoningGraphRepository,
  ReasoningGraphScenario,
  ReasoningGraphType,
  ReasoningGraphValidationResult,
} from "@/types/evidence-policy-reasoning-graph";

const VERSION = "evidence-policy-reasoning-graph/v8ALT.5.3" as const;
const GRAPH_VERSION = "reasoning-graph/v8ALT.5.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const graphTypes = Object.freeze(["EVIDENCE_CHAIN", "POLICY_INFLUENCE", "CONSTITUTIONAL_REASONING", "AUTHORITY_LINEAGE", "EXPLANATION_GRAPH", "REPLAY_LINEAGE", "TRUTH_LEDGER_REFERENCE"] as const);
const nodeCategories = Object.freeze(["MISSION", "OBJECTIVE", "OBSERVATION", "EVIDENCE", "PLAN", "DECISION", "RECOMMENDATION", "POLICY", "CONSTITUTION", "AUTHORITY", "APPROVAL", "EXECUTION", "SUPERVISION", "INTERVENTION", "REPLAY", "TRUTH_LEDGER", "CONFIDENCE", "RISK", "NARRATIVE"] as const);
const relationshipTypes = Object.freeze(["causes", "supports", "validates", "approves", "constrains", "depends_on", "generated_by", "references", "reconstructs", "governs", "influences", "verifies", "derived_from", "contradicts", "supersedes", "enforced_by", "overrides", "rejects", "requires", "inherited_from", "approved_by", "delegated_to", "rejected_by", "escalated_to"] as const);
const sourceTypes = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: ReasoningGraphScenario): readonly ReasoningGraphFailure[] {
  const map: Partial<Record<ReasoningGraphScenario, ReasoningGraphFailure>> = {
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    UNSUPPORTED_RELATIONSHIP: "UNSUPPORTED_RELATIONSHIP_DETECTED",
    INCOMPLETE_POLICY_LINEAGE: "POLICY_LINEAGE_INCOMPLETE",
    MISSING_CONSTITUTIONAL_REFERENCES: "CONSTITUTIONAL_REFERENCES_ABSENT",
    INCOMPLETE_AUTHORITY_VALIDATION: "AUTHORITY_VALIDATION_INCOMPLETE",
    DECISION_LINEAGE_GAP: "DECISION_LINEAGE_GAP_DETECTED",
    INVALID_REPLAY_REFERENCE: "REPLAY_REFERENCE_INVALID",
    NONDETERMINISTIC_TOPOLOGY: "GRAPH_TOPOLOGY_NONDETERMINISTIC",
    DUPLICATE_NODES: "DUPLICATE_NODE_DETECTED",
    ORPHANED_RELATIONSHIP: "ORPHANED_RELATIONSHIP_DETECTED",
    CROSS_TENANT_RELATIONSHIP: "CROSS_TENANT_RELATIONSHIP_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    FABRICATED_DEPENDENCY: "FABRICATED_DEPENDENCY_DETECTED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function explainabilityScenario(failures: readonly ReasoningGraphFailure[]): ExplainabilityScenario {
  if (failures.includes("EVIDENCE_MISSING")) return "MISSING_EVIDENCE";
  if (failures.includes("POLICY_LINEAGE_INCOMPLETE")) return "INCOMPLETE_POLICY_REFERENCES";
  if (failures.includes("CONSTITUTIONAL_REFERENCES_ABSENT")) return "MISSING_CONSTITUTIONAL_REFERENCES";
  if (failures.includes("AUTHORITY_VALIDATION_INCOMPLETE")) return "AUTHORITY_VALIDATION_FAILURE";
  if (failures.includes("DECISION_LINEAGE_GAP_DETECTED")) return "MISSING_IDENTIFIERS";
  if (failures.includes("REPLAY_REFERENCE_INVALID")) return "INVALID_REPLAY_REFERENCE";
  if (failures.includes("INTEGRITY_HASH_INVALID")) return "INTEGRITY_HASH_FAILURE";
  if (failures.includes("CROSS_TENANT_RELATIONSHIP_DETECTED")) return "CROSS_TENANT_REFERENCE";
  if (failures.includes("FABRICATED_DEPENDENCY_DETECTED")) return "FABRICATED_REASONING";
  if (failures.includes("ADVISORY_ONLY_VIOLATION")) return "ADVISORY_ONLY_VIOLATION";
  return "BASELINE";
}

function sourceExplanation(input: ReasoningGraphInput, failures: readonly ReasoningGraphFailure[]): ExplanationRecord {
  if (input.explanation) return input.explanation;
  return getExplanation(registerExplanation({ scenario: explainabilityScenario(failures), tenant_id: input.tenant_id, mission_id: input.mission_id }))!;
}

function sourceNarrative(record: ExplanationRecord, input: ReasoningGraphInput): DecisionNarrative | null {
  if (input.narrative) return input.narrative;
  return getNarrative(generateNarrative({ tenant_id: record.tenant_id, mission_id: record.mission_id, explanation: record }));
}

function node(category: GraphNodeCategory, label: string, record: ExplanationRecord, order: number, sourceReference: string, failures: readonly ReasoningGraphFailure[]): ReasoningGraphNode {
  const node_id = id("RGN", "reasoning-graph-node", { category, label, decision: record.decision_id });
  const base = {
    node_id,
    category,
    label,
    tenant_id: failures.includes("CROSS_TENANT_RELATIONSHIP_DETECTED") && category === "EVIDENCE" ? "external-tenant" : record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    source_reference: sourceReference,
    truth_reference: record.replay.truth_reference || `truth:reasoning-graph:${node_id}`,
    replay_reference: record.replay.replay_reference,
    lineage_reference: record.replay.lineage_reference || `lineage:reasoning-graph:${node_id}`,
    lifecycle_state: "CERTIFIED" as const,
    deterministic_order: order,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") && order === 1 ? "" : hashValue("reasoning-graph-node", base) });
}

function edge(from: ReasoningGraphNode | string, to: ReasoningGraphNode | string, relationship: GraphRelationshipType | string, record: ExplanationRecord, order: number, evidenceReference: string, failures: readonly ReasoningGraphFailure[]): ReasoningGraphEdge {
  const from_node_id = typeof from === "string" ? from : from.node_id;
  const to_node_id = typeof to === "string" ? to : to.node_id;
  const base = {
    edge_id: id("RGE", "reasoning-graph-edge", { from_node_id, to_node_id, relationship, order }),
    from_node_id,
    to_node_id,
    relationship,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    evidence_reference: evidenceReference,
    truth_reference: record.replay.truth_reference || `truth:reasoning-graph-edge:${order}`,
    replay_reference: record.replay.replay_reference,
    lineage_reference: record.replay.lineage_reference || `lineage:reasoning-graph-edge:${order}`,
    deterministic_order: order,
    fabricated_dependency: failures.includes("FABRICATED_DEPENDENCY_DETECTED") && order === 1,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") && order === 1 ? "" : hashValue("reasoning-graph-edge", base) });
}

function buildNodes(record: ExplanationRecord, narrative: DecisionNarrative | null, failures: readonly ReasoningGraphFailure[]): readonly ReasoningGraphNode[] {
  const evidenceRefs = failures.includes("EVIDENCE_MISSING") ? [] : record.evidence_references;
  const policyRefs = failures.includes("POLICY_LINEAGE_INCOMPLETE") ? [] : record.policy_references;
  const constitutionRefs = failures.includes("CONSTITUTIONAL_REFERENCES_ABSENT") ? [] : record.constitutional_references;
  const authorityRefs = failures.includes("AUTHORITY_VALIDATION_INCOMPLETE") ? [] : record.authority_references.authority_chain;
  const baseNodes = [
    node("MISSION", record.mission_id, record, 1, record.mission_id, failures),
    node("OBJECTIVE", record.decision_summary.objective, record, 2, record.decision_summary.objective, failures),
    node("OBSERVATION", "certified observation set", record, 3, record.explanation_id, failures),
    node("PLAN", record.plan_id, record, 4, record.plan_id, failures),
    ...(!failures.includes("DECISION_LINEAGE_GAP_DETECTED") ? [node("DECISION", record.decision_id, record, 5, record.decision_id, failures)] : []),
    node("RECOMMENDATION", record.selected_option?.option ?? "missing recommendation", record, 6, record.explanation_id, failures),
    node("EXECUTION", record.execution_id, record, 7, record.execution_id, failures),
    node("CONFIDENCE", `${record.confidence_reasoning?.confidence_score ?? 0}`, record, 8, record.explanation_id, failures),
    node("RISK", `${record.risk_reasoning?.operational_risk ?? 1}`, record, 9, record.explanation_id, failures),
    node("REPLAY", record.replay.replay_reference, record, 10, record.replay.replay_reference, failures),
    node("TRUTH_LEDGER", record.replay.truth_reference, record, 11, record.replay.truth_reference, failures),
    ...(narrative ? [node("NARRATIVE", narrative.narrative_id, record, 12, narrative.narrative_id, failures)] : []),
  ];
  const evidenceNodes = evidenceRefs.map((reference, index) => node("EVIDENCE", reference, record, 100 + index, reference, failures));
  const policyNodes = policyRefs.map((reference, index) => node("POLICY", reference, record, 200 + index, reference, failures));
  const constitutionNodes = constitutionRefs.map((reference, index) => node("CONSTITUTION", reference, record, 300 + index, reference, failures));
  const authorityNodes = authorityRefs.map((reference, index) => node(index === authorityRefs.length - 1 ? "APPROVAL" : "AUTHORITY", reference, record, 400 + index, reference, failures));
  const nodes = [...baseNodes, ...evidenceNodes, ...policyNodes, ...constitutionNodes, ...authorityNodes].sort((a, b) => a.deterministic_order - b.deterministic_order || a.node_id.localeCompare(b.node_id));
  const withDuplicate = failures.includes("DUPLICATE_NODE_DETECTED") ? [...nodes, nodes[0]] : nodes;
  const ordered = failures.includes("GRAPH_TOPOLOGY_NONDETERMINISTIC") ? [...withDuplicate].reverse() : withDuplicate;
  return freezeArray(ordered);
}

function first(nodes: readonly ReasoningGraphNode[], category: GraphNodeCategory): ReasoningGraphNode | undefined {
  return nodes.find((item) => item.category === category);
}

function buildEdges(nodes: readonly ReasoningGraphNode[], record: ExplanationRecord, failures: readonly ReasoningGraphFailure[]): readonly ReasoningGraphEdge[] {
  const mission = first(nodes, "MISSION");
  const objective = first(nodes, "OBJECTIVE");
  const observation = first(nodes, "OBSERVATION");
  const plan = first(nodes, "PLAN");
  const decision = first(nodes, "DECISION");
  const recommendation = first(nodes, "RECOMMENDATION");
  const execution = first(nodes, "EXECUTION");
  const replay = first(nodes, "REPLAY");
  const truth = first(nodes, "TRUTH_LEDGER");
  const confidence = first(nodes, "CONFIDENCE");
  const risk = first(nodes, "RISK");
  const narrative = first(nodes, "NARRATIVE");
  const evidenceNodes = nodes.filter((item) => item.category === "EVIDENCE");
  const policyNodes = nodes.filter((item) => item.category === "POLICY");
  const constitutionNodes = nodes.filter((item) => item.category === "CONSTITUTION");
  const authorityNodes = nodes.filter((item) => item.category === "AUTHORITY" || item.category === "APPROVAL");
  const safeEdges: ReasoningGraphEdge[] = [];
  let order = 1;
  const add = (fromNode: ReasoningGraphNode | undefined, toNode: ReasoningGraphNode | undefined, relationship: GraphRelationshipType | string, evidenceReference = record.evidence_references[0] ?? "") => {
    if (fromNode && toNode) safeEdges.push(edge(fromNode, toNode, relationship, record, order++, evidenceReference, failures));
  };
  add(mission, objective, "causes");
  add(objective, observation, "generated_by");
  for (const evidenceNode of evidenceNodes) add(observation, evidenceNode, "derived_from", evidenceNode.source_reference);
  for (const evidenceNode of evidenceNodes) add(evidenceNode, decision, "supports", evidenceNode.source_reference);
  add(plan, decision, "depends_on");
  add(decision, recommendation, failures.includes("UNSUPPORTED_RELATIONSHIP_DETECTED") ? "unsupported_hidden_correlation" : "references");
  for (const policyNode of policyNodes) add(policyNode, decision, "governs", policyNode.source_reference);
  for (const constitutionNode of constitutionNodes) add(constitutionNode, decision, "constrains", constitutionNode.source_reference);
  for (const authorityNode of authorityNodes) add(authorityNode, recommendation, "approved_by", authorityNode.source_reference);
  add(confidence, recommendation, "supports");
  add(risk, recommendation, "constrains");
  add(recommendation, execution, "references");
  add(execution, replay, "reconstructs");
  add(replay, truth, "verifies");
  add(decision, narrative, "references");
  if (failures.includes("ORPHANED_RELATIONSHIP_DETECTED") && truth) safeEdges.push(edge("missing-node", truth, "references", record, order++, "", failures));
  const ordered = failures.includes("GRAPH_TOPOLOGY_NONDETERMINISTIC") ? [...safeEdges].reverse() : safeEdges.sort((a, b) => a.deterministic_order - b.deterministic_order || a.edge_id.localeCompare(b.edge_id));
  return freezeArray(ordered);
}

function computeGraphHash(graph: Omit<ReasoningGraph, "graph_hash"> | ReasoningGraph): string {
  const { graph_hash: _hash, ...source } = graph as ReasoningGraph;
  return hashValue("reasoning-graph", source);
}

function computeRepositoryHash(repository: Omit<ReasoningGraphRepository, "repository_hash"> | ReasoningGraphRepository): string {
  const { repository_hash: _hash, ...source } = repository as ReasoningGraphRepository;
  return hashValue("reasoning-graph-repository", source);
}

function graph(input: ReasoningGraphInput, graph_type: ReasoningGraphType): ReasoningGraph {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const record = sourceExplanation(input, failures);
  const narrative = sourceNarrative(record, input);
  const nodes = buildNodes(record, narrative, failures);
  const edges = buildEdges(nodes, record, failures);
  const graph_id = id("RG", "reasoning-graph", { graph_type, decision: record.decision_id, scenario: input.scenario ?? "BASELINE" });
  const base = {
    graph_id,
    graph_type,
    graph_version: GRAPH_VERSION,
    engine_version: VERSION,
    tenant_id: failures.includes("CROSS_TENANT_RELATIONSHIP_DETECTED") ? "external-tenant" : record.tenant_id,
    mission_id: record.mission_id,
    decision_id: record.decision_id,
    execution_id: record.execution_id,
    explanation_id: record.explanation_id,
    narrative_id: narrative?.narrative_id ?? null,
    source_explanation: record,
    source_narrative: narrative,
    nodes,
    edges,
    replay_reference: failures.includes("REPLAY_REFERENCE_INVALID") ? "" : `replay:reasoning-graph:${graph_id}`,
    lineage_reference: `lineage:reasoning-graph:${graph_id}`,
    truth_reference: `truth:reasoning-graph:${graph_id}`,
    advisory_only: true as const,
    plan_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, graph_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : computeGraphHash(base as Omit<ReasoningGraph, "graph_hash">) });
}

export function buildExplanationGraph(input: ReasoningGraphInput = {}): ReasoningGraphRepository {
  const built = graph(input, "EXPLANATION_GRAPH");
  const base = { repository_id: id("RGR", "reasoning-graph-repository", { graph: built.graph_id }), tenant_id: built.tenant_id, mission_id: built.mission_id, graphs: freezeArray([built]), append_only: true as const, read_only: true as const };
  return Object.freeze({ ...base, repository_hash: computeRepositoryHash(base as Omit<ReasoningGraphRepository, "repository_hash">) });
}

export function registerEvidence(input: ReasoningGraphInput = {}): ReasoningGraphRepository { return buildExplanationGraph(input); }
export function buildEvidenceChain(input: ReasoningGraphInput = {}): ReasoningGraph { return graph(input, "EVIDENCE_CHAIN"); }
export function buildPolicyInfluenceGraph(input: ReasoningGraphInput = {}): ReasoningGraph { return graph(input, "POLICY_INFLUENCE"); }
export function buildAuthorityGraph(input: ReasoningGraphInput = {}): ReasoningGraph { return graph(input, "AUTHORITY_LINEAGE"); }
export function getReasoningGraph(repository = buildExplanationGraph(), graph_id?: string): ReasoningGraph | null {
  return repository.graphs.find((item) => item.graph_id === (graph_id ?? repository.graphs[0]?.graph_id)) ?? null;
}

function nodeIntegrityValid(item: ReasoningGraphNode): boolean {
  const { integrity_hash: _hash, ...source } = item;
  return Boolean(item.integrity_hash) && hashValue("reasoning-graph-node", source) === item.integrity_hash;
}

function edgeIntegrityValid(item: ReasoningGraphEdge): boolean {
  const { integrity_hash: _hash, ...source } = item;
  return Boolean(item.integrity_hash) && hashValue("reasoning-graph-edge", source) === item.integrity_hash;
}

export function validateReasoningGraph(graphRecord?: ReasoningGraph | null): ReasoningGraphValidationResult {
  if (!graphRecord) {
    const failures = freezeArray<ReasoningGraphFailure>(["DECISION_LINEAGE_GAP_DETECTED"]);
    const source = { graph_id: null, valid: false, evidence_complete: false, policy_complete: false, constitutional_complete: false, authority_complete: false, lineage_complete: false, replay_valid: false, topology_deterministic: false, duplicate_free: false, orphan_free: false, tenant_isolated: false, integrity_valid: false, fabricated_dependencies_rejected: false, advisory_only_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("reasoning-graph-validation", source) });
  }
  const nodeIds = graphRecord.nodes.map((item) => item.node_id);
  const nodeSet = new Set(nodeIds);
  const edgeIds = graphRecord.edges.map((item) => item.edge_id);
  const evidence_complete = graphRecord.nodes.some((item) => item.category === "EVIDENCE") && graphRecord.edges.some((item) => item.relationship === "supports");
  const policy_complete = graphRecord.nodes.some((item) => item.category === "POLICY") && graphRecord.edges.some((item) => item.relationship === "governs");
  const constitutional_complete = graphRecord.nodes.some((item) => item.category === "CONSTITUTION") && graphRecord.edges.some((item) => item.relationship === "constrains");
  const authority_complete = graphRecord.nodes.some((item) => item.category === "AUTHORITY" || item.category === "APPROVAL") && graphRecord.edges.some((item) => item.relationship === "approved_by");
  const lineage_complete = Boolean(graphRecord.decision_id && graphRecord.nodes.some((item) => item.category === "MISSION") && graphRecord.nodes.some((item) => item.category === "DECISION") && graphRecord.nodes.some((item) => item.category === "REPLAY") && graphRecord.nodes.some((item) => item.category === "TRUTH_LEDGER"));
  const replay_valid = Boolean(graphRecord.replay_reference && graphRecord.nodes.every((item) => item.replay_reference) && graphRecord.edges.every((item) => item.replay_reference));
  const topology_deterministic = graphRecord.nodes.map((item) => item.deterministic_order).join("|") === [...graphRecord.nodes.map((item) => item.deterministic_order)].sort((a, b) => a - b).join("|") && graphRecord.edges.map((item) => item.deterministic_order).join("|") === [...graphRecord.edges.map((item) => item.deterministic_order)].sort((a, b) => a - b).join("|");
  const duplicate_free = nodeSet.size === nodeIds.length && new Set(edgeIds).size === edgeIds.length;
  const orphan_free = graphRecord.edges.every((item) => nodeSet.has(item.from_node_id) && nodeSet.has(item.to_node_id));
  const tenant_isolated = graphRecord.tenant_id.startsWith("tenant:") && graphRecord.nodes.every((item) => item.tenant_id === graphRecord.tenant_id) && graphRecord.edges.every((item) => item.tenant_id === graphRecord.tenant_id);
  const integrity_valid = Boolean(graphRecord.graph_hash) && computeGraphHash(graphRecord) === graphRecord.graph_hash && graphRecord.nodes.every(nodeIntegrityValid) && graphRecord.edges.every(edgeIntegrityValid);
  const supportedRelationships = new Set<string>(relationshipTypes);
  const fabricated_dependencies_rejected = graphRecord.edges.every((item) => !item.fabricated_dependency && supportedRelationships.has(item.relationship));
  const advisory_only_enforced = graphRecord.advisory_only && !graphRecord.plan_modified && !graphRecord.execution_modified && !graphRecord.evidence_modified && !graphRecord.governance_modified && !graphRecord.authority_escalated;
  const failures = unique([
    ...(!evidence_complete ? ["EVIDENCE_MISSING" as const] : []),
    ...(!policy_complete ? ["POLICY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!constitutional_complete ? ["CONSTITUTIONAL_REFERENCES_ABSENT" as const] : []),
    ...(!authority_complete ? ["AUTHORITY_VALIDATION_INCOMPLETE" as const] : []),
    ...(!lineage_complete ? ["DECISION_LINEAGE_GAP_DETECTED" as const] : []),
    ...(!replay_valid ? ["REPLAY_REFERENCE_INVALID" as const] : []),
    ...(!topology_deterministic ? ["GRAPH_TOPOLOGY_NONDETERMINISTIC" as const] : []),
    ...(!duplicate_free ? ["DUPLICATE_NODE_DETECTED" as const] : []),
    ...(!orphan_free ? ["ORPHANED_RELATIONSHIP_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_RELATIONSHIP_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!fabricated_dependencies_rejected ? [graphRecord.edges.some((item) => !supportedRelationships.has(item.relationship)) ? "UNSUPPORTED_RELATIONSHIP_DETECTED" as const : "FABRICATED_DEPENDENCY_DETECTED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { graph_id: graphRecord.graph_id, valid, evidence_complete, policy_complete, constitutional_complete, authority_complete, lineage_complete, replay_valid, topology_deterministic, duplicate_free, orphan_free, tenant_isolated, integrity_valid, fabricated_dependencies_rejected, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("reasoning-graph-validation", source) });
}

export function replayReasoningGraph(graphRecord = getReasoningGraph()): ReasoningGraphReplayResult {
  const reconstructed_hash = graphRecord ? computeGraphHash(graphRecord) : "";
  const source = { replay_reference: graphRecord?.replay_reference ?? "", graph_id: graphRecord?.graph_id ?? "", deterministic: Boolean(graphRecord?.replay_reference) && reconstructed_hash === graphRecord?.graph_hash, reconstructed_hash, original_hash: graphRecord?.graph_hash ?? "", node_count: graphRecord?.nodes.length ?? 0, edge_count: graphRecord?.edges.length ?? 0 };
  return Object.freeze({ ...source, replay_result_hash: hashValue("reasoning-graph-replay", source) });
}

export function queryReasoningGraph(criteria: ReasoningGraphQueryCriteria = {}, repository = buildExplanationGraph()): readonly ReasoningGraph[] {
  return freezeArray(repository.graphs.filter((item) =>
    (!criteria.mission_id || item.mission_id === criteria.mission_id) &&
    (!criteria.execution_id || item.execution_id === criteria.execution_id) &&
    (!criteria.decision_id || item.decision_id === criteria.decision_id) &&
    (!criteria.plan_id || item.source_explanation.plan_id === criteria.plan_id) &&
    (!criteria.authority || item.source_explanation.authority_references.authority_chain.includes(criteria.authority)) &&
    (!criteria.policy || item.source_explanation.policy_references.includes(criteria.policy)) &&
    (!criteria.constitution || item.source_explanation.constitutional_references.includes(criteria.constitution)) &&
    (!criteria.evidence || item.source_explanation.evidence_references.includes(criteria.evidence)) &&
    (!criteria.replay_reference || item.replay_reference === criteria.replay_reference || item.source_explanation.replay.replay_reference === criteria.replay_reference) &&
    (!criteria.truth_reference || item.truth_reference === criteria.truth_reference || item.source_explanation.replay.truth_reference === criteria.truth_reference) &&
    (!criteria.node_category || item.nodes.some((nodeItem) => nodeItem.category === criteria.node_category)) &&
    (!criteria.relationship || item.edges.some((edgeItem) => edgeItem.relationship === criteria.relationship))
  ).sort((a, b) => a.graph_id.localeCompare(b.graph_id)));
}

export function buildReasoningGraphObservabilitySurface(repository = buildExplanationGraph()): ReasoningGraphObservabilitySurface {
  return Object.freeze({ repository_id: repository.repository_id, tenant_id: repository.tenant_id, mission_id: repository.mission_id, graph_count: repository.graphs.length, graph_types: freezeArray(repository.graphs.map((item) => item.graph_type)), node_count: repository.graphs.reduce((sum, item) => sum + item.nodes.length, 0), edge_count: repository.graphs.reduce((sum, item) => sum + item.edges.length, 0), advisory_only: true, repository_hash: repository.repository_hash });
}

export function getReasoningGraphContract(): ReasoningGraphContract {
  const repository = buildExplanationGraph();
  const graphRecord = getReasoningGraph(repository);
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-graph-construction", "immutable-lineage", "evidence-backed-relationships", "governance-transparency", "constitutional-accountability", "authority-traceability", "replay-identical-reconstruction", "append-only-history", "tenant-isolation", "advisory-only"]),
      graph_types: graphTypes,
      node_categories: nodeCategories,
      relationship_types: relationshipTypes,
      source_explanation_types: sourceTypes as readonly ExplanationType[],
      advisory_only: true,
    }),
    repository,
    validation: validateReasoningGraph(graphRecord),
    replay: replayReasoningGraph(graphRecord),
    observability: buildReasoningGraphObservabilitySurface(repository),
  });
}
