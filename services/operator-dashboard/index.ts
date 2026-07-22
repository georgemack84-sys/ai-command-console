import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runMissionRecommendationIntelligence, validateMissionRecommendationIntelligence } from "@/services/mission-recommendation-intelligence";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { runSimulation, validateSimulation } from "@/services/simulation";
import type { DashboardViewKind, OperatorDashboardBundle, OperatorDashboardDecision, OperatorDashboardFailure, OperatorDashboardInput, OperatorDashboardResult, OperatorDashboardScenario, OperatorDashboardValidation } from "@/types/operator-dashboard";

const VERSION = "operator-dashboard/mc-10" as const;
const IDENTIFIER = "OperatorDashboard" as const;
const VIEW_KINDS = Object.freeze<DashboardViewKind[]>(["MISSION", "PORTFOLIO", "RISK", "REPLAY", "RECOMMENDATION", "DIGITAL_TWIN", "ALERT", "KPI", "EVIDENCE"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "cci-evidence", "cci-replay", "cci-observability", "caf-evidence", "caf-runtime-status"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), simulation: runSimulation(), risk: runRiskAssessment(), recommendations: runMissionRecommendationIntelligence() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly OperatorDashboardFailure[], failure: OperatorDashboardFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: OperatorDashboardScenario): OperatorDashboardFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly OperatorDashboardFailure[], scenario?: OperatorDashboardScenario): OperatorDashboardDecision {
  const conditional = new Set<OperatorDashboardFailure>(["DASHBOARD_SERVICE_MISSING", "PAGE_COMPOSITION_MISSING", "LAYOUTS_MISSING", "STATE_SYNCHRONIZATION_MISSING", "WIDGET_ORCHESTRATION_MISSING", "DASHBOARD_CONFIGURATION_MISSING", "MISSION_VIEW_MISSING", "PORTFOLIO_VIEW_MISSING", "RISK_VIEW_MISSING", "REPLAY_VIEW_MISSING", "RECOMMENDATION_VIEW_MISSING", "DIGITAL_TWIN_VIEW_MISSING", "ALERT_CENTER_MISSING", "KPI_DASHBOARD_MISSING", "EVIDENCE_EXPLORER_MISSING", "SEARCH_SERVICE_MISSING", "FILTERING_MISSING", "VISUALIZATION_SERVICE_MISSING", "OPERATOR_NAVIGATION_MISSING", "DASHBOARD_API_MISSING", "QUERY_API_MISSING", "VISUALIZATION_API_MISSING", "EVIDENCE_API_MISSING", "DASHBOARD_EVIDENCE_MISSING", "DASHBOARD_AUDIT_RECORDS_MISSING", "OPERATOR_DASHBOARD_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "OPERATOR_DASHBOARD_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "OPERATOR_DASHBOARD_QUALIFIED";
}
function resultReplayHash(result: Omit<OperatorDashboardResult, "replay_hash" | "integrity_hash">): string { return hash({ dashboard: result.dashboard.integrity_hash, mission: result.mission.integrity_hash, portfolio: result.portfolio.integrity_hash, risk: result.risk.integrity_hash, replay: result.replay.integrity_hash, recommendations: result.recommendations.integrity_hash, digital_twin: result.digital_twin.integrity_hash, alerts: result.alerts.integrity_hash, kpis: result.kpis.integrity_hash, evidence: result.evidence.integrity_hash, search: result.search.integrity_hash, filters: result.filters.integrity_hash, visualization: result.visualization.integrity_hash, navigation: result.navigation.integrity_hash, security: result.security.integrity_hash, apis: result.apis.integrity_hash, audit: result.audit.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<OperatorDashboardResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runOperatorDashboard(input: OperatorDashboardInput = {}): OperatorDashboardResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<OperatorDashboardFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_7_SIMULATION_INVALID", !validateSimulation(baselines.simulation).valid],
    ["MC_8_RISK_ASSESSMENT_INVALID", !validateRiskAssessment(baselines.risk).valid],
    ["MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", !validateMissionRecommendationIntelligence(baselines.recommendations).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const noControl = !has(failures, "EXECUTION_CAPABILITY_PRESENT") && !has(failures, "ACTION_APPROVAL_CAPABILITY_PRESENT") && !has(failures, "WORKLOAD_DISPATCH_CAPABILITY_PRESENT") && !has(failures, "MISSION_STATE_MUTATION_CAPABILITY_PRESENT") && !has(failures, "PORTFOLIO_STATE_MUTATION_CAPABILITY_PRESENT") && !has(failures, "AUTOMATION_INVOCATION_CAPABILITY_PRESENT") && !has(failures, "GOVERNANCE_BYPASS_CAPABILITY_PRESENT") && !has(failures, "OPERATOR_APPROVAL_BYPASS_CAPABILITY_PRESENT");
  const dashboardOk = !has(failures, "DASHBOARD_SERVICE_MISSING") && !has(failures, "PAGE_COMPOSITION_MISSING") && !has(failures, "LAYOUTS_MISSING") && !has(failures, "STATE_SYNCHRONIZATION_MISSING") && !has(failures, "WIDGET_ORCHESTRATION_MISSING") && !has(failures, "DASHBOARD_CONFIGURATION_MISSING") && !has(failures, "TENANT_ISOLATION_FAILED") && noControl;
  const missionOk = !has(failures, "MISSION_VIEW_MISSING");
  const portfolioOk = !has(failures, "PORTFOLIO_VIEW_MISSING");
  const riskOk = !has(failures, "RISK_VIEW_MISSING");
  const replayOk = !has(failures, "REPLAY_VIEW_MISSING");
  const recommendationOk = !has(failures, "RECOMMENDATION_VIEW_MISSING");
  const twinOk = !has(failures, "DIGITAL_TWIN_VIEW_MISSING");
  const alertsOk = !has(failures, "ALERT_CENTER_MISSING");
  const kpisOk = !has(failures, "KPI_DASHBOARD_MISSING");
  const evidenceOk = !has(failures, "EVIDENCE_EXPLORER_MISSING") && !has(failures, "DISPLAY_LINEAGE_MISSING") && !has(failures, "DISPLAY_EVIDENCE_REFERENCE_MISSING") && !has(failures, "DISPLAY_CONFIDENCE_MISSING") && !has(failures, "GOVERNING_AUTHORITY_MISSING");
  const searchOk = !has(failures, "SEARCH_SERVICE_MISSING") && !has(failures, "QUERY_NON_DETERMINISTIC");
  const filtersOk = !has(failures, "FILTERING_MISSING") && !has(failures, "QUERY_NON_DETERMINISTIC");
  const visualizationOk = !has(failures, "VISUALIZATION_SERVICE_MISSING");
  const navigationOk = !has(failures, "OPERATOR_NAVIGATION_MISSING");
  const securityOk = !has(failures, "AUTHORIZATION_VALIDATION_MISSING") && !has(failures, "LEAST_PRIVILEGE_MISSING") && !has(failures, "EVIDENCE_VISIBILITY_RULES_MISSING") && !has(failures, "CONSTITUTIONAL_ACCESS_CONTROL_MISSING") && !has(failures, "TENANT_ISOLATION_FAILED");
  const apisOk = !has(failures, "DASHBOARD_API_MISSING") && !has(failures, "QUERY_API_MISSING") && !has(failures, "VISUALIZATION_API_MISSING") && !has(failures, "EVIDENCE_API_MISSING");
  const auditOk = !has(failures, "DASHBOARD_EVIDENCE_MISSING") && !has(failures, "DASHBOARD_AUDIT_RECORDS_MISSING");
  const configOk = !has(failures, "CONFIGURATION_NOT_VERSIONED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "OPERATOR_DASHBOARD_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const dashboard_id = input.dashboard_id ?? `operator-dashboard:mc-10:${input.seed ?? "canonical"}`;
  const dashboard = nested({ service_id: dashboardOk ? "service:mc-10:operator-dashboard" : "", page_composition: dashboardOk, dashboard_layouts: dashboardOk, state_synchronization: dashboardOk, widget_orchestration: dashboardOk, dashboard_configuration: dashboardOk && configOk, tenant_isolation: dashboardOk, read_only: dashboardOk });
  const mission = nested({ view_id: missionOk ? "view:mc-10:mission" : "", active_missions: missionOk, completed_missions: missionOk, delayed_missions: missionOk, blocked_missions: missionOk, mission_evidence: missionOk, mission_health: missionOk, lifecycle_status: missionOk });
  const portfolio = nested({ view_id: portfolioOk ? "view:mc-10:portfolio" : "", portfolio_health: portfolioOk, concurrent_missions: portfolioOk, resource_allocation: portfolioOk, dependencies: portfolioOk, completion_forecasts: portfolioOk });
  const risk = nested({ view_id: riskOk ? "view:mc-10:risk" : "", operational_risk: riskOk, portfolio_risk: riskOk, trend_analysis: riskOk, heat_maps: riskOk, confidence_levels: riskOk, consumes_mc_8: riskOk });
  const replay = nested({ view_id: replayOk ? "view:mc-10:replay" : "", replay_sessions: replayOk, historical_timelines: replayOk, evidence_navigation: replayOk, divergence_summaries: replayOk, consumes_mc_5: replayOk });
  const recommendations = nested({ view_id: recommendationOk ? "view:mc-10:recommendations" : "", recommendations: recommendationOk, recommendation_confidence: recommendationOk, supporting_evidence: recommendationOk, recommendation_rationale: recommendationOk, recommendation_history: recommendationOk, advisory_only: recommendationOk, consumes_mc_9: recommendationOk });
  const digital_twin = nested({ view_id: twinOk ? "view:mc-10:digital-twin" : "", operational_twin: twinOk, system_topology: twinOk, synchronization_health: twinOk, state_visualization: twinOk, dependency_graph: twinOk, consumes_mc_6: twinOk });
  const alerts = nested({ alert_id: alertsOk ? "alerts:mc-10:center" : "", active_alerts: alertsOk, acknowledgements: alertsOk, priorities: alertsOk, alert_evidence: alertsOk, operational_notifications: alertsOk, observational_only: alertsOk });
  const kpis = nested({ kpi_id: kpisOk ? "kpi:mc-10:dashboard" : "", mission_kpis: kpisOk, operational_kpis: kpisOk, portfolio_kpis: kpisOk, risk_kpis: kpisOk, availability_kpis: kpisOk, performance_kpis: kpisOk, governance_kpis: kpisOk });
  const evidence = nested({ explorer_id: evidenceOk ? "explorer:mc-10:evidence" : "", evidence_packages: evidenceOk, lineage: evidenceOk, provenance: evidenceOk, supporting_artifacts: evidenceOk, qualification_evidence: evidenceOk });
  const search = nested({ search_id: searchOk ? "search:mc-10:dashboard" : "", mission_search: searchOk, replay_search: searchOk, evidence_search: searchOk, recommendation_search: searchOk, portfolio_search: searchOk, risk_search: searchOk, deterministic_search: searchOk });
  const filters = nested({ filters_id: filtersOk ? "filters:mc-10:dashboard" : "", tenant: filtersOk, organization: filtersOk, portfolio: filtersOk, mission: filtersOk, lifecycle_state: filtersOk, recommendation_type: filtersOk, risk_level: filtersOk, timeframe: filtersOk, evidence_source: filtersOk, deterministic_filtering: filtersOk });
  const visualization = nested({ visualization_id: visualizationOk ? "visualization:mc-10:dashboard" : "", timelines: visualizationOk, dependency_graphs: visualizationOk, heat_maps: visualizationOk, trend_charts: visualizationOk, evidence_trees: visualizationOk, topology_graphs: visualizationOk, mission_graphs: visualizationOk, operational_summaries: visualizationOk });
  const navigation = nested({ navigation_id: navigationOk ? "navigation:mc-10:operator" : "", unified_navigation: navigationOk, contextual_drill_down: navigationOk, evidence_first_exploration: navigationOk, historical_comparisons: navigationOk, synchronized_dashboards: navigationOk, cross_service_navigation: navigationOk });
  const security = nested({ security_id: securityOk ? "security:mc-10:dashboard" : "", tenant_isolation: securityOk, authorization_validation: securityOk, least_privilege: securityOk, evidence_visibility_rules: securityOk, constitutional_access_controls: securityOk });
  const apis = nested({ api_id: apisOk ? "api:mc-10:operator-dashboard" : "", dashboard_api: apisOk, query_api: apisOk, visualization_api: apisOk, evidence_api: apisOk, operational_summaries: apisOk, widget_configuration: apisOk, lineage_retrieval: apisOk, provenance_lookup: apisOk, stable: apisOk });
  const audit = nested({ evidence_id: auditOk ? "evidence:mc-10:dashboard-audit" : "", dashboard_evidence: auditOk, visualization_evidence: auditOk, operator_activity_evidence: auditOk, query_evidence: auditOk, configuration_evidence: auditOk && configOk, audit_records: auditOk, immutable: auditOk, complete_lineage: auditOk });
  const readiness = nested({ readiness_id: "MC-10-OPERATOR-DASHBOARD-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), dashboard_ready: dashboardOk, mission_ready: missionOk, portfolio_ready: portfolioOk, risk_ready: riskOk, replay_ready: replayOk, recommendation_ready: recommendationOk, twin_ready: twinOk, alerts_ready: alertsOk, kpis_ready: kpisOk, evidence_ready: evidenceOk, search_ready: searchOk, filters_ready: filtersOk, visualization_ready: visualizationOk, navigation_ready: navigationOk, security_ready: securityOk, apis_ready: apisOk, deterministic_queries: searchOk && filtersOk, read_only: dashboardOk, observational_only: noControl, advisory_only: recommendationOk, no_execution_authority: noControl, configuration_governed: configOk, audit_ready: auditOk, qualification_ready: qualified, failures });
  const base: Omit<OperatorDashboardResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, dashboard_id, view_kinds: freezeArray(VIEW_KINDS), dashboard, mission, portfolio, risk, replay, recommendations, digital_twin, alerts, kpis, evidence, search, filters, visualization, navigation, security, apis, audit, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperatorDashboard(result?: OperatorDashboardResult): OperatorDashboardValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, dashboard_valid: false, mission_valid: false, portfolio_valid: false, risk_valid: false, replay_valid: false, recommendation_valid: false, twin_valid: false, alerts_valid: false, kpis_valid: false, evidence_valid: false, search_valid: false, filters_valid: false, visualization_valid: false, navigation_valid: false, security_valid: false, apis_valid: false, audit_valid: false, readiness_valid: false, failures: freezeArray(["DASHBOARD_SERVICE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const dashboard_valid = verifyHashed(result.dashboard) && result.dashboard.page_composition && result.dashboard.tenant_isolation && result.dashboard.read_only;
  const mission_valid = verifyHashed(result.mission) && result.mission.active_missions && result.mission.mission_evidence && result.mission.lifecycle_status;
  const portfolio_valid = verifyHashed(result.portfolio) && result.portfolio.portfolio_health && result.portfolio.resource_allocation && result.portfolio.completion_forecasts;
  const risk_valid = verifyHashed(result.risk) && result.risk.operational_risk && result.risk.heat_maps && result.risk.consumes_mc_8;
  const replay_valid = verifyHashed(result.replay) && result.replay.replay_sessions && result.replay.evidence_navigation && result.replay.consumes_mc_5;
  const recommendation_valid = verifyHashed(result.recommendations) && result.recommendations.recommendations && result.recommendations.advisory_only && result.recommendations.consumes_mc_9;
  const twin_valid = verifyHashed(result.digital_twin) && result.digital_twin.operational_twin && result.digital_twin.dependency_graph && result.digital_twin.consumes_mc_6;
  const alerts_valid = verifyHashed(result.alerts) && result.alerts.active_alerts && result.alerts.alert_evidence && result.alerts.observational_only;
  const kpis_valid = verifyHashed(result.kpis) && result.kpis.mission_kpis && result.kpis.risk_kpis && result.kpis.governance_kpis;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.evidence_packages && result.evidence.lineage && result.evidence.provenance;
  const search_valid = verifyHashed(result.search) && result.search.mission_search && result.search.evidence_search && result.search.deterministic_search;
  const filters_valid = verifyHashed(result.filters) && result.filters.tenant && result.filters.risk_level && result.filters.deterministic_filtering;
  const visualization_valid = verifyHashed(result.visualization) && result.visualization.timelines && result.visualization.heat_maps && result.visualization.topology_graphs;
  const navigation_valid = verifyHashed(result.navigation) && result.navigation.unified_navigation && result.navigation.evidence_first_exploration && result.navigation.cross_service_navigation;
  const security_valid = verifyHashed(result.security) && result.security.tenant_isolation && result.security.authorization_validation && result.security.least_privilege && result.security.constitutional_access_controls;
  const apis_valid = verifyHashed(result.apis) && result.apis.dashboard_api && result.apis.query_api && result.apis.visualization_api && result.apis.evidence_api && result.apis.stable;
  const audit_valid = verifyHashed(result.audit) && result.audit.dashboard_evidence && result.audit.query_evidence && result.audit.audit_records && result.audit.immutable && result.audit.complete_lineage;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.read_only && result.readiness.observational_only && result.readiness.no_execution_authority && result.readiness.audit_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && dashboard_valid && mission_valid && portfolio_valid && risk_valid && replay_valid && recommendation_valid && twin_valid && alerts_valid && kpis_valid && evidence_valid && search_valid && filters_valid && visualization_valid && navigation_valid && security_valid && apis_valid && audit_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, dashboard_valid, mission_valid, portfolio_valid, risk_valid, replay_valid, recommendation_valid, twin_valid, alerts_valid, kpis_valid, evidence_valid, search_valid, filters_valid, visualization_valid, navigation_valid, security_valid, apis_valid, audit_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayOperatorDashboard(result = runOperatorDashboard()): boolean { const replayed = runOperatorDashboard(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperatorDashboard(result).valid; }
export function getOperatorDashboardBundle(): OperatorDashboardBundle { const result = runOperatorDashboard(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_unified_operator_workspace: true, aggregates_all_mission_control_services: true, read_only_dashboard: true, observational_only: true, advisory_only: true, execution_authority_outside_mc_10: true, evidence_lineage_required_for_every_displayed_object: true, qualification_gate: "Operator Dashboard Qualification Gate" }), result, validation: validateOperatorDashboard(result) }); }
export const OperatorDashboardService = Object.freeze({ run: runOperatorDashboard, validate: validateOperatorDashboard, replay: replayOperatorDashboard });
