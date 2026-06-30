import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runMissionControlOperationalDashboard } from "@/services/mission-control-operational-dashboard";
import type {
  GraphEdge,
  GraphEdgeType,
  GraphLayoutRecord,
  GraphLayoutType,
  GraphNode,
  GraphNodeType,
  GraphReplayMode,
  GraphReplayRecord,
  GraphValidationOutcome,
  GraphValidationTest,
  GraphVisualizationFailure,
  MissionControlGraph,
  MissionControlGraphScenario,
  MissionControlGraphType,
  MissionControlGraphVisualizationInput,
  MissionControlGraphVisualizationObservabilitySurface,
  MissionControlGraphVisualizationReport,
  MissionControlGraphVisualizationValidationResult,
} from "@/types/mission-control-graph-visualization-engine";

const NOW = "2026-07-01T04:00:00.000Z";
const SCHEMA_VERSION = "mission-control-graph-visualization-engine/v8J.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:graph-visualization:8j3:primary";
const LINEAGE_REFERENCE = "lineage:graph-visualization:8j3:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailure(scenario?: MissionControlGraphScenario): GraphVisualizationFailure | null {
  const map: Partial<Record<MissionControlGraphScenario, GraphVisualizationFailure>> = {
    NONDETERMINISTIC_STRUCTURE: "GRAPH_STRUCTURE_NONDETERMINISTIC",
    INCONSISTENT_RELATIONSHIP: "NODE_RELATIONSHIP_INCONSISTENT",
    MISSING_DEPENDENCY: "DEPENDENCY_MISSING",
    REPLAY_DIVERGENCE: "REPLAY_RECONSTRUCTION_DIVERGED",
    LINEAGE_GAP: "LINEAGE_GAP_DETECTED",
    MISSING_GOVERNANCE_INFLUENCE: "GOVERNANCE_INFLUENCE_NOT_TRACEABLE",
    HIDDEN_RELATIONSHIP: "HIDDEN_AUTONOMOUS_RELATIONSHIP_VISIBLE",
    CROSS_TENANT_NODE: "CROSS_TENANT_NODE_VISIBLE",
    MISSING_INTEGRITY_HASH: "INTEGRITY_HASH_MISSING",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    MISSING_EVIDENCE_REFERENCE: "EVIDENCE_REFERENCE_MISSING",
    EXECUTION_AUTHORITY_EXPOSED: "GRAPH_EXECUTION_AUTHORITY_EXPOSED",
    UNAUTHORIZED_GRAPH_ACCESS: "UNAUTHORIZED_GRAPH_ACCESS",
  };
  return scenario ? map[scenario] ?? null : null;
}

const graphDefinitions: Record<MissionControlGraphType, Readonly<{
  nodes: readonly GraphNodeType[];
  edges: readonly GraphEdgeType[];
  labels: readonly string[];
}>> = {
  PLANNING_GRAPH: {
    nodes: ["MISSION", "OBJECTIVE", "PLAN", "SUBPLAN", "TASK", "DEPENDENCY", "ALTERNATIVE", "BRANCH", "CONTINGENCY", "CHECKPOINT"],
    edges: ["DECOMPOSES_TO", "DECOMPOSES_TO", "DECOMPOSES_TO", "DECOMPOSES_TO", "DEPENDS_ON", "ALTERNATIVE_TO", "BRANCHES_TO", "FALLBACK_FOR", "CHECKPOINT_AFTER"],
    labels: ["Mission", "Objective", "Primary plan", "Subplan", "Executable task", "Dependency", "Alternative plan", "Branch plan", "Contingency", "Checkpoint"],
  },
  DELEGATION_GRAPH: {
    nodes: ["MISSION", "TASK", "AGENT", "OPERATOR", "EXTERNAL_SYSTEM", "QUEUE", "EXECUTION_UNIT"],
    edges: ["ASSIGNED_TO", "OWNED_BY", "ROUTED_TO", "ESCALATED_TO", "MONITORED_BY", "REPORTED_TO"],
    labels: ["Mission", "Delegated task", "Responsible agent", "Operator task", "External system", "Queue", "Execution owner"],
  },
  EXECUTION_GRAPH: {
    nodes: ["MISSION", "WORKFLOW", "TASK", "STEP", "CHECKPOINT", "FAILURE", "ROLLBACK", "RECOVERY"],
    edges: ["EXECUTES", "FOLLOWS", "DEPENDS_ON", "CHECKPOINT_AFTER", "ROLLBACK_TO", "RECOVERS_FROM", "FOLLOWS"],
    labels: ["Mission", "Workflow", "Task", "Step", "Checkpoint", "Failure", "Rollback path", "Recovery path"],
  },
  LINEAGE_GRAPH: {
    nodes: ["MISSION", "PLAN", "EXECUTION", "INTERVENTION", "REPLAY", "EVIDENCE", "DECISION"],
    edges: ["PARENT_OF", "CHILD_OF", "DERIVED_FROM", "INTERVENED_IN", "REPLAY_OF", "SUPPORTED_BY"],
    labels: ["Mission", "Derived plan", "Parent execution", "Intervention", "Replay lineage", "Evidence", "Decision"],
  },
  GOVERNANCE_GRAPH: {
    nodes: ["CONSTITUTION", "POLICY", "AUTHORITY", "SUPERVISION", "INTERVENTION", "DECISION", "PLAN", "EXECUTION"],
    edges: ["AUTHORIZED", "RESTRICTED", "APPROVED", "RECOMMENDED", "ESCALATED", "INFLUENCED", "BLOCKED"],
    labels: ["Constitution", "Policy", "Authority", "Supervision", "Intervention", "Decision", "Plan", "Execution"],
  },
};

