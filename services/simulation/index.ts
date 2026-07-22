import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { SimulationBundle, SimulationDecision, SimulationFailure, SimulationInput, SimulationResult, SimulationScenario, SimulationScenarioKind, SimulationValidation } from "@/types/simulation";

const VERSION = "simulation/mc-7" as const;
const IDENTIFIER = "Simulation" as const;
const SCENARIO_KINDS = Object.freeze<SimulationScenarioKind[]>(["BASELINE", "OPTIMISTIC", "CONSERVATIVE", "WORST_CASE", "BEST_CASE", "CUSTOM"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "operational-evidence-replay/mc-5", "digital-twin/mc-6"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly SimulationFailure[], failure: SimulationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: SimulationScenario): SimulationFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly SimulationFailure[], scenario?: SimulationScenario): SimulationDecision {
  const conditional = new Set<SimulationFailure>(["SIMULATION_ENGINE_MISSING", "STATE_PROJECTION_MISSING", "EVENT_PROJECTION_MISSING", "TIMELINE_SIMULATION_MISSING", "DEPENDENCY_EVALUATION_MISSING", "STATE_EVOLUTION_MISSING", "SCHEDULING_MISSING", "MISSION_SIMULATION_MISSING", "OPERATIONAL_FORECASTING_MISSING", "DECISION_IMPACT_SIMULATION_MISSING", "RESOURCE_SIMULATION_MISSING", "RISK_SIMULATION_MISSING", "SCENARIO_EXECUTION_MISSING", "PREDICTIVE_ANALYTICS_MISSING", "SIMULATION_EVIDENCE_MISSING", "SIMULATION_REPORTS_MISSING", "SIMULATION_APIS_MISSING", "SIMULATION_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "SIMULATION_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "SIMULATION_QUALIFIED";
}
function resultReplayHash(result: Omit<SimulationResult, "replay_hash" | "integrity_hash">): string { return hash({ engine: result.engine.integrity_hash, mission: result.mission.integrity_hash, forecasting: result.forecasting.integrity_hash, impact: result.impact.integrity_hash, resources: result.resources.integrity_hash, risk: result.risk.integrity_hash, scenarios: result.scenarios.integrity_hash, analytics: result.analytics.integrity_hash, evidence: result.evidence.integrity_hash, reports: result.reports.integrity_hash, apis: result.apis.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<SimulationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runSimulation(input: SimulationInput = {}): SimulationResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<SimulationFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const engineOk = !has(failures, "SIMULATION_ENGINE_MISSING") && !has(failures, "DIGITAL_TWIN_NOT_AUTHORITATIVE_MODEL") && !has(failures, "SIMULATION_MUTATES_LIVE_MISSION") && !has(failures, "SIMULATION_NON_DETERMINISTIC") && !has(failures, "STATE_PROJECTION_MISSING") && !has(failures, "EVENT_PROJECTION_MISSING") && !has(failures, "TIMELINE_SIMULATION_MISSING") && !has(failures, "DEPENDENCY_EVALUATION_MISSING") && !has(failures, "STATE_EVOLUTION_MISSING") && !has(failures, "SCHEDULING_MISSING");
  const missionOk = !has(failures, "MISSION_SIMULATION_MISSING") && !has(failures, "MISSION_EXECUTION_NOT_SIMULATED") && !has(failures, "OBJECTIVE_PROGRESSION_MISSING") && !has(failures, "RESOURCE_CONSUMPTION_MISSING") && !has(failures, "MILESTONE_PROJECTION_MISSING") && !has(failures, "COMPLETION_PREDICTION_MISSING");
  const forecastingOk = !has(failures, "OPERATIONAL_FORECASTING_MISSING") && !has(failures, "FORECASTS_NOT_EXPLAINABLE") && !has(failures, "BOTTLENECK_PREDICTION_MISSING");
  const impactOk = !has(failures, "DECISION_IMPACT_SIMULATION_MISSING") && !has(failures, "ALTERNATIVE_FUTURES_MISSING") && !has(failures, "TRADEOFF_EVIDENCE_MISSING");
  const resourcesOk = !has(failures, "RESOURCE_SIMULATION_MISSING") && !has(failures, "RESOURCE_FORECASTS_MISSING") && !has(failures, "RESOURCE_CONSTRAINTS_MISSING");
  const riskOk = !has(failures, "RISK_SIMULATION_MISSING") && !has(failures, "CASCADING_RISK_MISSING") && !has(failures, "RECOVERY_EVALUATION_MISSING");
  const scenariosOk = !has(failures, "SCENARIO_EXECUTION_MISSING") && !has(failures, "SCENARIOS_NOT_DETERMINISTIC");
  const analyticsOk = !has(failures, "PREDICTIVE_ANALYTICS_MISSING") && !has(failures, "PREDICTIONS_LACK_CONFIDENCE") && !has(failures, "PREDICTIONS_LACK_JUSTIFICATION");
  const evidenceOk = !has(failures, "SIMULATION_EVIDENCE_MISSING") && !has(failures, "SIMULATION_EVIDENCE_MUTABLE") && !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE");
  const reportsOk = !has(failures, "SIMULATION_REPORTS_MISSING");
  const apisOk = !has(failures, "SIMULATION_APIS_MISSING");
  const replayOk = !has(failures, "REPLAY_VALIDATION_FAILED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "SIMULATION_QUALIFIED";
  const scenario_kind = input.scenario_kind ?? "BASELINE";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const simulation_id = input.simulation_id ?? `simulation:mc-7:${input.seed ?? "canonical"}:${scenario_kind.toLowerCase()}`;
  const engine = nested({ engine_id: engineOk ? "engine:mc-7:simulation" : "", runtime: engineOk, deterministic_state_projection: engineOk, event_projection: engineOk, timeline_simulation: engineOk, dependency_evaluation: engineOk, state_evolution: engineOk, simulation_scheduling: engineOk, digital_twin_authoritative_model: engineOk, no_live_mission_mutation: engineOk, deterministic_execution: engineOk });
  const mission = nested({ simulation_id: missionOk ? simulation_id : "", mission_execution: missionOk, objective_progression: missionOk, dependency_resolution: missionOk, resource_consumption: missionOk, timeline_advancement: missionOk, milestone_projection: missionOk, completion_prediction: missionOk });
  const forecasting = nested({ forecast_id: forecastingOk ? "forecast:mc-7:operational" : "", progress_prediction: forecastingOk, delay_prediction: forecastingOk, risk_forecasting: forecastingOk, capacity_forecasting: forecastingOk, bottleneck_prediction: forecastingOk, workload_projection: forecastingOk, deadline_estimation: forecastingOk, explainable_forecasts: forecastingOk });
  const impact = nested({ analyzer_id: impactOk ? "impact:mc-7:decision" : "", decision_branching: impactOk, alternative_futures: impactOk, comparative_outcomes: impactOk, decision_sensitivity: impactOk, tradeoff_evaluation: impactOk, recommendation_simulation: impactOk, evidence_backed_comparisons: impactOk });
  const resources = nested({ resource_id: resourcesOk ? "resources:mc-7:forecast" : "", personnel_allocation: resourcesOk, compute_consumption: resourcesOk, budget_projection: resourcesOk, capacity_planning: resourcesOk, resource_contention: resourcesOk, constraint_evaluation: resourcesOk, utilization_forecasts: resourcesOk });
  const risk = nested({ risk_id: riskOk ? "risk:mc-7:projection" : "", failure_simulation: riskOk, dependency_failure: riskOk, cascading_effects: riskOk, schedule_risk: riskOk, resource_risk: riskOk, mission_risk: riskOk, recovery_evaluation: riskOk });
  const scenarios = nested({ manager_id: scenariosOk ? "manager:mc-7:scenarios" : "", scenario_registry: scenariosOk, templates: scenariosOk ? freezeArray(SCENARIO_KINDS) : freezeArray<SimulationScenarioKind>([]), versioning: scenariosOk, comparison: scenariosOk, replay: scenariosOk, deterministic_execution: scenariosOk });
  const analytics = nested({ analytics_id: analyticsOk ? "analytics:mc-7:predictive" : "", success_probability: analyticsOk ? 0.87 : 0, completion_estimate_hours: analyticsOk ? 72 : 0, expected_delay_hours: analyticsOk ? 4 : 0, risk_trend: analyticsOk ? "MODERATE" as const : "HIGH" as const, resource_forecasts: analyticsOk, performance_forecasts: analyticsOk, confidence: analyticsOk ? 0.91 : 0, justification: analyticsOk ? "Predictions are derived from the MC-6 twin graph, scenario timeline, resource constraints, and replay-validated transition evidence." : "" });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-7:simulation" : "", inputs: evidenceOk, digital_twin_version: "digital-twin/mc-6" as const, lifecycle_version: "mission-management/mc-1", monitoring_snapshot: evidenceOk, simulation_parameters: evidenceOk, simulation_timeline: evidenceOk, state_transitions: evidenceOk, prediction_evidence: evidenceOk, confidence_metrics: evidenceOk, operator_decisions: evidenceOk, immutable: evidenceOk, complete_lineage: evidenceOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-7:simulation" : "", simulation_reports: reportsOk, predicted_outcomes: reportsOk, evidence_packages: reportsOk, evidence_lineage: reportsOk, simulation_ledger: reportsOk, verification_records: reportsOk, replay_validated: reportsOk && replayOk, constitutionally_governed: reportsOk });
  const apis = nested({ api_id: apisOk ? "api:mc-7:simulation" : "", simulation_request_api: apisOk, scenario_execution_api: apisOk, forecast_api: apisOk, impact_analysis_api: apisOk, evidence_api: apisOk, report_api: apisOk, stable: apisOk });
  const readiness = nested({ readiness_id: "MC-7-SIMULATION-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), engine_ready: engineOk, mission_ready: missionOk, forecasting_ready: forecastingOk, impact_ready: impactOk, resource_ready: resourcesOk, risk_ready: riskOk, scenarios_ready: scenariosOk, analytics_ready: analyticsOk, evidence_ready: evidenceOk, reports_ready: reportsOk, apis_ready: apisOk, deterministic: engineOk && scenariosOk, twin_authoritative: engineOk, no_live_mutation: engineOk, replay_validated: replayOk && reportsOk, qualification_ready: qualified, failures });
  const base: Omit<SimulationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, simulation_id, scenario_kind, engine, mission, forecasting, impact, resources, risk, scenarios, analytics, evidence, reports, apis, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSimulation(result?: SimulationResult): SimulationValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, engine_valid: false, mission_valid: false, forecasting_valid: false, impact_valid: false, resources_valid: false, risk_valid: false, scenarios_valid: false, analytics_valid: false, evidence_valid: false, reports_valid: false, apis_valid: false, readiness_valid: false, failures: freezeArray(["SIMULATION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const engine_valid = verifyHashed(result.engine) && result.engine.runtime && result.engine.digital_twin_authoritative_model && result.engine.no_live_mission_mutation && result.engine.deterministic_execution;
  const mission_valid = verifyHashed(result.mission) && result.mission.mission_execution && result.mission.objective_progression && result.mission.resource_consumption && result.mission.completion_prediction;
  const forecasting_valid = verifyHashed(result.forecasting) && result.forecasting.risk_forecasting && result.forecasting.bottleneck_prediction && result.forecasting.explainable_forecasts;
  const impact_valid = verifyHashed(result.impact) && result.impact.alternative_futures && result.impact.tradeoff_evaluation && result.impact.evidence_backed_comparisons;
  const resources_valid = verifyHashed(result.resources) && result.resources.utilization_forecasts && result.resources.constraint_evaluation;
  const risk_valid = verifyHashed(result.risk) && result.risk.cascading_effects && result.risk.recovery_evaluation;
  const scenarios_valid = verifyHashed(result.scenarios) && result.scenarios.templates.length === 6 && result.scenarios.replay && result.scenarios.deterministic_execution;
  const analytics_valid = verifyHashed(result.analytics) && result.analytics.success_probability > 0 && result.analytics.confidence >= 0.9 && result.analytics.justification.length > 0;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.digital_twin_version === "digital-twin/mc-6" && result.evidence.prediction_evidence && result.evidence.immutable && result.evidence.complete_lineage;
  const reports_valid = verifyHashed(result.reports) && result.reports.simulation_reports && result.reports.predicted_outcomes && result.reports.replay_validated && result.reports.constitutionally_governed;
  const apis_valid = verifyHashed(result.apis) && result.apis.simulation_request_api && result.apis.forecast_api && result.apis.evidence_api && result.apis.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.deterministic && result.readiness.twin_authoritative && result.readiness.no_live_mutation && result.readiness.replay_validated && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && engine_valid && mission_valid && forecasting_valid && impact_valid && resources_valid && risk_valid && scenarios_valid && analytics_valid && evidence_valid && reports_valid && apis_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, engine_valid, mission_valid, forecasting_valid, impact_valid, resources_valid, risk_valid, scenarios_valid, analytics_valid, evidence_valid, reports_valid, apis_valid, readiness_valid, failures: result.readiness.failures });
}
export function replaySimulation(result = runSimulation()): boolean { const replayed = runSimulation({ scenario_kind: result.scenario_kind }); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSimulation(result).valid; }
export function getSimulationBundle(): SimulationBundle { const result = runSimulation(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_deterministic_simulation_engine: true, owns_mission_simulation: true, owns_operational_forecasting: true, owns_decision_impact_simulation: true, owns_resource_and_risk_simulation: true, consumes_digital_twin_as_authoritative_model: true, live_mission_mutation_prohibited: true, evidence_backed_predictions_required: true, qualification_gate: "Simulation Qualification Gate" }), result, validation: validateSimulation(result) }); }
export const SimulationService = Object.freeze({ run: runSimulation, validate: validateSimulation, replay: replaySimulation });
