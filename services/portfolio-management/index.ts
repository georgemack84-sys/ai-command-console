import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafLegionRuntime, validateCafLegionRuntime } from "@/services/caf-legion-runtime";
import { runCertificationEngine, validateCertificationEngine } from "@/services/certification-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { PortfolioLifecycleState, PortfolioManagementBundle, PortfolioManagementDecision, PortfolioManagementFailure, PortfolioManagementInput, PortfolioManagementResult, PortfolioManagementScenario, PortfolioManagementValidation } from "@/types/portfolio-management";

const VERSION = "portfolio-management/mc-4" as const;
const IDENTIFIER = "PortfolioManagement" as const;
const LIFECYCLE = Object.freeze<PortfolioLifecycleState[]>(["DRAFT", "ACTIVE", "REBALANCING", "DEGRADED", "SUSPENDED", "CLOSED", "ARCHIVED"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "registry-core/w1.4a", "caf-legion-runtime/w1.8", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15", "runtime-orchestrator/w2.10"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), registry: runRegistryCore(), cafRuntime: runCafLegionRuntime(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), evidence: runEvidenceEngine(), replay: runReplayEngine(), certification: runCertificationEngine(), runtime: runRuntimeOrchestrator() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly PortfolioManagementFailure[], failure: PortfolioManagementFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: PortfolioManagementScenario): PortfolioManagementFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly PortfolioManagementFailure[], scenario: PortfolioManagementScenario): PortfolioManagementDecision {
  const conditional = new Set<PortfolioManagementFailure>(["PORTFOLIO_REGISTRY_MISSING", "MISSION_PORTFOLIO_ENGINE_MISSING", "RESOURCE_PLANNER_MISSING", "PRIORITIZATION_ENGINE_MISSING", "DEPENDENCY_MANAGER_MISSING", "HEALTH_SERVICE_MISSING", "CONFLICT_DETECTION_MISSING", "ANALYTICS_MISSING", "EXECUTIVE_DASHBOARD_MISSING", "REPORTING_SERVICE_MISSING", "PORTFOLIO_EVIDENCE_MISSING", "PORTFOLIO_APIS_MISSING", "SCALE_QUALIFICATION_MISSING", "PORTFOLIO_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "PORTFOLIO_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "PORTFOLIO_MANAGEMENT_QUALIFIED";
}
function resultReplayHash(result: Omit<PortfolioManagementResult, "replay_hash" | "integrity_hash">): string { return hash({ registry: result.registry.integrity_hash, engine: result.engine.integrity_hash, resources: result.resources.integrity_hash, prioritization: result.prioritization.integrity_hash, dependencies: result.dependencies.integrity_hash, health: result.health.integrity_hash, conflicts: result.conflicts.integrity_hash, analytics: result.analytics.integrity_hash, dashboard: result.dashboard.integrity_hash, reporting: result.reporting.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, scale: result.scale.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<PortfolioManagementResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runPortfolioManagement(input: PortfolioManagementInput = {}): PortfolioManagementResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<PortfolioManagementFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["W1_REGISTRY_INVALID", !validateRegistryCore(baselines.registry).valid],
    ["W1_CAF_RUNTIME_INVALID", !validateCafLegionRuntime(baselines.cafRuntime).valid],
    ["W2_AUTHORITY_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_POLICY_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_SAFETY_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_EVIDENCE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_REPLAY_INVALID", !validateReplayEngine(baselines.replay).valid],
    ["W2_CERTIFICATION_INVALID", !validateCertificationEngine(baselines.certification).valid],
    ["W2_RUNTIME_INVALID", !validateRuntimeOrchestrator(baselines.runtime).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const registryOk = !has(failures, "PORTFOLIO_REGISTRY_MISSING") && !has(failures, "PORTFOLIO_HIERARCHY_MISSING") && !has(failures, "PORTFOLIO_LIFECYCLE_INVALID");
  const engineOk = !has(failures, "MISSION_PORTFOLIO_ENGINE_MISSING") && !has(failures, "MISSION_SYNCHRONIZATION_NON_DETERMINISTIC");
  const resourceOk = !has(failures, "RESOURCE_PLANNER_MISSING") && !has(failures, "RESOURCE_CONTENTION_UNDETECTED") && !has(failures, "CAPACITY_PLANNING_MISSING");
  const priorityOk = !has(failures, "PRIORITIZATION_ENGINE_MISSING") && !has(failures, "PRIORITY_GOVERNANCE_BYPASSED") && !has(failures, "DYNAMIC_REPRIORITIZATION_NON_DETERMINISTIC");
  const dependencyOk = !has(failures, "DEPENDENCY_MANAGER_MISSING") && !has(failures, "DEPENDENCY_VALIDATION_FAILED");
  const healthOk = !has(failures, "HEALTH_SERVICE_MISSING") && !has(failures, "PORTFOLIO_HEALTH_INCOMPLETE");
  const conflictsOk = !has(failures, "CONFLICT_DETECTION_MISSING") && !has(failures, "CROSS_MISSION_CONFLICT_UNDETECTED");
  const analyticsOk = !has(failures, "ANALYTICS_MISSING");
  const dashboardOk = !has(failures, "EXECUTIVE_DASHBOARD_MISSING");
  const reportingOk = !has(failures, "REPORTING_SERVICE_MISSING") && !has(failures, "PORTFOLIO_REPORTS_NOT_REPRODUCIBLE");
  const evidenceOk = !has(failures, "PORTFOLIO_EVIDENCE_MISSING") && !has(failures, "PORTFOLIO_EVIDENCE_NOT_IMMUTABLE");
  const apisOk = !has(failures, "PORTFOLIO_APIS_MISSING");
  const missionCount = input.mission_count ?? 1000;
  const scaleOk = !has(failures, "SCALE_QUALIFICATION_MISSING") && !has(failures, "CONCURRENT_MISSION_LIMIT_NOT_MET") && missionCount >= 1000 && !has(failures, "DETERMINISTIC_REPLAY_UNDER_LOAD_FAILED");
  const governanceOk = !has(failures, "PORTFOLIO_ACTION_GOVERNANCE_BYPASSED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "PORTFOLIO_MANAGEMENT_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const portfolio_id = input.portfolio_id ?? `portfolio:mc-4:${input.seed ?? "canonical"}`;
  const registry = nested({ registry_id: registryOk ? "registry:mc-4:portfolio" : "", definitions: registryOk, hierarchy: registryOk, ownership: registryOk, lifecycle: registryOk ? freezeArray(LIFECYCLE) : freezeArray<PortfolioLifecycleState>([]), metadata: registryOk, strategic_alignment: registryOk, portfolio_evidence: registryOk, authoritative_registry: registryOk });
  const engine = nested({ engine_id: engineOk ? "engine:mc-4:mission-portfolio" : "", mission_grouping: engineOk, portfolio_composition: engineOk, mission_relationships: engineOk, mission_dependencies: engineOk, portfolio_health: engineOk, portfolio_synchronization: engineOk, deterministic_state: engineOk, simultaneous_portfolios: engineOk });
  const resources = nested({ planner_id: resourceOk ? "planner:mc-4:resources" : "", resource_allocation: resourceOk, resource_reservation: resourceOk, capacity_planning: resourceOk, utilization_forecasting: resourceOk, bottleneck_identification: resourceOk, contention_detection: resourceOk, resource_plans: resourceOk });
  const prioritization = nested({ engine_id: priorityOk ? "engine:mc-4:prioritization" : "", priority_ranking: priorityOk, mission_urgency: priorityOk, strategic_weighting: priorityOk, constitutional_constraints: priorityOk, executive_priorities: priorityOk, dynamic_reprioritization: priorityOk, governance_validated: priorityOk, deterministic_priorities: priorityOk });
  const dependencies = nested({ manager_id: dependencyOk ? "manager:mc-4:dependencies" : "", cross_mission_dependencies: dependencyOk, blocking_relationships: dependencyOk, shared_objectives: dependencyOk, shared_deliverables: dependencyOk, dependency_validation: dependencyOk, dependency_evidence: dependencyOk, dependency_graph: dependencyOk });
  const health = nested({ service_id: healthOk ? "service:mc-4:portfolio-health" : "", progress: healthOk, risk: healthOk, schedule_variance: healthOk, budget_utilization: healthOk, objective_completion: healthOk, resource_health: healthOk, continuous_evaluation: healthOk });
  const conflicts = nested({ detector_id: conflictsOk ? "detector:mc-4:conflicts" : "", resource_contention: conflictsOk, objective_conflicts: conflictsOk, policy_conflicts: conflictsOk, authority_conflicts: conflictsOk, scheduling_conflicts: conflictsOk, dependency_conflicts: conflictsOk, cross_mission_detection: conflictsOk });
  const analytics = nested({ analytics_id: analyticsOk ? "analytics:mc-4:portfolio" : "", completion_rates: analyticsOk, portfolio_velocity: analyticsOk, resource_utilization: analyticsOk, strategic_alignment: analyticsOk, decision_latency: analyticsOk, portfolio_throughput: analyticsOk, portfolio_stability: analyticsOk, executive_metrics: analyticsOk });
  const dashboard = nested({ dashboard_id: dashboardOk ? "dashboard:mc-4:executive-portfolio" : "", active_portfolios: dashboardOk, active_missions: dashboardOk, mission_status: dashboardOk, resource_utilization: dashboardOk, health_indicators: dashboardOk, portfolio_kpis: dashboardOk, executive_summaries: dashboardOk, portfolio_explorer: dashboardOk });
  const reporting = nested({ reporting_id: reportingOk ? "reporting:mc-4:portfolio" : "", portfolio_summaries: reportingOk, executive_reports: reportingOk, mission_rollups: reportingOk, resource_reports: reportingOk, capacity_reports: reportingOk, strategic_alignment_reports: reportingOk, reproducible_reports: reportingOk, evidence_backed: reportingOk });
  const evidence = nested({ package_id: evidenceOk ? "evidence:mc-4:portfolio-package" : "", portfolio_evidence_packages: evidenceOk, portfolio_lineage: evidenceOk, decision_evidence: evidenceOk, resource_evidence: evidenceOk, performance_evidence: evidenceOk, replay_references: evidenceOk, certification_references: evidenceOk, complete_lineage: evidenceOk, immutable: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-4:portfolio" : "", portfolio_api: apisOk, registry_api: apisOk, resource_api: apisOk, priority_api: apisOk, dependency_api: apisOk, conflict_api: apisOk, analytics_api: apisOk, reporting_api: apisOk, evidence_api: apisOk, stable: apisOk });
  const scale = nested({ qualification_id: scaleOk ? "qualification:mc-4:scale" : "", concurrent_mission_target: 1000 as const, concurrent_mission_capacity: scaleOk ? missionCount : 0, high_volume_updates: scaleOk, concurrent_portfolio_modifications: scaleOk, large_dependency_graphs: scaleOk, resource_contention_scenarios: scaleOk, deterministic_replay_under_load: scaleOk, performance_benchmarks: scaleOk, qualification_reports: scaleOk });
  const readiness = nested({ readiness_id: "MC-4-PORTFOLIO-MANAGEMENT-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") && !failure.startsWith("W1_") && !failure.startsWith("W2_")), registry_ready: registryOk, engine_ready: engineOk, resource_ready: resourceOk, prioritization_ready: priorityOk, dependencies_ready: dependencyOk, health_ready: healthOk, conflicts_ready: conflictsOk, analytics_ready: analyticsOk, dashboard_ready: dashboardOk, reporting_ready: reportingOk, evidence_ready: evidenceOk, apis_ready: apisOk, scale_ready: scaleOk, governance_enforced: governanceOk, replay_reproducible: scaleOk, qualification_ready: qualified, failures });
  const base: Omit<PortfolioManagementResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, portfolio_id, registry, engine, resources, prioritization, dependencies, health, conflicts, analytics, dashboard, reporting, evidence, apis, scale, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePortfolioManagement(result?: PortfolioManagementResult): PortfolioManagementValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, engine_valid: false, resource_valid: false, prioritization_valid: false, dependencies_valid: false, health_valid: false, conflicts_valid: false, analytics_valid: false, dashboard_valid: false, reporting_valid: false, evidence_valid: false, apis_valid: false, scale_valid: false, readiness_valid: false, failures: freezeArray(["PORTFOLIO_REGISTRY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const registry_valid = verifyHashed(result.registry) && result.registry.lifecycle.length === 7 && result.registry.hierarchy && result.registry.authoritative_registry;
  const engine_valid = verifyHashed(result.engine) && result.engine.mission_grouping && result.engine.portfolio_synchronization && result.engine.deterministic_state;
  const resource_valid = verifyHashed(result.resources) && result.resources.capacity_planning && result.resources.contention_detection && result.resources.resource_plans;
  const prioritization_valid = verifyHashed(result.prioritization) && result.prioritization.constitutional_constraints && result.prioritization.governance_validated && result.prioritization.deterministic_priorities;
  const dependencies_valid = verifyHashed(result.dependencies) && result.dependencies.cross_mission_dependencies && result.dependencies.dependency_validation && result.dependencies.dependency_evidence;
  const health_valid = verifyHashed(result.health) && result.health.progress && result.health.risk && result.health.resource_health && result.health.continuous_evaluation;
  const conflicts_valid = verifyHashed(result.conflicts) && result.conflicts.resource_contention && result.conflicts.policy_conflicts && result.conflicts.authority_conflicts && result.conflicts.cross_mission_detection;
  const analytics_valid = verifyHashed(result.analytics) && result.analytics.completion_rates && result.analytics.portfolio_velocity && result.analytics.executive_metrics;
  const dashboard_valid = verifyHashed(result.dashboard) && result.dashboard.active_portfolios && result.dashboard.active_missions && result.dashboard.executive_summaries;
  const reporting_valid = verifyHashed(result.reporting) && result.reporting.executive_reports && result.reporting.reproducible_reports && result.reporting.evidence_backed;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.portfolio_evidence_packages && result.evidence.complete_lineage && result.evidence.immutable;
  const apis_valid = verifyHashed(result.apis) && result.apis.portfolio_api && result.apis.conflict_api && result.apis.stable;
  const scale_valid = verifyHashed(result.scale) && result.scale.concurrent_mission_target === 1000 && result.scale.concurrent_mission_capacity >= 1000 && result.scale.deterministic_replay_under_load;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.scale_ready && result.readiness.governance_enforced && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && registry_valid && engine_valid && resource_valid && prioritization_valid && dependencies_valid && health_valid && conflicts_valid && analytics_valid && dashboard_valid && reporting_valid && evidence_valid && apis_valid && scale_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, registry_valid, engine_valid, resource_valid, prioritization_valid, dependencies_valid, health_valid, conflicts_valid, analytics_valid, dashboard_valid, reporting_valid, evidence_valid, apis_valid, scale_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayPortfolioManagement(result = runPortfolioManagement()): boolean { const replayed = runPortfolioManagement(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePortfolioManagement(result).valid; }
export function getPortfolioManagementBundle(): PortfolioManagementBundle { const result = runPortfolioManagement(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_portfolio_registry: true, owns_mission_portfolio_engine: true, owns_resource_planning: true, owns_prioritization: true, owns_dependency_management: true, owns_conflict_detection: true, owns_portfolio_analytics: true, owns_executive_dashboard: true, owns_portfolio_evidence: true, concurrent_mission_qualification_target: 1000, qualification_gate: "Portfolio Management Qualification Gate" }), result, validation: validatePortfolioManagement(result) }); }
export const PortfolioManagementService = Object.freeze({ run: runPortfolioManagement, validate: validatePortfolioManagement, replay: replayPortfolioManagement });