function graphTypeSlug(graph_type: MissionControlGraphType): string {
  return graph_type.toLowerCase().replaceAll("_", "-");
}

function nodeFor(graph_type: MissionControlGraphType, node_type: GraphNodeType, label: string, index: number, graphIndex: number, scenario?: MissionControlGraphScenario): GraphNode {
  const node_id = id("GVN", "graph-node-id", { graph_type, node_type, index });
  const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && graph_type === "PLANNING_GRAPH" && index === 0;
  const missingEvidence = scenario === "MISSING_EVIDENCE_REFERENCE" && graph_type === "PLANNING_GRAPH" && index === 0;
  const missingIntegrity = scenario === "MISSING_INTEGRITY_HASH" && graph_type === "PLANNING_GRAPH" && index === 0;
  const crossTenant = scenario === "CROSS_TENANT_NODE" && graph_type === "DELEGATION_GRAPH" && index === 2;
  const lineageGap = scenario === "LINEAGE_GAP" && graph_type === "LINEAGE_GRAPH" && node_type === "REPLAY";
  const source = {
    node_id,
    graph_type,
    tenant_id: crossTenant ? "tenant:other" : TENANT_ID,
    mission_id: MISSION_ID,
    node_type,
    label,
    parent_node: index === 0 ? null : id("GVN", "graph-node-id", { graph_type, node_type: graphDefinitions[graph_type].nodes[index - 1], index: index - 1 }),
    status: "VISIBLE",
    confidence: Number((0.92 - index * 0.01).toFixed(2)),
    risk_score: Number((0.12 + index * 0.02).toFixed(2)),
    authority_level: "VISUALIZE_ONLY",
    timestamp: `2026-07-01T04:${index.toString().padStart(2, "0")}:00.000Z`,
    immutable_id: `immutable:${graphTypeSlug(graph_type)}:${index}`,
    replay_reference: missingReplay ? "" : `${REPLAY_REFERENCE}:${graphTypeSlug(graph_type)}:${index}`,
    lineage_reference: lineageGap ? "" : `${LINEAGE_REFERENCE}:${graphTypeSlug(graph_type)}:${index}`,
    integrity_hash: missingIntegrity ? "" : hashValue("graph-node-integrity", { graph_type, node_type, index }),
    evidence_references: missingEvidence ? freezeArray([]) : freezeArray([`evidence:${graphTypeSlug(graph_type)}:${index}`]),
    governance_references: freezeArray([`governance:${graphTypeSlug(graph_type)}:${node_type.toLowerCase()}`]),
    position: Object.freeze({ x: index * 160, y: graphIndex * 120 }),
  };
  return Object.freeze({ ...source, node_hash: hashValue("graph-node", source) });
}

