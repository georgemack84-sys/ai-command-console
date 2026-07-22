import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionTimelineVisualization } from "@/services/decision-timeline-visualization";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { DecisionTimelineResult } from "@/types/decision-timeline-visualization";
import type {
  ArbitrationState,
  ArbitrationView,
  BlockerType,
  BlockerView,
  ConflictDependencyVisualizationFailure,
  ConflictDependencyVisualizationFoundation,
  ConflictDependencyVisualizationInput,
  ConflictDependencyVisualizationMetrics,
  ConflictDependencyVisualizationResult,
  ConflictDependencyVisualizationValidation,
  ConflictLedgerEntry,
  ConflictMap,
  ConflictRecord,
  ConflictSeverity,
  DecisionConflictType,
  DependencyEdge,
  DependencyGraphView,
  DependencyNode,
  DependencyRelationshipType,
  RelationshipExplorer,
} from "@/types/decision-conflict-dependency-visualization";

const VISUALIZATION_VERSION = "decision-conflict-dependency-visualization/v1" as const;

export const DECISION_CONFLICT_TYPES: readonly DecisionConflictType[] = Object.freeze(["RECOMMENDATION_CONFLICT", "GOVERNANCE_CONFLICT", "AUTHORITY_CONFLICT", "EVIDENCE_CONFLICT", "PRIORITY_CONFLICT", "RISK_CONFIDENCE_CONFLICT", "DEPENDENCY_CONFLICT", "MISSION_OBJECTIVE_CONFLICT", "TIMING_CONFLICT", "RESOURCE_CONFLICT", "TENANT_BOUNDARY_CONFLICT", "CERTIFICATION_CONFLICT"]);
export const DEPENDENCY_RELATIONSHIP_TYPES: readonly DependencyRelationshipType[] = Object.freeze(["REQUIRES", "BLOCKS", "SUPPORTS", "CONFLICTS_WITH", "DEPENDS_ON", "SUPERSEDES", "DERIVED_FROM", "ESCALATES_TO", "GOVERNED_BY", "CERTIFIED_BY"]);
export const ARBITRATION_STATES: readonly ArbitrationState[] = Object.freeze(["NOT_REQUIRED", "PENDING", "IN_REVIEW", "RESOLVED", "ESCALATED", "REJECTED", "ARCHIVED"]);
export const BLOCKER_TYPES: readonly BlockerType[] = Object.freeze(["MISSING_DEPENDENCY", "UNRESOLVED_CONFLICT", "MISSING_EVIDENCE", "LOW_CONFIDENCE", "HIGH_RISK", "GOVERNANCE_RESTRICTION", "CONSTITUTIONAL_VIOLATION", "MISSING_AUTHORITY", "MISSING_OPERATOR_APPROVAL", "FAILED_REPLAY", "FAILED_CERTIFICATION"]);

type Scenario = NonNullable<ConflictDependencyVisualizationInput["scenario"]>;

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

function ctx(timeline: DecisionTimelineResult) {
  const dashboard = timeline.dashboard_result;
  const certification = dashboard.observability_result.certification_result;
  return {
    dashboard,
    certification,
    tenant_id: certification.certification_record.tenant_id,
    mission_id: certification.certification_record.mission_id,
    replay_ref: timeline.replay_hash,
    governance_refs: certification.evidence_package.governance_refs,
    evidence_refs: certification.evidence_package.lineage_refs,
  };
}

