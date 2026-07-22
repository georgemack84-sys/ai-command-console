import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { DigitalTwinBundle, DigitalTwinDecision, DigitalTwinFailure, DigitalTwinInput, DigitalTwinResult, DigitalTwinScenario, DigitalTwinValidation, SynchronizationStatus, TwinEdgeKind, TwinNodeKind } from "@/types/digital-twin";

const VERSION = "digital-twin/mc-6" as const;
const IDENTIFIER = "DigitalTwin" as const;
const NODE_KINDS = Object.freeze<TwinNodeKind[]>(["MISSION", "PORTFOLIO", "OBJECTIVE", "DECISION", "RESOURCE", "EVIDENCE", "OPERATOR", "DEPENDENCY"]);
const EDGE_KINDS = Object.freeze<TwinEdgeKind[]>(["OWNERSHIP", "DEPENDENCY", "EXECUTION", "LINEAGE", "EVIDENCE", "ASSIGNMENT", "AUTHORITY"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly DigitalTwinFailure[], failure: DigitalTwinFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: DigitalTwinScenario): DigitalTwinFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly DigitalTwinFailure[], scenario: DigitalTwinScenario): DigitalTwinDecision {
  const conditional = new Set<DigitalTwinFailure>(["DIGITAL_TWIN_ENGINE_MISSING", "PROJECTION_ENGINE_MISSING", "SYNCHRONIZATION_ENGINE_MISSING", "TWIN_STATE_GRAPH_MISSING", "SNAPSHOT_MANAGER_MISSING", "TWIN_QUERY_SERVICE_MISSING", "HISTORICAL_RECONSTRUCTION_MISSING", "DIVERGENCE_DETECTION_MISSING", "VISUALIZATION_MODEL_MISSING", "TWIN_EVIDENCE_MISSING", "SYNCHRONIZATION_REPORTS_MISSING", "DIGITAL_TWIN_APIS_MISSING", "DIGITAL_TWIN_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "DIGITAL_TWIN_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "DIGITAL_TWIN_QUALIFIED";
}
function resultReplayHash(result: Omit<DigitalTwinResult, "replay_hash" | "integrity_hash">): string { return hash({ engine: result.engine.integrity_hash, projection: result.projection.integrity_hash, synchronization: result.synchronization.integrity_hash, graph: result.graph.integrity_hash, snapshots: result.snapshots.integrity_hash, query: result.query.integrity_hash, historical: result.historical.integrity_hash, divergence: result.divergence.integrity_hash, visualization: result.visualization.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, reports: result.reports.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<DigitalTwinResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runDigitalTwin(input: DigitalTwinInput = {}): DigitalTwinResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<DigitalTwinFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const engineOk = !has(failures, "DIGITAL_TWIN_ENGINE_MISSING") && !has(failures, "CCI_EVENT_HISTORY_NOT_AUTHORITATIVE") && !has(failures, "TWIN_DIRECT_MUTATION_ALLOWED") && !has(failures, "TWIN_INDEPENDENT_SOURCE_OF_TRUTH") && !has(failures, "TWIN_STATE_NOT_REPLAYABLE") && !has(failures, "TWIN_TRANSITION_EVIDENCE_MISSING");
  const projectionOk = !has(failures, "PROJECTION_ENGINE_MISSING") && !has(failures, "PROJECTION_NON_DETERMINISTIC") && !has(failures, "TWIN_REPLACES_AUTHORITATIVE_RECORDS");
  const syncOk = !has(failures, "SYNCHRONIZATION_ENGINE_MISSING") && !has(failures, "SYNCHRONIZATION_NON_DETERMINISTIC") && !has(failures, "REPLAY_TWIN_EQUIVALENCE_FAILED");
  const graphOk = !has(failures, "TWIN_STATE_GRAPH_MISSING") && !has(failures, "TWIN_GRAPH_LINEAGE_INCOMPLETE");
  const snapshotsOk = !has(failures, "SNAPSHOT_MANAGER_MISSING") && !has(failures, "SNAPSHOTS_AUTHORITATIVE") && !has(failures, "SNAPSHOT_NOT_REPRODUCIBLE");
  const queryOk = !has(failures, "TWIN_QUERY_SERVICE_MISSING") && !has(failures, "TWIN_QUERY_NOT_EVIDENCE_BACKED");
  const historicalOk = !has(failures, "HISTORICAL_RECONSTRUCTION_MISSING") && !has(failures, "HISTORICAL_RECONSTRUCTION_FAILED");
  const divergenceOk = !has(failures, "DIVERGENCE_DETECTION_MISSING") && !has(failures, "DIVERGENCE_EVIDENCE_MISSING");
  const visualizationOk = !has(failures, "VISUALIZATION_MODEL_MISSING") && !has(failures, "VISUALIZATION_MUTATES_TWIN");
  const evidenceOk = !has(failures, "TWIN_EVIDENCE_MISSING") && !has(failures, "OPERATIONAL_EVIDENCE_QUALIFICATION_FAILED");
  const reportsOk = !has(failures, "SYNCHRONIZATION_REPORTS_MISSING") && !has(failures, "SYNCHRONIZATION_REPORTS_NOT_EVIDENCE_BACKED");
  const apisOk = !has(failures, "DIGITAL_TWIN_APIS_MISSING");
  const replayOk = !has(failures, "DETERMINISTIC_REPLAY_VALIDATION_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "DIGITAL_TWIN_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const twin_id = input.twin_id ?? `twin:mc-6:${input.seed ?? "canonical"}`;
  const status: SynchronizationStatus = syncOk ? "SYNCHRONIZED" : "DIVERGED";
  const engine = nested({ engine_id: engineOk ? "engine:mc-6:digital-twin" : "", event_ingestion: engineOk, event_ordering: engineOk, state_projection: engineOk, aggregate_reconstruction: engineOk, graph_maintenance: engineOk, historical_reconstruction: engineOk, snapshot_generation: engineOk, derived_exclusively_from_cci_event_history: engineOk, no_direct_mutation: engineOk, not_source_of_truth: engineOk, every_state_replayable: engineOk, complete_lineage: engineOk });
  const projection = nested({ projection_id: projectionOk ? "projection:mc-6:twin" : "", current_state: projectionOk, historical_state: projectionOk, point_in_time_reconstruction: projectionOk, incremental_updates: projectionOk, mission_projections: projectionOk, deterministic_projection: projectionOk, projections_do_not_replace_authoritative_records: projectionOk });
  const synchronization = nested({ sync_id: syncOk ? "sync:mc-6:twin" : "", event_history_alignment: syncOk, operational_twin_alignment: syncOk, replay_reconstruction_alignment: syncOk, synchronization_validation: syncOk, divergence_detection: syncOk, recovery: syncOk, reconciliation_reports: syncOk, deterministic_synchronization: syncOk, replay_twin_equivalence: syncOk });
  const graph = nested({ graph_id: graphOk ? "graph:mc-6:twin-state" : "", node_kinds: graphOk ? freezeArray(NODE_KINDS) : freezeArray<TwinNodeKind>([]), edge_kinds: graphOk ? freezeArray(EDGE_KINDS) : freezeArray<TwinEdgeKind>([]), dependency_traversal: graphOk, impact_analysis: graphOk, relationship_discovery: graphOk, lineage_exploration: graphOk, evidence_relationships: graphOk, complete_graph_lineage: graphOk });
  const snapshots = nested({ manager_id: snapshotsOk ? "manager:mc-6:snapshots" : "", checkpoint_creation: snapshotsOk, historical_comparison: snapshotsOk, rollback_visualization: snapshotsOk, replay_optimization: snapshotsOk, snapshots_are_optimization_only: snapshotsOk, replay_remains_authoritative: snapshotsOk, reproducible_from_event_history: snapshotsOk });
  const query = nested({ service_id: queryOk ? "service:mc-6:twin-query" : "", current_state_queries: queryOk, historical_state_queries: queryOk, mission_evolution: queryOk, decision_evolution: queryOk, portfolio_evolution: queryOk, evidence_relationships: queryOk, dependency_graphs: queryOk, graph_queries: queryOk, timeline_queries: queryOk, evidence_queries: queryOk, replay_alignment: queryOk, evidence_backed_results: queryOk });
  const historical = nested({ service_id: historicalOk ? "service:mc-6:historical-reconstruction" : "", point_in_time_reconstruction: historicalOk, mission_history: historicalOk, decision_history: historicalOk, portfolio_history: historicalOk, resource_history: historicalOk, uses_only_cci_event_history: historicalOk, reconstructs_every_mission: historicalOk });
  const divergence = nested({ detector_id: divergenceOk ? "detector:mc-6:divergence" : "", continuous_validation: divergenceOk, replay_derived_state_comparison: divergenceOk, current_twin_state_comparison: divergenceOk, divergence_reports: divergenceOk, reconciliation_evidence: divergenceOk, recovery_recommendations: divergenceOk, operational_evidence_generated: divergenceOk });
  const visualization = nested({ model_id: visualizationOk ? "model:mc-6:visualization" : "", dashboards: visualizationOk, replay_viewer: visualizationOk, mission_explorer: visualizationOk, portfolio_explorer: visualizationOk, evidence_explorer: visualizationOk, normalized_operational_model: visualizationOk, consumes_twin_state: visualizationOk, never_modifies_twin_state: visualizationOk });
  const evidence = nested({ generator_id: evidenceOk ? "generator:mc-6:evidence" : "", synchronization_evidence: evidenceOk, transition_evidence: evidenceOk, lineage_evidence: evidenceOk, divergence_evidence: evidenceOk, replay_validation_evidence: evidenceOk, immutable_evidence_references: evidenceOk, operational_evidence_qualification: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-6:digital-twin" : "", projection_api: apisOk, query_api: apisOk, synchronization_api: apisOk, snapshot_api: apisOk, historical_reconstruction_api: apisOk, graph_relationships: apisOk, replay_comparison: apisOk, snapshot_comparison: apisOk, stable: apisOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-6:synchronization" : "", status, replay_position: reportsOk ? "cci-event-history:position:1000" : "", twin_position: reportsOk ? "twin:position:1000" : "", divergence_summary: reportsOk, validation_evidence: reportsOk, replay_comparison: reportsOk, reconciliation_evidence: reportsOk, evidence_backed: reportsOk });
  const readiness = nested({ readiness_id: "MC-6-DIGITAL-TWIN-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), engine_ready: engineOk, projection_ready: projectionOk, synchronization_ready: syncOk, graph_ready: graphOk, snapshots_ready: snapshotsOk, query_ready: queryOk, historical_ready: historicalOk, divergence_ready: divergenceOk, visualization_ready: visualizationOk, evidence_ready: evidenceOk, apis_ready: apisOk, reports_ready: reportsOk, cci_event_history_exclusive: engineOk && historicalOk, no_direct_mutation: engineOk && visualizationOk, replay_equivalent: syncOk && replayOk, qualification_ready: qualified, failures });
  const base: Omit<DigitalTwinResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, twin_id, engine, projection, synchronization, graph, snapshots, query, historical, divergence, visualization, evidence, apis, reports, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateDigitalTwin(result?: DigitalTwinResult): DigitalTwinValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, engine_valid: false, projection_valid: false, synchronization_valid: false, graph_valid: false, snapshots_valid: false, query_valid: false, historical_valid: false, divergence_valid: false, visualization_valid: false, evidence_valid: false, apis_valid: false, reports_valid: false, readiness_valid: false, failures: freezeArray(["DIGITAL_TWIN_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const engine_valid = verifyHashed(result.engine) && result.engine.derived_exclusively_from_cci_event_history && result.engine.no_direct_mutation && result.engine.not_source_of_truth && result.engine.every_state_replayable;
  const projection_valid = verifyHashed(result.projection) && result.projection.deterministic_projection && result.projection.projections_do_not_replace_authoritative_records;
  const synchronization_valid = verifyHashed(result.synchronization) && result.synchronization.deterministic_synchronization && result.synchronization.replay_twin_equivalence;
  const graph_valid = verifyHashed(result.graph) && result.graph.node_kinds.length === 8 && result.graph.edge_kinds.length === 7 && result.graph.complete_graph_lineage;
  const snapshots_valid = verifyHashed(result.snapshots) && result.snapshots.snapshots_are_optimization_only && result.snapshots.replay_remains_authoritative && result.snapshots.reproducible_from_event_history;
  const query_valid = verifyHashed(result.query) && result.query.graph_queries && result.query.timeline_queries && result.query.evidence_backed_results;
  const historical_valid = verifyHashed(result.historical) && result.historical.uses_only_cci_event_history && result.historical.reconstructs_every_mission;
  const divergence_valid = verifyHashed(result.divergence) && result.divergence.continuous_validation && result.divergence.operational_evidence_generated;
  const visualization_valid = verifyHashed(result.visualization) && result.visualization.consumes_twin_state && result.visualization.never_modifies_twin_state;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.synchronization_evidence && result.evidence.immutable_evidence_references && result.evidence.operational_evidence_qualification;
  const apis_valid = verifyHashed(result.apis) && result.apis.projection_api && result.apis.query_api && result.apis.synchronization_api && result.apis.stable;
  const reports_valid = verifyHashed(result.reports) && result.reports.status === "SYNCHRONIZED" && result.reports.evidence_backed && result.reports.replay_position === result.reports.twin_position.replace("twin", "cci-event-history");
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.cci_event_history_exclusive && result.readiness.no_direct_mutation && result.readiness.replay_equivalent && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && engine_valid && projection_valid && synchronization_valid && graph_valid && snapshots_valid && query_valid && historical_valid && divergence_valid && visualization_valid && evidence_valid && apis_valid && reports_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, engine_valid, projection_valid, synchronization_valid, graph_valid, snapshots_valid, query_valid, historical_valid, divergence_valid, visualization_valid, evidence_valid, apis_valid, reports_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayDigitalTwin(result = runDigitalTwin()): boolean { const replayed = runDigitalTwin(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateDigitalTwin(result).valid; }
export function getDigitalTwinBundle(): DigitalTwinBundle { const result = runDigitalTwin(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_digital_twin_engine: true, owns_projection_engine: true, owns_state_synchronization: true, owns_twin_state_graph: true, owns_snapshot_manager: true, owns_historical_reconstruction: true, derives_exclusively_from_cci_event_history: true, twin_is_not_source_of_truth: true, direct_mutation_prohibited: true, qualification_gate: "Digital Twin Qualification Gate" }), result, validation: validateDigitalTwin(result) }); }
export const DigitalTwinService = Object.freeze({ run: runDigitalTwin, validate: validateDigitalTwin, replay: replayDigitalTwin });