function edgeFor(graph_type: MissionControlGraphType, edge_type: GraphEdgeType, nodes: readonly GraphNode[], index: number, scenario?: MissionControlGraphScenario): GraphEdge {
  const sourceNode = nodes[index] ?? nodes[0];
  const targetNode = scenario === "INCONSISTENT_RELATIONSHIP" && graph_type === "PLANNING_GRAPH" && index === 1
    ? "node:missing"
    : (nodes[index + 1] ?? nodes[0]).node_id;
  const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && graph_type === "PLANNING_GRAPH" && index === 0;
  const missingEvidence = scenario === "MISSING_EVIDENCE_REFERENCE" && graph_type === "PLANNING_GRAPH" && index === 0;
  const missingIntegrity = scenario === "MISSING_INTEGRITY_HASH" && graph_type === "PLANNING_GRAPH" && index === 0;
  const source = {
    edge_id: id("GVE", "graph-edge-id", { graph_type, edge_type, index }),
    graph_type,
    source_node_id: sourceNode.node_id,
    target_node_id: targetNode,
    edge_type,
    relationship_origin: `origin:${graphTypeSlug(graph_type)}:${edge_type.toLowerCase()}`,
    timestamp: `2026-07-01T04:${(30 + index).toString().padStart(2, "0")}:00.000Z`,
    replay_reference: missingReplay ? "" : `${REPLAY_REFERENCE}:${graphTypeSlug(graph_type)}:edge:${index}`,
    integrity_hash: missingIntegrity ? "" : hashValue("graph-edge-integrity", { graph_type, edge_type, index }),
    evidence_references: missingEvidence ? freezeArray([]) : freezeArray([`evidence:${graphTypeSlug(graph_type)}:edge:${index}`]),
  };
  return Object.freeze({ ...source, edge_hash: hashValue("graph-edge", source) });
}

function buildGraph(graph_type: MissionControlGraphType, graphIndex: number, scenario?: MissionControlGraphScenario): MissionControlGraph {
  const definition = graphDefinitions[graph_type];
  const dependencyOmitted = scenario === "MISSING_DEPENDENCY" && graph_type === "PLANNING_GRAPH";
  const governanceOmitted = scenario === "MISSING_GOVERNANCE_INFLUENCE" && graph_type === "GOVERNANCE_GRAPH";
  const hiddenRelationship = scenario === "HIDDEN_RELATIONSHIP" && graph_type === "EXECUTION_GRAPH";
  const nodes = freezeArray(definition.nodes
    .filter((node) => !dependencyOmitted || node !== "DEPENDENCY")
    .filter((node) => !governanceOmitted || (node !== "SUPERVISION" && node !== "INTERVENTION"))
    .map((node, index) => nodeFor(graph_type, node, definition.labels[index] ?? node, index, graphIndex, scenario)));
  const edgeTypes = definition.edges.filter((edge) => !dependencyOmitted || edge !== "DEPENDS_ON").filter((edge) => !governanceOmitted || (edge !== "RECOMMENDED" && edge !== "ESCALATED" && edge !== "INFLUENCED"));
  const edges = freezeArray(edgeTypes.map((edge, index) => edgeFor(graph_type, edge, nodes, index, scenario)));
  const visibleEdges = hiddenRelationship ? freezeArray([...edges, edgeFor(graph_type, "EXECUTES", nodes, edges.length, scenario)]) : edges;
  const render_order = scenario === "NONDETERMINISTIC_STRUCTURE" && graph_type === "PLANNING_GRAPH"
    ? freezeArray([...nodes.map((node) => node.node_id)].reverse())
    : freezeArray(nodes.map((node) => node.node_id));
  const base = {
    graph_id: id("GVG", "graph-id", graph_type),
    graph_type,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    graph_version: "8J.3",
    graph_state: "READY" as const,
    root_node: nodes[0]?.node_id ?? "",
    nodes,
    edges: visibleEdges,
    layout_version: "deterministic-layout/v1",
    render_order,
    created_at: NOW,
    updated_at: NOW,
    replay_reference: `${REPLAY_REFERENCE}:${graphTypeSlug(graph_type)}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${graphTypeSlug(graph_type)}`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" && graph_type === "PLANNING_GRAPH" ? "" : hashValue("graph-integrity", { graph_type, nodes: nodes.map((node) => node.node_hash), edges: visibleEdges.map((edge) => edge.edge_hash) }),
  };
  return Object.freeze({ ...base, graph_hash: hashValue("mission-control-graph", base) });
}

