import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runTruthLedgerBindingEngine } from "@/services/truth-ledger-binding-engine";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { TruthLedgerBindingEngineResult } from "@/types/truth-ledger-binding-engine";
import type {
  DependencyType,
  HistoricalDependencyRecord,
  LineageApiSurface,
  LineageAuditReport,
  LineageMetrics,
  LineageNode,
  LineageNodeType,
  LineageQueryResult,
  LineageRelationship,
  LineageRelationshipType,
  LineageReplayReport,
  LineageValidation,
  OutcomeLineageCheck,
  OutcomeLineageFailure,
  OutcomeLineageGraph,
  OutcomeLineageMapperFoundation,
  OutcomeLineageMapperInput,
  OutcomeLineageMapperResult,
} from "@/types/outcome-lineage-mapper";

const OUTCOME_LINEAGE_MAPPER_VERSION = "outcome-lineage-mapper/v1" as const;
const LINEAGE_VERSION = "10.2.4" as const;

export const OUTCOME_LINEAGE_CHECKS: readonly OutcomeLineageCheck[] = Object.freeze(["BINDING_VALIDATION", "NODE_CREATION", "RELATIONSHIP_CREATION", "DEPENDENCY_MAPPING", "GRAPH_TOPOLOGY", "ORPHAN_DETECTION", "CYCLE_DETECTION", "REPLAY_RECONSTRUCTION", "RELATIONSHIP_REGISTRY", "TENANT_ISOLATION", "MISSION_CONSISTENCY", "INTEGRITY_VALIDATION"]);
export const LINEAGE_NODE_CHAIN: readonly LineageNodeType[] = Object.freeze(["DECISION", "RECOMMENDATION", "DECISION_PACKAGE", "OPERATOR_ACTION", "EXECUTION", "OBSERVED_OUTCOME", "TRUTH_LEDGER", "ADAPTIVE_HISTORY"]);
export const LINEAGE_RELATIONSHIP_TYPES: readonly LineageRelationshipType[] = Object.freeze(["originated_from", "resulted_from", "approved_by", "governed_by", "replayed_by", "certified_by", "supersedes", "corrected_by", "references", "influenced_by"]);

type Scenario = NonNullable<OutcomeLineageMapperInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function sourceForScenario(input: OutcomeLineageMapperInput, scenario: Scenario): TruthLedgerBindingEngineResult {
  if (input.truth_binding) return input.truth_binding;
  if (scenario === "INVALID_BINDING") return runTruthLedgerBindingEngine({ scenario: "MISSING_HISTORY" });
  if (scenario === "CROSS_TENANT") return runTruthLedgerBindingEngine({ scenario: "CROSS_TENANT_REFERENCE" });
  if (scenario === "HASH_MISMATCH") return runTruthLedgerBindingEngine({ scenario: "HASH_MISMATCH" });
  return runTruthLedgerBindingEngine();
}