function conflict(timeline: DecisionTimelineResult, id: string, type: DecisionConflictType, severity: ConflictSeverity, scenario: Scenario): ConflictRecord {
  const c = ctx(timeline);
  const tenant = scenario === "CROSS_TENANT" && id === "conflict_governance_scope" ? "tenant_other" : c.tenant_id;
  const governanceRefs = scenario === "MISSING_GOVERNANCE_REFS" ? [] : c.governance_refs;
  const replayRefs = scenario === "MISSING_REPLAY_REFS" ? [] : [c.replay_ref];
  const base: Omit<ConflictRecord, "integrity_hash"> = {
    conflict_id: id,
    conflict_type: type,
    decision_refs: freezeArray(["decision_blocked_governance", "decision_escalated_authority"]),
    conflict_refs: freezeArray([id, "timeline_event_05_conflict_detected"]),
    severity,
    arbitration_state: "RESOLVED",
    governance_refs: freezeArray(governanceRefs),
    evidence_refs: freezeArray(c.evidence_refs),
    replay_refs: freezeArray(replayRefs),
    tenant_id: tenant,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" && id === "conflict_governance_scope") return Object.freeze({ ...built, integrity_hash: hash({ tampered: id }) });
  return built;
}

function buildConflicts(timeline: DecisionTimelineResult, scenario: Scenario): readonly ConflictRecord[] {
  if (scenario === "HIDE_CONFLICTS") return freezeArray([]);
  return freezeArray([
    conflict(timeline, "conflict_governance_scope", "GOVERNANCE_CONFLICT", "CRITICAL", scenario),
    conflict(timeline, "conflict_authority_boundary", "AUTHORITY_CONFLICT", "HIGH", scenario),
    conflict(timeline, "conflict_dependency_evidence", "DEPENDENCY_CONFLICT", "MODERATE", scenario),
  ]);
}

function node(timeline: DecisionTimelineResult, id: string, type: DependencyNode["node_type"], state: DependencyNode["state"], scenario: Scenario): DependencyNode {
  const c = ctx(timeline);
  const tenant = scenario === "CROSS_TENANT" && id === "node_decision_blocked_governance" ? "tenant_other" : c.tenant_id;
  const base: Omit<DependencyNode, "integrity_hash"> = {
    node_id: id,
    decision_ref: id.replace("node_", ""),
    node_type: type,
    tenant_id: tenant,
    state,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function edge(id: string, source: string, target: string, relationship: DependencyRelationshipType, order: number, blocker: boolean, conflictRef: string | null, scenario: Scenario): DependencyEdge {
  const renderOrder = scenario === "NONDETERMINISTIC_GRAPH" && id === "edge_governed_by" ? 1 : order;
  const base: Omit<DependencyEdge, "integrity_hash"> = {
    edge_id: id,
    source_ref: source,
    target_ref: scenario === "CYCLE_UNDETECTED" && id === "edge_requires" ? source : target,
    relationship_type: relationship,
    blocker,
    conflict_ref: conflictRef,
    rendering_order: renderOrder,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildNodes(timeline: DecisionTimelineResult, scenario: Scenario): readonly DependencyNode[] {
  if (scenario === "HIDE_DEPENDENCIES") return freezeArray([]);
  return freezeArray([
    node(timeline, "node_decision_blocked_governance", "DECISION", "BLOCKED", scenario),
    node(timeline, "node_decision_escalated_authority", "DECISION", "ESCALATED", scenario),
    node(timeline, "node_evidence_policy_review", "EVIDENCE", "READY", scenario),
    node(timeline, "node_governance_validator", "GOVERNANCE", "READY", scenario),
    node(timeline, "node_operator_review", "OPERATOR", "ESCALATED", scenario),
    node(timeline, "node_replay_verified", "REPLAY", "RESOLVED", scenario),
    node(timeline, "node_certification_pass", "CERTIFICATION", "RESOLVED", scenario),
  ]);
}

function buildEdges(scenario: Scenario): readonly DependencyEdge[] {
  if (scenario === "HIDE_DEPENDENCIES") return freezeArray([]);
  return freezeArray([
    edge("edge_requires", "node_decision_blocked_governance", "node_evidence_policy_review", "REQUIRES", 1, true, "conflict_dependency_evidence", scenario),
    edge("edge_blocks", "node_governance_validator", "node_decision_blocked_governance", "BLOCKS", 2, true, "conflict_governance_scope", scenario),
    edge("edge_conflicts_with", "node_decision_blocked_governance", "node_decision_escalated_authority", "CONFLICTS_WITH", 3, false, "conflict_authority_boundary", scenario),
    edge("edge_escalates_to", "node_decision_escalated_authority", "node_operator_review", "ESCALATES_TO", 4, false, "conflict_authority_boundary", scenario),
    edge("edge_governed_by", "node_decision_blocked_governance", "node_governance_validator", "GOVERNED_BY", 5, false, "conflict_governance_scope", scenario),
    edge("edge_certified_by", "node_replay_verified", "node_certification_pass", "CERTIFIED_BY", 6, false, null, scenario),
  ]);
}

function buildConflictMap(timeline: DecisionTimelineResult, conflicts: readonly ConflictRecord[], scenario: Scenario): ConflictMap {
  const c = ctx(timeline);
  const base: Omit<ConflictMap, "integrity_hash"> = {
    conflict_map_id: "decision_conflict_map",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_refs: freezeArray([...new Set(conflicts.flatMap((item) => item.decision_refs))]),
    conflict_refs: freezeArray(conflicts.map((item) => item.conflict_id)),
    conflict_clusters: freezeArray(conflicts.length ? ["governance_authority_cluster", "dependency_evidence_cluster"] : []),
    severity_summary: freezeArray(conflicts.map((item) => item.severity)),
    arbitration_refs: scenario === "MISSING_ARBITRATION" ? freezeArray([]) : freezeArray(["arbitration_governance_authority"]),
    governance_refs: scenario === "MISSING_GOVERNANCE_REFS" ? freezeArray([]) : freezeArray(c.governance_refs),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDependencyGraph(timeline: DecisionTimelineResult, nodes: readonly DependencyNode[], edges: readonly DependencyEdge[], conflicts: readonly ConflictRecord[], scenario: Scenario): DependencyGraphView {
  const c = ctx(timeline);
  const sortedEdges = [...edges].sort((a, b) => a.rendering_order - b.rendering_order || a.edge_id.localeCompare(b.edge_id));
  const renderingOrder = scenario === "NONDETERMINISTIC_GRAPH"
    ? edges.map((item) => item.edge_id)
    : sortedEdges.map((item) => item.edge_id);
  const base: Omit<DependencyGraphView, "integrity_hash"> = {
    graph_view_id: "decision_dependency_graph_view",
    dependency_graph_id: "decision_dependency_graph",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    node_refs: freezeArray(nodes.map((item) => item.node_id)),
    edge_refs: freezeArray(edges.map((item) => item.edge_id)),
    blocker_refs: freezeArray(edges.filter((item) => item.blocker).map((item) => item.edge_id)),
    conflict_refs: freezeArray(conflicts.map((item) => item.conflict_id)),
    governance_refs: scenario === "MISSING_GOVERNANCE_REFS" ? freezeArray([]) : freezeArray(c.governance_refs),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
    rendering_order: freezeArray(renderingOrder),
    cycle_detected: scenario === "CYCLE_UNDETECTED" ? false : edges.some((item) => item.source_ref === item.target_ref),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildArbitration(conflicts: readonly ConflictRecord[], map: ConflictMap, timeline: DecisionTimelineResult, scenario: Scenario): ArbitrationView {
  const base: Omit<ArbitrationView, "integrity_hash"> = {
    arbitration_view_id: "decision_arbitration_view",
    arbitration_id: scenario === "MISSING_ARBITRATION" ? "" : "arbitration_governance_authority",
    conflict_refs: map.conflict_refs,
    decision_refs: map.decision_refs,
    selected_outcome: scenario === "MISSING_ARBITRATION" ? "" : "route governance conflict to authority escalation with operator review",
    rejected_outcomes: freezeArray(["ignore governance restriction", "auto-approve authority escalation"]),
    tradeoff_summary: "Governance restriction wins over speed; operator review preserves authority boundaries.",
    governance_state: conflicts.some((item) => item.conflict_type === "GOVERNANCE_CONFLICT") ? "RESTRICTED" : "COMPLIANT",
    constitutional_state: "COMPLIANT",
    operator_required: true,
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : timeline.replay_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildBlockers(timeline: DecisionTimelineResult, graph: DependencyGraphView, scenario: Scenario): readonly BlockerView[] {
  if (scenario === "HIDE_BLOCKERS") return freezeArray([]);
  const replay = scenario === "MISSING_REPLAY_REFS" ? [] : [timeline.replay_hash];
  const governance = scenario === "MISSING_GOVERNANCE_REFS" ? [] : graph.governance_refs;
  const values: readonly Omit<BlockerView, "integrity_hash">[] = [
    {
      blocker_view_id: "blocker_governance_restriction",
      blocker_id: "blocker_governance_restriction",
      blocked_decision_ref: "decision_blocked_governance",
      blocking_decision_refs: freezeArray(["node_governance_validator"]),
      blocker_type: "GOVERNANCE_RESTRICTION",
      blocker_severity: "CRITICAL",
      resolution_requirement: "complete governance approval and authority validation",
      escalation_path: freezeArray(["governance_review", "authority_escalation", "operator_review"]),
      governance_refs: governance,
      replay_refs: replay,
    },
    {
      blocker_view_id: "blocker_missing_evidence",
      blocker_id: "blocker_missing_evidence",
      blocked_decision_ref: "decision_deferred_evidence",
      blocking_decision_refs: freezeArray(["node_evidence_policy_review"]),
      blocker_type: "MISSING_EVIDENCE",
      blocker_severity: "HIGH",
      resolution_requirement: "attach certified evidence bundle",
      escalation_path: freezeArray(["evidence_request", "operator_review"]),
      governance_refs: governance,
      replay_refs: replay,
    },
  ];
  return freezeArray(values.map((item) => Object.freeze({ ...item, integrity_hash: hashWithoutIntegrity(item) })));
}

function buildExplorer(timeline: DecisionTimelineResult, nodes: readonly DependencyNode[], edges: readonly DependencyEdge[], graph: DependencyGraphView, scenario: Scenario): RelationshipExplorer {
  const c = ctx(timeline);
  const base: Omit<RelationshipExplorer, "integrity_hash"> = {
    explorer_id: "decision_relationship_explorer",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    root_decision_ref: "decision_blocked_governance",
    relationship_depth: scenario === "INCOMPLETE_EXPLORER" ? 0 : 3,
    relationship_filters: freezeArray(["decision", "evidence", "governance", "operator", "replay", "certification"]),
    visible_nodes: scenario === "INCOMPLETE_EXPLORER" ? freezeArray([]) : freezeArray(nodes.map((item) => item.node_id)),
    visible_edges: scenario === "INCOMPLETE_EXPLORER" ? freezeArray([]) : freezeArray(edges.map((item) => item.edge_id)),
    governance_overlays: graph.governance_refs,
    replay_refs: graph.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(conflicts: readonly ConflictRecord[], graph: DependencyGraphView, arbitration: ArbitrationView, blockers: readonly BlockerView[], scenario: Scenario): readonly ConflictLedgerEntry[] {
  if (scenario === "INCOMPLETE_LEDGER") return freezeArray([]);
  const eventRefs = [
    ["CONFLICT_DETECTED", conflicts[0]?.conflict_id],
    ["CONFLICT_CLASSIFIED", conflicts[1]?.conflict_id],
    ["BLOCKER_DETECTED", blockers[0]?.blocker_id],
    ["DEPENDENCY_RESOLVED", graph.graph_view_id],
    ["ARBITRATION_INITIATED", arbitration.arbitration_id],
    ["ARBITRATION_RESOLVED", arbitration.arbitration_id],
    ["GOVERNANCE_ESCALATION_CREATED", blockers[0]?.blocker_id],
    ["OPERATOR_REVIEW_REQUIRED", arbitration.arbitration_id],
    ["REPLAY_VERIFIED", graph.replay_refs[0]],
    ["CONFLICT_ARCHIVED", conflicts[0]?.conflict_id],
  ] as const;
  return freezeArray(eventRefs.map(([eventType, ref], index) => {
    const base: Omit<ConflictLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `conflict_ledger_${String(index + 1).padStart(2, "0")}`,
      event_type: eventType,
      evidence_ref: ref ?? "",
      sequence_number: index + 1,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildMetrics(conflicts: readonly ConflictRecord[], edges: readonly DependencyEdge[], blockers: readonly BlockerView[], graph: DependencyGraphView, arbitration: ArbitrationView): ConflictDependencyVisualizationMetrics {
  const base: Omit<ConflictDependencyVisualizationMetrics, "integrity_hash"> = {
    conflict_count: conflicts.length,
    dependency_count: edges.length,
    blocker_count: blockers.length,
    critical_conflicts: conflicts.filter((item) => item.severity === "CRITICAL").length,
    arbitration_resolved: arbitration.selected_outcome ? 1 : 0,
    governance_overlays: graph.governance_refs.length,
    replay_linked_items: graph.replay_refs.length + conflicts.flatMap((item) => item.replay_refs).length + blockers.flatMap((item) => item.replay_refs).length,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  timeline: DecisionTimelineResult;
  conflicts: readonly ConflictRecord[];
  nodes: readonly DependencyNode[];
  edges: readonly DependencyEdge[];
  map: ConflictMap;
  graph: DependencyGraphView;
  arbitration: ArbitrationView;
  blockers: readonly BlockerView[];
  explorer: RelationshipExplorer;
  ledger: readonly ConflictLedgerEntry[];
  metrics: ConflictDependencyVisualizationMetrics;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ConflictDependencyVisualizationFailure[] {
  const failures: ConflictDependencyVisualizationFailure[] = [];
  const tenant = ctx(input.timeline).tenant_id;
  const sorted = [...input.edges].sort((a, b) => a.rendering_order - b.rendering_order || a.edge_id.localeCompare(b.edge_id)).map((item) => item.edge_id);
  if (!input.conflicts.length || !input.map.conflict_refs.length) failures.push("CONFLICTS_HIDDEN");
  if (!input.nodes.length || !input.edges.length || !input.graph.node_refs.length) failures.push("DEPENDENCIES_HIDDEN");
  if (!input.blockers.length || !input.graph.blocker_refs.length) failures.push("BLOCKERS_HIDDEN");
  if (!input.arbitration.arbitration_id || !input.arbitration.selected_outcome) failures.push("ARBITRATION_OUTCOME_MISSING");
  if (!input.explorer.visible_nodes.length || !input.explorer.visible_edges.length || input.explorer.relationship_depth <= 0) failures.push("RELATIONSHIP_EXPLORER_INCOMPLETE");
  if (input.ledger.length < 10 || input.ledger.some((entry) => !entry.evidence_ref)) failures.push("CONFLICT_LEDGER_INCOMPLETE");
  if (input.graph.rendering_order.join("|") !== sorted.join("|")) failures.push("GRAPH_ORDER_NONDETERMINISTIC");
  if (input.edges.some((edge) => edge.source_ref === edge.target_ref) && !input.graph.cycle_detected) failures.push("CIRCULAR_DEPENDENCY_UNDETECTED");
  if (!input.map.governance_refs.length || !input.graph.governance_refs.length || input.blockers.some((blocker) => !blocker.governance_refs.length)) failures.push("GOVERNANCE_REFS_MISSING");
  if (!input.map.replay_refs.length || !input.graph.replay_refs.length || !input.arbitration.replay_ref || input.blockers.some((blocker) => !blocker.replay_refs.length)) failures.push("REPLAY_REFS_MISSING");
  if (input.conflicts.some((item) => item.tenant_id !== tenant) || input.nodes.some((item) => item.tenant_id !== tenant)) failures.push("CROSS_TENANT_GRAPH_VISIBLE");
  if (
    input.conflicts.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || input.nodes.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || input.edges.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || hashWithoutIntegrity(input.map) !== input.map.integrity_hash
    || hashWithoutIntegrity(input.graph) !== input.graph.integrity_hash
    || hashWithoutIntegrity(input.arbitration) !== input.arbitration.integrity_hash
    || input.blockers.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash)
    || hashWithoutIntegrity(input.explorer) !== input.explorer.integrity_hash
    || input.ledger.some((item) => hashWithoutIntegrity(item) !== item.integrity_hash || !item.append_only || item.deleted)
    || hashWithoutIntegrity(input.metrics) !== input.metrics.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("GRAPH_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.timeline.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly ConflictDependencyVisualizationFailure[]): ConflictDependencyVisualizationValidation {
  const has = (failure: ConflictDependencyVisualizationFailure) => failures.includes(failure);
  const base: Omit<ConflictDependencyVisualizationValidation, "integrity_hash"> = {
    validation_id: "decision_conflict_dependency_visualization_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    conflicts_visible: !has("CONFLICTS_HIDDEN"),
    dependencies_visible: !has("DEPENDENCIES_HIDDEN"),
    blockers_visible: !has("BLOCKERS_HIDDEN"),
    arbitration_complete: !has("ARBITRATION_OUTCOME_MISSING"),
    relationship_explorer_complete: !has("RELATIONSHIP_EXPLORER_INCOMPLETE"),
    ledger_complete: !has("CONFLICT_LEDGER_INCOMPLETE"),
    deterministic_rendering: !has("GRAPH_ORDER_NONDETERMINISTIC"),
    circular_dependencies_detected: !has("CIRCULAR_DEPENDENCY_UNDETECTED"),
    governance_refs_present: !has("GOVERNANCE_REFS_MISSING"),
    replay_refs_present: !has("REPLAY_REFS_MISSING") && !has("GRAPH_REPLAY_RECONSTRUCTION_FAILED"),
    tenant_isolated: !has("CROSS_TENANT_GRAPH_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConflictDependencyVisualizationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    conflicts: result.conflicts,
    nodes: result.dependency_nodes,
    edges: result.dependency_edges,
    map: result.conflict_map,
    graph: result.dependency_graph,
    arbitration: result.arbitration_view,
    blockers: result.blocker_views,
    explorer: result.relationship_explorer,
    ledger: result.conflict_ledger,
    metrics: result.metrics,
    validation: result.validation,
  });
}

export function runConflictDependencyVisualization(input: ConflictDependencyVisualizationInput = {}): ConflictDependencyVisualizationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const timeline_result = input.timeline_result ?? runDecisionTimelineVisualization();
  const conflicts = buildConflicts(timeline_result, scenario);
  const dependency_nodes = buildNodes(timeline_result, scenario);
  const dependency_edges = buildEdges(scenario);
  const conflict_map = buildConflictMap(timeline_result, conflicts, scenario);
  const dependency_graph = buildDependencyGraph(timeline_result, dependency_nodes, dependency_edges, conflicts, scenario);
  const arbitration_view = buildArbitration(conflicts, conflict_map, timeline_result, scenario);
  const blocker_views = buildBlockers(timeline_result, dependency_graph, scenario);
  const relationship_explorer = buildExplorer(timeline_result, dependency_nodes, dependency_edges, dependency_graph, scenario);
  const conflict_ledger = buildLedger(conflicts, dependency_graph, arbitration_view, blocker_views, scenario);
  const metrics = buildMetrics(conflicts, dependency_edges, blocker_views, dependency_graph, arbitration_view);
  const failures = collectFailures({ timeline: timeline_result, conflicts, nodes: dependency_nodes, edges: dependency_edges, map: conflict_map, graph: dependency_graph, arbitration: arbitration_view, blockers: blocker_views, explorer: relationship_explorer, ledger: conflict_ledger, metrics, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<ConflictDependencyVisualizationResult, "integrity_hash" | "replay_hash"> = {
    visualization_version: VISUALIZATION_VERSION,
    timeline_result,
    conflicts,
    dependency_nodes,
    dependency_edges,
    conflict_map,
    dependency_graph,
    arbitration_view,
    blocker_views,
    relationship_explorer,
    conflict_ledger,
    metrics,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConflictDependencyVisualization(result: ConflictDependencyVisualizationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeConflictRecordHash(record: Omit<ConflictRecord, "integrity_hash"> | ConflictRecord): string {
  return hashWithoutIntegrity(record);
}

export function getConflictDependencyVisualizationFoundation(): ConflictDependencyVisualizationFoundation {
  return Object.freeze({
    visualization_version: VISUALIZATION_VERSION,
    conflict_types: DECISION_CONFLICT_TYPES,
    relationship_types: DEPENDENCY_RELATIONSHIP_TYPES,
    arbitration_states: ARBITRATION_STATES,
    blocker_types: BLOCKER_TYPES,
    result: runConflictDependencyVisualization(),
  });
}

export const ConflictDependencyVisualization = Object.freeze({
  run: runConflictDependencyVisualization,
  replay: replayConflictDependencyVisualization,
});