function buildGraphs(scenario?: MissionControlGraphScenario): readonly MissionControlGraph[] {
  return freezeArray((["PLANNING_GRAPH", "DELEGATION_GRAPH", "EXECUTION_GRAPH", "LINEAGE_GRAPH", "GOVERNANCE_GRAPH"] as const).map((graphType, index) => buildGraph(graphType, index, scenario)));
}

function buildLayoutRecord(layout_type: GraphLayoutType, scenario?: MissionControlGraphScenario): GraphLayoutRecord {
  const nondeterministic = scenario === "NONDETERMINISTIC_STRUCTURE";
  const source = {
    layout_id: id("GVL", "graph-layout-id", layout_type),
    layout_type,
    layout_version: "deterministic-layout/v1",
    node_positions_preserved: !nondeterministic,
    edge_order_preserved: !nondeterministic,
    filtering_preserves_structure: !nondeterministic,
    evidence_overlay_enabled: scenario !== "MISSING_EVIDENCE_REFERENCE",
    integrity_overlay_enabled: scenario !== "MISSING_INTEGRITY_HASH",
  };
  return Object.freeze({ ...source, layout_hash: hashValue("graph-layout-record", source) });
}

function buildReplayRecord(replay_mode: GraphReplayMode, scenario?: MissionControlGraphScenario): GraphReplayRecord {
  const source = {
    replay_id: id("GVR", "graph-replay-id", replay_mode),
    replay_mode,
    historical_reconstruction_enabled: scenario !== "REPLAY_DIVERGENCE",
    node_evolution_enabled: scenario !== "REPLAY_DIVERGENCE",
    edge_evolution_enabled: scenario !== "REPLAY_DIVERGENCE",
    checkpoint_navigation_enabled: true,
    replay_reference: REPLAY_REFERENCE,
  };
  return Object.freeze({ ...source, replay_hash: scenario === "REPLAY_DIVERGENCE" ? "replay-diverged" : hashValue("graph-replay-record", source) });
}

function graphOf(graphs: readonly MissionControlGraph[], graph_type: MissionControlGraphType): MissionControlGraph {
  const graph = graphs.find((item) => item.graph_type === graph_type);
  if (!graph) throw new Error(`Missing graph ${graph_type}`);
  return graph;
}

function hasNode(graph: MissionControlGraph, node_type: GraphNodeType): boolean {
  return graph.nodes.some((node) => node.node_type === node_type);
}

function hasEdge(graph: MissionControlGraph, edge_type: GraphEdgeType): boolean {
  return graph.edges.some((edge) => edge.edge_type === edge_type);
}

function relationshipTargetsExist(graph: MissionControlGraph): boolean {
  const ids = new Set(graph.nodes.map((node) => node.node_id));
  return graph.edges.every((edge) => ids.has(edge.source_node_id) && ids.has(edge.target_node_id));
}

function validationTest(name: string, passed: boolean, failure: GraphVisualizationFailure, evidence: readonly string[]): GraphValidationTest {
  const source = { name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence) };
  return Object.freeze({ test_id: id("GVT", "graph-validation-test-id", name), ...source, test_hash: hashValue("graph-validation-test", source) });
}