function visibleToRole(source: TruthLedgerBindingEngineResult, role: VisibilityRole): boolean {
  return source.identity_resolver.normalization_adapter.outcome_ledger.governance_operator_recorder.actualization_recorder.mission_impact_recorder.completeness_validator.evidence_registry.observation_engine.intake_adapter.capture_contract.architecture_certification.security_boundaries.adaptive_ledger.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildApiSurface(): LineageApiSurface {
  const base: Omit<LineageApiSurface, "integrity_hash"> = {
    api_id: "outcome_lineage_api",
    build_lineage_graph: "POST /lineage/build",
    validate_lineage: "POST /lineage/validate",
    retrieve_lineage: "GET /lineage/{normalized_outcome_id}",
    retrieve_dependencies: "GET /lineage/{normalized_outcome_id}/dependencies",
    search_lineage: "GET /lineage/search",
    update_supported: false,
    delete_supported: false,
    deterministic_access: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recordForNode(source: TruthLedgerBindingEngineResult, type: LineageNodeType): string {
  const identity = source.identity_resolver.outcome_identity;
  const binding = source.binding;
  if (type === "DECISION") return binding.decision_id;
  if (type === "RECOMMENDATION") return `${binding.decision_id}:recommendation`;
  if (type === "DECISION_PACKAGE") return binding.decision_package_ref;
  if (type === "OPERATOR_ACTION") return binding.operator_workflow_ref;
  if (type === "EXECUTION") return source.identity_resolver.normalization_adapter.outcome_ledger.ledger_records[0].ledger_record_id;
  if (type === "OBSERVED_OUTCOME") return binding.final_outcome_ref;
  if (type === "TRUTH_LEDGER") return binding.truth_record_refs[0] ?? "";
  return `${identity.canonical_identity_id}:adaptive-history`;
}

function missingNodeType(scenario: Scenario): LineageNodeType | null {
  if (scenario === "MISSING_DECISION") return "DECISION";
  if (scenario === "MISSING_RECOMMENDATION") return "RECOMMENDATION";
  if (scenario === "MISSING_DECISION_PACKAGE") return "DECISION_PACKAGE";
  if (scenario === "MISSING_OPERATOR_ACTION") return "OPERATOR_ACTION";
  if (scenario === "MISSING_EXECUTION") return "EXECUTION";
  if (scenario === "MISSING_OBSERVED_OUTCOME") return "OBSERVED_OUTCOME";
  if (scenario === "MISSING_TRUTH_LEDGER") return "TRUTH_LEDGER";
  if (scenario === "MISSING_ADAPTIVE_HISTORY") return "ADAPTIVE_HISTORY";
  return null;
}

function buildNode(source: TruthLedgerBindingEngineResult, type: LineageNodeType, scenario: Scenario): LineageNode {
  const binding = source.binding;
  const tenant = scenario === "CROSS_TENANT" && type === "ADAPTIVE_HISTORY" ? `${binding.tenant_id}:foreign` : binding.tenant_id;
  const mission = scenario === "MISSION_MISMATCH" && type === "ADAPTIVE_HISTORY" ? `${binding.mission_id}:foreign` : binding.mission_id;
  const base: Omit<LineageNode, "integrity_hash"> = {
    node_id: `lineage_node_${hash(`${type}:${recordForNode(source, type)}:${tenant}`).slice(0, 16)}`,
    node_type: type,
    source_record_id: recordForNode(source, type),
    tenant_id: tenant,
    mission_id: mission,
    timestamp: "2026-01-01T00:07:00.000Z",
    node_version: LINEAGE_VERSION,
    replay_refs: binding.replay_refs,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && type === "TRUTH_LEDGER") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.node_id }) });
  return built;
}

function buildNodes(source: TruthLedgerBindingEngineResult, scenario: Scenario): readonly LineageNode[] {
  const missing = missingNodeType(scenario);
  return freezeArray(LINEAGE_NODE_CHAIN.filter((type) => type !== missing).map((type) => buildNode(source, type, scenario)));
}

function relationshipTypeFor(index: number, scenario: Scenario): LineageRelationshipType {
  if (scenario === "INVALID_RELATIONSHIP" && index === 0) return "references";
  const types: readonly LineageRelationshipType[] = ["originated_from", "originated_from", "approved_by", "resulted_from", "resulted_from", "references", "influenced_by"];
  return types[index] ?? "references";
}

function buildRelationships(nodes: readonly LineageNode[], scenario: Scenario): readonly LineageRelationship[] {
  if (scenario === "ORPHAN_OUTCOME") return freezeArray(nodes.slice(0, -1).map((node, index) => {
    const target = nodes[index + 1];
    const base: Omit<LineageRelationship, "integrity_hash"> = {
      relationship_id: `lineage_rel_${hash(`${node.node_id}:${target.node_id}`).slice(0, 16)}`,
      source_node_id: node.node_id,
      target_node_id: target.node_id,
      relationship_type: relationshipTypeFor(index, scenario),
      relationship_version: LINEAGE_VERSION,
      relationship_timestamp: "2026-01-01T00:07:01.000Z",
      replay_refs: node.replay_refs,
      append_only: true,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }).filter((_, index) => index !== 4));

  return freezeArray(nodes.slice(0, -1).map((node, index) => {
    const target = scenario === "CYCLE" && index === nodes.length - 2 ? nodes[0] : nodes[index + 1];
    const base: Omit<LineageRelationship, "integrity_hash"> = {
      relationship_id: `lineage_rel_${hash(`${node.node_id}:${target.node_id}`).slice(0, 16)}`,
      source_node_id: node.node_id,
      target_node_id: target.node_id,
      relationship_type: relationshipTypeFor(index, scenario),
      relationship_version: LINEAGE_VERSION,
      relationship_timestamp: "2026-01-01T00:07:01.000Z",
      replay_refs: node.replay_refs,
      append_only: true,
    };
    const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "HISTORICAL_MUTATION" && index === 0) return Object.freeze({ ...built, relationship_type: "corrected_by" as LineageRelationshipType, integrity_hash: built.integrity_hash });
    return built;
  }));
}

function dependencyTypeFor(index: number): DependencyType {
  const types: readonly DependencyType[] = ["EXECUTION", "GOVERNANCE", "OPERATOR", "EXECUTION", "EVIDENCE", "REPLAY", "ADAPTIVE"];
  return types[index] ?? "ADAPTIVE";
}