function buildTests(report: Omit<MissionControlGraphVisualizationReport, "validation_tests" | "failures" | "validation_outcome" | "engine_hash" | "integrity_hash">, scenario?: MissionControlGraphScenario): readonly GraphValidationTest[] {
  const planning = graphOf(report.graphs, "PLANNING_GRAPH");
  const delegation = graphOf(report.graphs, "DELEGATION_GRAPH");
  const execution = graphOf(report.graphs, "EXECUTION_GRAPH");
  const lineage = graphOf(report.graphs, "LINEAGE_GRAPH");
  const governance = graphOf(report.graphs, "GOVERNANCE_GRAPH");
  const allNodes = report.graphs.flatMap((graph) => graph.nodes);
  const allEdges = report.graphs.flatMap((graph) => graph.edges);
  const evidence = freezeArray([report.engine_id, report.layout_record.layout_hash, report.replay_record.replay_hash]);
  const uniqueNodeIds = new Set(allNodes.map((node) => node.node_id)).size === allNodes.length;
  const uniqueEdgeIds = new Set(allEdges.map((edge) => edge.edge_id)).size === allEdges.length;
  const refsPreserved = allNodes.every((node) => node.replay_reference) && allEdges.every((edge) => edge.replay_reference);
  const lineagesPreserved = allNodes.every((node) => node.lineage_reference) && report.graphs.every((graph) => graph.lineage_reference);
  const integrityPreserved = allNodes.every((node) => node.integrity_hash) && allEdges.every((edge) => edge.integrity_hash) && report.graphs.every((graph) => graph.integrity_hash);
  const evidencePreserved = allNodes.every((node) => node.evidence_references.length > 0) && allEdges.every((edge) => edge.evidence_references.length > 0);
  const relationshipsValid = report.graphs.every(relationshipTargetsExist);
  const tenantIsolated = allNodes.every((node) => node.tenant_id === TENANT_ID) && report.graphs.every((graph) => graph.tenant_id === TENANT_ID);
  return freezeArray([
    validationTest("graph engine schema present", report.graphs.length === 5 && uniqueNodeIds && uniqueEdgeIds, "GRAPH_STRUCTURE_NONDETERMINISTIC", evidence),
    validationTest("planning graph operational", planning.graph_state === "READY" && relationshipTargetsExist(planning), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("objectives displayed", hasNode(planning, "OBJECTIVE"), "DEPENDENCY_MISSING", evidence),
    validationTest("decomposition displayed", hasEdge(planning, "DECOMPOSES_TO"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("dependencies displayed", hasNode(planning, "DEPENDENCY") && hasEdge(planning, "DEPENDS_ON"), "DEPENDENCY_MISSING", evidence),
    validationTest("alternatives displayed", hasNode(planning, "ALTERNATIVE") && hasEdge(planning, "ALTERNATIVE_TO"), "DEPENDENCY_MISSING", evidence),
    validationTest("branch plans displayed", hasNode(planning, "BRANCH") && hasEdge(planning, "BRANCHES_TO"), "DEPENDENCY_MISSING", evidence),
    validationTest("delegation graph operational", delegation.graph_state === "READY" && relationshipTargetsExist(delegation), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("delegated tasks displayed", hasNode(delegation, "TASK") && hasEdge(delegation, "ASSIGNED_TO"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("responsible agents displayed", hasNode(delegation, "AGENT"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("operator tasks displayed", hasNode(delegation, "OPERATOR"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("external systems displayed", hasNode(delegation, "EXTERNAL_SYSTEM"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("execution ownership displayed", hasNode(delegation, "EXECUTION_UNIT") && hasEdge(delegation, "OWNED_BY"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("execution graph operational", execution.graph_state === "READY" && relationshipTargetsExist(execution), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("workflow displayed", hasNode(execution, "WORKFLOW"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("sequencing deterministic", hasEdge(execution, "FOLLOWS") && scenario !== "NONDETERMINISTIC_STRUCTURE", "GRAPH_STRUCTURE_NONDETERMINISTIC", evidence),
    validationTest("checkpoint visualization operational", hasNode(execution, "CHECKPOINT") && hasEdge(execution, "CHECKPOINT_AFTER"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("rollback paths displayed", hasNode(execution, "ROLLBACK") && hasEdge(execution, "ROLLBACK_TO"), "NODE_RELATIONSHIP_INCONSISTENT", evidence),
    validationTest("lineage graph operational", lineage.graph_state === "READY" && relationshipTargetsExist(lineage), "LINEAGE_GAP_DETECTED", evidence),
    validationTest("parent execution displayed", hasNode(lineage, "EXECUTION") && hasEdge(lineage, "PARENT_OF"), "LINEAGE_GAP_DETECTED", evidence),
    validationTest("child execution displayed", hasEdge(lineage, "CHILD_OF"), "LINEAGE_GAP_DETECTED", evidence),
    validationTest("derived plans displayed", hasNode(lineage, "PLAN") && hasEdge(lineage, "DERIVED_FROM"), "LINEAGE_GAP_DETECTED", evidence),
    validationTest("intervention lineage displayed", hasNode(lineage, "INTERVENTION") && hasEdge(lineage, "INTERVENED_IN"), "LINEAGE_GAP_DETECTED", evidence),
    validationTest("replay lineage displayed", hasNode(lineage, "REPLAY") && hasEdge(lineage, "REPLAY_OF") && scenario !== "LINEAGE_GAP", "LINEAGE_GAP_DETECTED", evidence),
    validationTest("governance influence graph operational", governance.graph_state === "READY" && relationshipTargetsExist(governance), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("constitutional influence displayed", hasNode(governance, "CONSTITUTION") && hasEdge(governance, "AUTHORIZED"), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("policy influence displayed", hasNode(governance, "POLICY") && hasEdge(governance, "RESTRICTED"), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("authority influence displayed", hasNode(governance, "AUTHORITY") && hasEdge(governance, "APPROVED"), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("supervision influence displayed", hasNode(governance, "SUPERVISION") && hasEdge(governance, "RECOMMENDED"), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("intervention influence displayed", hasNode(governance, "INTERVENTION") && hasEdge(governance, "ESCALATED"), "GOVERNANCE_INFLUENCE_NOT_TRACEABLE", evidence),
    validationTest("replay reconstruction deterministic", report.replay_record.historical_reconstruction_enabled && scenario !== "REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_DIVERGED", evidence),
    validationTest("graph layouts deterministic", report.layout_record.node_positions_preserved && report.layout_record.edge_order_preserved && report.layout_record.filtering_preserves_structure, "GRAPH_STRUCTURE_NONDETERMINISTIC", evidence),
    validationTest("evidence overlays operational", report.layout_record.evidence_overlay_enabled && evidencePreserved, "EVIDENCE_REFERENCE_MISSING", evidence),
    validationTest("integrity overlays operational", report.layout_record.integrity_overlay_enabled && integrityPreserved, "INTEGRITY_HASH_MISSING", evidence),
    validationTest("replay references preserved", refsPreserved, "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("lineage references preserved", lineagesPreserved, "LINEAGE_GAP_DETECTED", evidence),
    validationTest("integrity hashes preserved", integrityPreserved, "INTEGRITY_HASH_MISSING", evidence),
    validationTest("tenant isolation enforced", tenantIsolated, "CROSS_TENANT_NODE_VISIBLE", evidence),
    validationTest("advisory-only visualization enforced", report.advisory_only && !report.execution_authority_granted, "GRAPH_EXECUTION_AUTHORITY_EXPOSED", evidence),
    validationTest("hidden autonomous relationships rejected", scenario !== "HIDDEN_RELATIONSHIP" && relationshipsValid, "HIDDEN_AUTONOMOUS_RELATIONSHIP_VISIBLE", evidence),
    validationTest("unauthorized graph access rejected", scenario !== "UNAUTHORIZED_GRAPH_ACCESS", "UNAUTHORIZED_GRAPH_ACCESS", evidence),
  ]);
}

export function computeMissionControlGraphVisualizationHash(report: Omit<MissionControlGraphVisualizationReport, "engine_hash"> | MissionControlGraphVisualizationReport): string {
  const { engine_hash: _hash, ...source } = report as MissionControlGraphVisualizationReport;
  return hashValue("mission-control-graph-visualization-report", source);
}

export function runMissionControlGraphVisualizationEngine(input: MissionControlGraphVisualizationInput = {}): MissionControlGraphVisualizationReport {
  const scenario = input.scenario ?? "BASELINE";
  const operationalDashboard = runMissionControlOperationalDashboard();
  const graphs = buildGraphs(scenario);
  const layout_record = buildLayoutRecord(input.layout_type ?? "DAG", scenario);
  const replay_record = buildReplayRecord(input.replay_mode ?? "LIVE", scenario);
  const base = {
    phase_version: "8J.3" as const,
    schema_version: SCHEMA_VERSION,
    engine_id: id("GVE", "graph-visualization-engine-id", { scenario, layout: layout_record.layout_type, replay: replay_record.replay_mode }),
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    operational_dashboard: operationalDashboard,
    graphs,
    layout_record,
    replay_record,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    advisory_only: true as const,
    execution_authority_granted: scenario === "EXECUTION_AUTHORITY_EXPOSED" ? true as never : false as const,
  };
  const tests = buildTests(base, scenario);
  const scenarioSpecificFailure = scenarioFailure(scenario);
  const testFailures = tests.map((test) => test.failure_reason).filter((failure): failure is GraphVisualizationFailure => Boolean(failure));
  const failures = freezeArray(scenarioSpecificFailure && !testFailures.includes(scenarioSpecificFailure) ? [...testFailures, scenarioSpecificFailure] : testFailures);
  const validation_outcome: GraphValidationOutcome = failures.length === 0 ? "VALID" : scenario === "UNAUTHORIZED_GRAPH_ACCESS" ? "BLOCKED" : "INVALID";
  const integrity_hash = scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("graph-visualization-integrity", { graphs: graphs.map((graph) => graph.graph_hash), layout: layout_record.layout_hash, replay: replay_record.replay_hash });
  const report = { ...base, validation_outcome, validation_tests: tests, failures, integrity_hash };
  return Object.freeze({ ...report, engine_hash: computeMissionControlGraphVisualizationHash(report as MissionControlGraphVisualizationReport) });
}

export function validateMissionControlGraphVisualizationEngine(report?: MissionControlGraphVisualizationReport): MissionControlGraphVisualizationValidationResult {
  if (!report) {
    const failures = freezeArray<GraphVisualizationFailure>(["GRAPH_STRUCTURE_NONDETERMINISTIC"]);
    const source = { engine_id: null, valid: false, validation_outcome: "INVALID" as const, failures, engine_hash_valid: false, advisory_only: false };
    return Object.freeze({ ...source, validation_hash: hashValue("graph-visualization-validation", source) });
  }
  const engine_hash_valid = computeMissionControlGraphVisualizationHash(report) === report.engine_hash;
  const valid = report.validation_outcome === "VALID" && engine_hash_valid && report.advisory_only && !report.execution_authority_granted;
  const source = { engine_id: report.engine_id, valid, validation_outcome: report.validation_outcome, failures: report.failures, engine_hash_valid, advisory_only: report.advisory_only && !report.execution_authority_granted };
  return Object.freeze({ ...source, validation_hash: hashValue("graph-visualization-validation", source) });
}

export function buildMissionControlGraphVisualizationObservabilitySurface(report = runMissionControlGraphVisualizationEngine()): MissionControlGraphVisualizationObservabilitySurface {
  return Object.freeze({
    engine_id: report.engine_id,
    validation_outcome: report.validation_outcome,
    graph_count: report.graphs.length,
    node_count: report.graphs.reduce((sum, graph) => sum + graph.nodes.length, 0),
    edge_count: report.graphs.reduce((sum, graph) => sum + graph.edges.length, 0),
    layout_type: report.layout_record.layout_type,
    replay_mode: report.replay_record.replay_mode,
    failed_tests: report.validation_tests.filter((test) => !test.passed).length,
    failures: report.failures,
    advisory_only: report.advisory_only,
    execution_authority_granted: report.execution_authority_granted,
    engine_hash: report.engine_hash,
  });
}

export function getMissionControlGraphVisualizationContract() {
  const report = runMissionControlGraphVisualizationEngine();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-rendering", "replay-fidelity", "evidence-backed-explainability", "governance-transparency", "tenant-isolation", "read-only-operation", "advisory-only"]),
      schema_version: SCHEMA_VERSION,
      graph_types: freezeArray(["PLANNING_GRAPH", "DELEGATION_GRAPH", "EXECUTION_GRAPH", "LINEAGE_GRAPH", "GOVERNANCE_GRAPH"] as const),
      graph_states: freezeArray(["INITIALIZED", "BUILDING", "VALIDATED", "READY", "REPLAYING", "ARCHIVED", "ERROR"] as const),
      layout_types: freezeArray(["HIERARCHICAL", "DAG", "TIMELINE", "FORCE_DIRECTED", "TREE"] as const),
      replay_modes: freezeArray(["LIVE", "SNAPSHOT", "HISTORICAL", "STEP_BY_STEP", "FORENSIC"] as const),
      no_execution_authority: true,
    }),
    report,
    validation: validateMissionControlGraphVisualizationEngine(report),
    observability: buildMissionControlGraphVisualizationObservabilitySurface(report),
  });
}