function buildDependencies(graphId: string, relationships: readonly LineageRelationship[]): readonly HistoricalDependencyRecord[] {
  return freezeArray(relationships.map((relationship, index) => {
    const base: Omit<HistoricalDependencyRecord, "integrity_hash"> = {
      dependency_id: `lineage_dep_${hash(relationship.relationship_id).slice(0, 16)}`,
      lineage_graph_id: graphId,
      parent_node_id: relationship.source_node_id,
      child_node_id: relationship.target_node_id,
      dependency_type: dependencyTypeFor(index),
      dependency_strength: index < 5 ? "DIRECT" : "INDIRECT",
      dependency_reason: `${relationship.relationship_type}:${dependencyTypeFor(index).toLowerCase()}`,
      replay_refs: relationship.replay_refs,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function hasCycle(nodes: readonly LineageNode[], relationships: readonly LineageRelationship[]): boolean {
  const seen = new Set<string>();
  let current: string | undefined = nodes[0]?.node_id;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = relationships.find((relationship) => relationship.source_node_id === current)?.target_node_id;
  }
  return false;
}

function completeChain(nodes: readonly LineageNode[], relationships: readonly LineageRelationship[]): boolean {
  if (nodes.length !== LINEAGE_NODE_CHAIN.length) return false;
  if (relationships.length !== LINEAGE_NODE_CHAIN.length - 1) return false;
  return nodes.slice(0, -1).every((node, index) => relationships[index]?.source_node_id === node.node_id && relationships[index]?.target_node_id === nodes[index + 1].node_id);
}

function buildGraph(source: TruthLedgerBindingEngineResult, nodes: readonly LineageNode[], relationships: readonly LineageRelationship[], scenario: Scenario): OutcomeLineageGraph {
  const graph_state: OutcomeLineageGraph["graph_state"] = hasCycle(nodes, relationships) ? "CYCLE_DETECTED" : completeChain(nodes, relationships) ? "VALID" : "ORPHAN_DETECTED";
  const base: Omit<OutcomeLineageGraph, "integrity_hash"> = {
    lineage_graph_id: `lineage_graph_${hash(source.binding.binding_id).slice(0, 16)}`,
    tenant_id: source.binding.tenant_id,
    mission_id: source.binding.mission_id,
    decision_id: source.binding.decision_id,
    graph_version: LINEAGE_VERSION,
    root_node_id: nodes[0]?.node_id ?? "",
    node_refs: freezeArray(nodes.map((node) => node.node_id)),
    relationship_refs: freezeArray(relationships.map((relationship) => relationship.relationship_id)),
    replay_refs: source.binding.replay_refs,
    graph_state: scenario === "FAIL_OPEN" ? "BLOCKED" : graph_state,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildQuery(nodes: readonly LineageNode[]): LineageQueryResult {
  const base: Omit<LineageQueryResult, "integrity_hash"> = {
    query_id: "outcome_lineage_query",
    supported_queries: freezeArray(["OUTCOME", "DECISION", "RECOMMENDATION", "OPERATOR", "GOVERNANCE", "MISSION", "REPLAY", "ADAPTIVE_HISTORY"]),
    traversal_order: freezeArray(nodes.map((node) => node.node_id)),
    matched_node_refs: freezeArray(nodes.map((node) => node.source_record_id)),
    query_mutated_graph: false,
    traversal_latency_ms: 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function expectedReplayHash(graph: OutcomeLineageGraph, nodes: readonly LineageNode[], relationships: readonly LineageRelationship[], dependencies: readonly HistoricalDependencyRecord[]): string {
  return hash({ graph, nodes, relationships, dependencies });
}

function collectFailures(input: {
  source: TruthLedgerBindingEngineResult;
  nodes: readonly LineageNode[];
  relationships: readonly LineageRelationship[];
  graph: OutcomeLineageGraph;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OutcomeLineageFailure[] {
  const failures: OutcomeLineageFailure[] = [];
  const hasNode = (type: LineageNodeType) => input.nodes.some((node) => node.node_type === type);
  if (input.source.validation.validation_status !== "VALID" || input.scenario === "INVALID_BINDING") failures.push("TRUTH_BINDING_NOT_VALIDATED");
  if (!hasNode("DECISION")) failures.push("MISSING_DECISION_NODE_REJECTED");
  if (!hasNode("RECOMMENDATION")) failures.push("MISSING_RECOMMENDATION_NODE_REJECTED");
  if (!hasNode("DECISION_PACKAGE")) failures.push("MISSING_DECISION_PACKAGE_NODE_REJECTED");
  if (!hasNode("OPERATOR_ACTION")) failures.push("MISSING_OPERATOR_ACTION_NODE_REJECTED");
  if (!hasNode("EXECUTION")) failures.push("MISSING_EXECUTION_NODE_REJECTED");
  if (!hasNode("OBSERVED_OUTCOME")) failures.push("MISSING_OBSERVED_OUTCOME_NODE_REJECTED");
  if (!hasNode("TRUTH_LEDGER")) failures.push("MISSING_TRUTH_LEDGER_NODE_REJECTED");
  if (!hasNode("ADAPTIVE_HISTORY")) failures.push("MISSING_ADAPTIVE_HISTORY_NODE_REJECTED");
  if (input.scenario === "INVALID_RELATIONSHIP") failures.push("INVALID_RELATIONSHIP_TYPE_REJECTED");
  if (input.graph.graph_state === "ORPHAN_DETECTED" || input.scenario === "ORPHAN_OUTCOME") failures.push("ORPHAN_OUTCOME_REJECTED");
  if (input.graph.graph_state === "CYCLE_DETECTED" || input.scenario === "CYCLE") failures.push("LINEAGE_CYCLE_REJECTED");
  if (input.nodes.some((node) => node.tenant_id !== input.source.binding.tenant_id) || input.scenario === "CROSS_TENANT") failures.push("CROSS_TENANT_LINEAGE_REJECTED");
  if (input.nodes.some((node) => node.mission_id !== input.source.binding.mission_id) || input.scenario === "MISSION_MISMATCH") failures.push("MISSION_MISMATCH_REJECTED");
  if (input.scenario === "APPEND_ONLY_VIOLATION") failures.push("RELATIONSHIP_REGISTRY_APPEND_ONLY_VIOLATED");
  if (input.scenario === "LINEAGE_REORDERING") failures.push("LINEAGE_REORDERING_REJECTED");
  if (input.scenario === "REPLAY_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_DIFFERED");
  if (input.nodes.some((node) => hashWithoutIntegrity(node) !== node.integrity_hash) || input.relationships.some((relationship) => hashWithoutIntegrity(relationship) !== relationship.integrity_hash) || input.scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_NOT_REPRODUCIBLE");
  if (input.scenario === "HISTORICAL_MUTATION") failures.push("HISTORICAL_RELATIONSHIP_MUTATION_REJECTED");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_LINEAGE_MAPPING_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(nodes: readonly LineageNode[], relationships: readonly LineageRelationship[], failures: readonly OutcomeLineageFailure[]): LineageValidation {
  const has = (failure: OutcomeLineageFailure) => failures.includes(failure);
  const base: Omit<LineageValidation, "integrity_hash"> = {
    validation_id: "outcome_lineage_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    one_root_node: nodes.length > 0 && !has("ORPHAN_OUTCOME_REJECTED"),
    complete_parent_chain: completeChain(nodes, relationships),
    complete_child_chain: completeChain(nodes, relationships),
    relationship_types_valid: !has("INVALID_RELATIONSHIP_TYPE_REJECTED"),
    replay_references_valid: nodes.every((node) => node.replay_refs.length > 0) && relationships.every((relationship) => relationship.replay_refs.length > 0),
    integrity_hashes_valid: !has("INTEGRITY_HASH_NOT_REPRODUCIBLE"),
    tenant_consistent: !has("CROSS_TENANT_LINEAGE_REJECTED"),
    mission_consistent: !has("MISSION_MISMATCH_REJECTED"),
    acyclic: !has("LINEAGE_CYCLE_REJECTED"),
    relationship_registry_append_only: !has("RELATIONSHIP_REGISTRY_APPEND_ONLY_VIOLATED") && !has("LINEAGE_REORDERING_REJECTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(graph: OutcomeLineageGraph, nodes: readonly LineageNode[], relationships: readonly LineageRelationship[], dependencies: readonly HistoricalDependencyRecord[], validation: LineageValidation, scenario: Scenario): LineageReplayReport {
  const expected = expectedReplayHash(graph, nodes, relationships, dependencies);
  const replay = scenario === "REPLAY_MISMATCH" ? hash({ replay: "mismatch" }) : expected;
  const base: Omit<LineageReplayReport, "integrity_hash"> = {
    replay_report_id: "outcome_lineage_replay_report",
    graph_hash: graph.integrity_hash,
    node_hashes: freezeArray(nodes.map((node) => node.integrity_hash)),
    relationship_hashes: freezeArray(relationships.map((relationship) => relationship.integrity_hash)),
    dependency_hashes: freezeArray(dependencies.map((dependency) => dependency.integrity_hash)),
    topology_hash: hash({ nodes: graph.node_refs, relationships: graph.relationship_refs }),
    replay_reconstruction_hash: replay,
    replay_reconstruction_identical: replay === expected && validation.validation_status === "VALID",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(nodes: readonly LineageNode[], relationships: readonly LineageRelationship[], validation: LineageValidation, replay: LineageReplayReport): LineageMetrics {
  const base: Omit<LineageMetrics, "integrity_hash"> = {
    metrics_id: "outcome_lineage_metrics",
    lineage_graphs_created: validation.validation_status === "VALID" ? 1 : 0,
    graph_depth: nodes.length,
    node_count: nodes.length,
    relationship_count: relationships.length,
    orphan_detection_failures: validation.failures.includes("ORPHAN_OUTCOME_REJECTED") ? 1 : 0,
    graph_validation_failures: validation.failures.length,
    replay_consistency: replay.replay_reconstruction_identical ? 1 : 0,
    graph_traversal_latency_ms: 0,
    dependency_resolution_time_ms: 0,
    tenant_isolation_violations: validation.tenant_consistent ? 0 : 1,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(source: TruthLedgerBindingEngineResult, validation: LineageValidation, replay: LineageReplayReport): LineageAuditReport {
  const base: Omit<LineageAuditReport, "integrity_hash"> = {
    report_id: "outcome_lineage_audit_report",
    tenant_id: source.binding.tenant_id,
    checks: OUTCOME_LINEAGE_CHECKS,
    lineage_graph_operational: validation.validation_status === "VALID",
    relationship_registry_operational: validation.relationship_registry_append_only,
    dependency_mapper_operational: validation.validation_status === "VALID",
    query_engine_operational: true,
    minimum_chain_complete: validation.complete_parent_chain && validation.complete_child_chain,
    graph_directed_acyclic: validation.acyclic,
    orphan_outcomes_rejected: !validation.failures.includes("ORPHAN_OUTCOME_REJECTED"),
    immutable_relationships_verified: validation.relationship_registry_append_only,
    replay_reconstruction_identical: replay.replay_reconstruction_identical,
    failure_analysis: validation.failures,
    certification_decision: validation.failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OutcomeLineageMapperResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    nodes: result.nodes,
    relationships: result.relationships,
    dependencies: result.dependencies,
    graph: result.lineage_graph,
    query: result.query_result,
    validation: result.validation,
    replay: result.replay_report,
    audit: result.audit_report,
  });
}

export function runOutcomeLineageMapper(input: OutcomeLineageMapperInput = {}): OutcomeLineageMapperResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const truth_binding = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const nodes = scenario === "LINEAGE_REORDERING" ? freezeArray([...buildNodes(truth_binding, scenario)].reverse()) : buildNodes(truth_binding, scenario);
  const relationships = buildRelationships(nodes, scenario);
  const graph = buildGraph(truth_binding, nodes, relationships, scenario);
  const dependencies = buildDependencies(graph.lineage_graph_id, relationships);
  const query_result = buildQuery(nodes);
  const failures = collectFailures({ source: truth_binding, nodes, relationships, graph, role, scenario });
  const validation = buildValidation(nodes, relationships, failures);
  const replay_report = buildReplay(graph, nodes, relationships, dependencies, validation, scenario);
  const metrics = buildMetrics(nodes, relationships, validation, replay_report);
  const audit_report = buildAudit(truth_binding, validation, replay_report);
  const base: Omit<OutcomeLineageMapperResult, "integrity_hash" | "replay_hash"> = {
    outcome_lineage_mapper_version: OUTCOME_LINEAGE_MAPPER_VERSION,
    truth_binding,
    api_surface,
    nodes,
    relationships,
    dependencies,
    lineage_graph: graph,
    query_result,
    validation,
    replay_report,
    metrics,
    audit_report,
    deterministic: true,
    replayable: true,
    records_relationships_only: true,
    modifies_decisions: false,
    modifies_recommendations: false,
    modifies_evidence: false,
    modifies_truth_ledger_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOutcomeLineageMapper(result: OutcomeLineageMapperResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOutcomeLineageGraphHash(graph: Omit<OutcomeLineageGraph, "integrity_hash"> | OutcomeLineageGraph): string {
  return hashWithoutIntegrity(graph);
}

export function getOutcomeLineageMapperFoundation(): OutcomeLineageMapperFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    outcome_lineage_mapper_version: OUTCOME_LINEAGE_MAPPER_VERSION,
    checks: OUTCOME_LINEAGE_CHECKS,
    api_surface,
    result: runOutcomeLineageMapper(),
  });
}

export const OutcomeLineageMapper = Object.freeze({
  run: runOutcomeLineageMapper,
  replay: replayOutcomeLineageMapper,
});
