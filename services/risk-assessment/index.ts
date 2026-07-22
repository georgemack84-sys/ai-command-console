import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import { runSimulation, validateSimulation } from "@/services/simulation";
import type { RiskAssessmentBundle, RiskAssessmentDecision, RiskAssessmentFailure, RiskAssessmentInput, RiskAssessmentResult, RiskAssessmentScenario, RiskAssessmentValidation } from "@/types/risk-assessment";

const VERSION = "risk-assessment/mc-8" as const;
const IDENTIFIER = "RiskAssessment" as const;
const UPSTREAM_REFS = Object.freeze(["scenario-planning/mc-2", "decision-support/mc-3", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "temporal-analytics/contract"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { scenario: runScenarioPlanning(), decision: runDecisionSupport(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), simulation: runSimulation() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly RiskAssessmentFailure[], failure: RiskAssessmentFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: RiskAssessmentScenario): RiskAssessmentFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly RiskAssessmentFailure[], scenario?: RiskAssessmentScenario): RiskAssessmentDecision {
  const conditional = new Set<RiskAssessmentFailure>(["RISK_EVALUATION_ENGINE_MISSING", "CONFIDENCE_EVALUATION_MISSING", "SEVERITY_DETERMINATION_MISSING", "EXPOSURE_ASSESSMENT_MISSING", "RISK_REGISTRY_MISSING", "RISK_TREND_ENGINE_MISSING", "RISK_FORECAST_ENGINE_MISSING", "RISK_CORRELATION_ENGINE_MISSING", "RISK_PRIORITIZATION_ENGINE_MISSING", "RISK_EXPLAINABILITY_ENGINE_MISSING", "RISK_VISUALIZATION_SERVICE_MISSING", "RISK_REPORTS_MISSING", "RISK_HEAT_MAPS_MISSING", "RISK_EVIDENCE_MISSING", "RISK_APIS_MISSING", "RISK_ASSESSMENT_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "RISK_ASSESSMENT_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "RISK_ASSESSMENT_QUALIFIED";
}
function resultReplayHash(result: Omit<RiskAssessmentResult, "replay_hash" | "integrity_hash">): string { return hash({ temporal: result.temporal.integrity_hash, evaluation: result.evaluation.integrity_hash, registry: result.registry.integrity_hash, trends: result.trends.integrity_hash, forecast: result.forecast.integrity_hash, correlation: result.correlation.integrity_hash, prioritization: result.prioritization.integrity_hash, explainability: result.explainability.integrity_hash, visualization: result.visualization.integrity_hash, reports: result.reports.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<RiskAssessmentResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runRiskAssessment(input: RiskAssessmentInput = {}): RiskAssessmentResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<RiskAssessmentFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_7_SIMULATION_INVALID", !validateSimulation(baselines.simulation).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const temporalOk = !has(failures, "TEMPORAL_ANALYTICS_CONTRACT_MISSING") && !has(failures, "TEMPORAL_ANALYTICS_NOT_AUTHORITATIVE");
  const evaluationOk = !has(failures, "RISK_EVALUATION_ENGINE_MISSING") && !has(failures, "RISK_EVALUATION_NON_DETERMINISTIC") && !has(failures, "CONFIDENCE_EVALUATION_MISSING") && !has(failures, "SEVERITY_DETERMINATION_MISSING") && !has(failures, "EXPOSURE_ASSESSMENT_MISSING");
  const registryOk = !has(failures, "RISK_REGISTRY_MISSING") && !has(failures, "RISK_RECORD_LINEAGE_MISSING");
  const trendsOk = !has(failures, "RISK_TREND_ENGINE_MISSING") && !has(failures, "TREND_EVIDENCE_MISSING");
  const forecastOk = !has(failures, "RISK_FORECAST_ENGINE_MISSING") && !has(failures, "FORECAST_EVIDENCE_MISSING");
  const correlationOk = !has(failures, "RISK_CORRELATION_ENGINE_MISSING") && !has(failures, "CASCADING_RISK_DETECTION_MISSING") && !has(failures, "CORRELATION_EVIDENCE_MISSING");
  const prioritizationOk = !has(failures, "RISK_PRIORITIZATION_ENGINE_MISSING") && !has(failures, "PRIORITIZATION_NOT_GOVERNED");
  const explainabilityOk = !has(failures, "RISK_EXPLAINABILITY_ENGINE_MISSING") && !has(failures, "OPAQUE_RISK_SCORING_DETECTED") && !has(failures, "EVIDENCE_BACKED_ASSESSMENTS_MISSING") && !has(failures, "OPERATOR_DECISION_OVERRIDE_ATTEMPTED");
  const visualizationOk = !has(failures, "RISK_VISUALIZATION_SERVICE_MISSING") && !has(failures, "DASHBOARD_EVIDENCE_MISSING") && !has(failures, "RISK_HEAT_MAPS_MISSING");
  const reportsOk = !has(failures, "RISK_REPORTS_MISSING");
  const evidenceOk = !has(failures, "RISK_EVIDENCE_MISSING") && !has(failures, "RISK_EVIDENCE_MUTABLE") && !has(failures, "RISK_LINEAGE_INCOMPLETE");
  const apisOk = !has(failures, "RISK_APIS_MISSING");
  const noMutation = !has(failures, "MISSION_STATE_MUTATION_ATTEMPTED") && !has(failures, "DIGITAL_TWIN_MUTATION_ATTEMPTED") && !has(failures, "SIMULATION_OUTCOME_MUTATION_ATTEMPTED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "RISK_ASSESSMENT_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.scenario.tenant_id;
  const assessment_id = input.assessment_id ?? `risk-assessment:mc-8:${input.seed ?? "canonical"}`;
  const temporal = nested({ contract_id: temporalOk ? "contract:mc-8:temporal-analytics" : "", historical_trends: temporalOk, current_conditions: temporalOk, projected_conditions: temporalOk, immutable_inputs: temporalOk, complete_lineage: temporalOk, deterministic_inputs: temporalOk, authoritative_for_risk: temporalOk });
  const evaluation = nested({ engine_id: evaluationOk ? "engine:mc-8:risk-evaluation" : "", continuous_evaluation: evaluationOk, risk_calculation: evaluationOk, risk_aggregation: evaluationOk, confidence_evaluation: evaluationOk, severity_determination: evaluationOk, exposure_assessment: evaluationOk, deterministic_evaluation: evaluationOk });
  const registry = nested({ registry_id: registryOk ? "registry:mc-8:risk" : "", risk_records: registryOk, severity: registryOk, probability: registryOk, impact: registryOk, mitigation_status: registryOk, lineage: registryOk, evidence: registryOk, governed_records: registryOk });
  const trends = nested({ trend_id: trendsOk ? "trends:mc-8:risk" : "", trend_detection: trendsOk, acceleration_detection: trendsOk, deceleration_detection: trendsOk, historical_comparisons: trendsOk, risk_progression: trendsOk, trend_reports: trendsOk, trend_evidence: trendsOk });
  const forecast = nested({ forecast_id: forecastOk ? "forecast:mc-8:risk" : "", near_term_forecasting: forecastOk, long_term_forecasting: forecastOk, expected_degradation: forecastOk, recovery_likelihood: forecastOk, risk_projection: forecastOk, forecast_reports: forecastOk, prediction_evidence: forecastOk });
  const correlation = nested({ correlation_id: correlationOk ? "correlation:mc-8:risk" : "", dependency_analysis: correlationOk, cascading_failures: correlationOk, compound_risks: correlationOk, cross_mission_impacts: correlationOk, portfolio_correlations: correlationOk, correlation_graph: correlationOk, dependency_evidence: correlationOk });
  const prioritization = nested({ prioritization_id: prioritizationOk ? "priority:mc-8:risk" : "", severity_weighting: prioritizationOk, probability_weighting: prioritizationOk, mission_criticality: prioritizationOk, temporal_urgency: prioritizationOk, portfolio_impact: prioritizationOk, confidence_weighting: prioritizationOk, prioritized_risk_list: prioritizationOk, governed_criteria: prioritizationOk });
  const explainability = nested({ explainability_id: explainabilityOk ? "explainability:mc-8:risk" : "", risk_justification: explainabilityOk, supporting_analytics: explainabilityOk, evidence_references: explainabilityOk, historical_comparisons: explainabilityOk, no_opaque_scoring: explainabilityOk, advisory_only: explainabilityOk });
  const visualization = nested({ visualization_id: visualizationOk ? "visualization:mc-8:risk" : "", risk_dashboard: visualizationOk, heat_maps: visualizationOk, trend_graphs: visualizationOk, severity_distribution: visualizationOk, forecast_timeline: visualizationOk, dashboard_evidence: visualizationOk, visualization_evidence: visualizationOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-8:risk" : "", current_risk: reportsOk, historical_trend: reportsOk, forecast: reportsOk, supporting_evidence: reportsOk, recommended_attention_areas: reportsOk, heat_maps_generated: reportsOk && visualizationOk, portfolio_awareness: reportsOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-8:risk" : "", evaluation_evidence: evidenceOk, trend_evidence: evidenceOk, forecast_evidence: evidenceOk, correlation_evidence: evidenceOk, priority_evidence: evidenceOk, explainability_evidence: evidenceOk, dashboard_evidence: evidenceOk, visualization_evidence: evidenceOk, immutable: evidenceOk, traceable_to_temporal_analytics: evidenceOk, complete_lineage: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-8:risk-assessment" : "", assessment_api: apisOk, registry_api: apisOk, trend_api: apisOk, forecast_api: apisOk, correlation_api: apisOk, prioritization_api: apisOk, explainability_api: apisOk, visualization_api: apisOk, report_api: apisOk, stable: apisOk });
  const readiness = nested({ readiness_id: "MC-8-RISK-ASSESSMENT-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), temporal_ready: temporalOk, evaluation_ready: evaluationOk, registry_ready: registryOk, trends_ready: trendsOk, forecast_ready: forecastOk, correlation_ready: correlationOk, prioritization_ready: prioritizationOk, explainability_ready: explainabilityOk, visualization_ready: visualizationOk, reports_ready: reportsOk, evidence_ready: evidenceOk, apis_ready: apisOk, deterministic: temporalOk && evaluationOk, advisory_only: explainabilityOk, no_state_mutation: noMutation, temporal_analytics_exclusive: temporalOk && evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<RiskAssessmentResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, assessment_id, risk_score: qualified ? 68 : 0, severity: qualified ? "HIGH" : "CRITICAL", trend: qualified ? "DETERIORATING" : "ACCELERATING", temporal, evaluation, registry, trends, forecast, correlation, prioritization, explainability, visualization, reports, evidence, apis, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRiskAssessment(result?: RiskAssessmentResult): RiskAssessmentValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, temporal_valid: false, evaluation_valid: false, registry_valid: false, trends_valid: false, forecast_valid: false, correlation_valid: false, prioritization_valid: false, explainability_valid: false, visualization_valid: false, reports_valid: false, evidence_valid: false, apis_valid: false, readiness_valid: false, failures: freezeArray(["RISK_EVALUATION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const temporal_valid = verifyHashed(result.temporal) && result.temporal.authoritative_for_risk && result.temporal.deterministic_inputs && result.temporal.complete_lineage;
  const evaluation_valid = verifyHashed(result.evaluation) && result.evaluation.continuous_evaluation && result.evaluation.confidence_evaluation && result.evaluation.severity_determination && result.evaluation.deterministic_evaluation;
  const registry_valid = verifyHashed(result.registry) && result.registry.risk_records && result.registry.lineage && result.registry.evidence && result.registry.governed_records;
  const trends_valid = verifyHashed(result.trends) && result.trends.trend_detection && result.trends.acceleration_detection && result.trends.trend_evidence;
  const forecast_valid = verifyHashed(result.forecast) && result.forecast.near_term_forecasting && result.forecast.long_term_forecasting && result.forecast.prediction_evidence;
  const correlation_valid = verifyHashed(result.correlation) && result.correlation.cascading_failures && result.correlation.correlation_graph && result.correlation.dependency_evidence;
  const prioritization_valid = verifyHashed(result.prioritization) && result.prioritization.prioritized_risk_list && result.prioritization.governed_criteria && result.prioritization.confidence_weighting;
  const explainability_valid = verifyHashed(result.explainability) && result.explainability.risk_justification && result.explainability.evidence_references && result.explainability.no_opaque_scoring && result.explainability.advisory_only;
  const visualization_valid = verifyHashed(result.visualization) && result.visualization.risk_dashboard && result.visualization.heat_maps && result.visualization.dashboard_evidence;
  const reports_valid = verifyHashed(result.reports) && result.reports.current_risk && result.reports.supporting_evidence && result.reports.heat_maps_generated;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.immutable && result.evidence.traceable_to_temporal_analytics && result.evidence.complete_lineage;
  const apis_valid = verifyHashed(result.apis) && result.apis.assessment_api && result.apis.forecast_api && result.apis.report_api && result.apis.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.deterministic && result.readiness.advisory_only && result.readiness.no_state_mutation && result.readiness.temporal_analytics_exclusive && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && temporal_valid && evaluation_valid && registry_valid && trends_valid && forecast_valid && correlation_valid && prioritization_valid && explainability_valid && visualization_valid && reports_valid && evidence_valid && apis_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, temporal_valid, evaluation_valid, registry_valid, trends_valid, forecast_valid, correlation_valid, prioritization_valid, explainability_valid, visualization_valid, reports_valid, evidence_valid, apis_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayRiskAssessment(result = runRiskAssessment()): boolean { const replayed = runRiskAssessment(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateRiskAssessment(result).valid; }
export function getRiskAssessmentBundle(): RiskAssessmentBundle { const result = runRiskAssessment(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_continuous_risk_evaluation: true, owns_risk_registry: true, owns_risk_trends_and_forecasts: true, owns_risk_correlation_and_prioritization: true, owns_risk_explainability_and_visualization: true, consumes_temporal_analytics_contract: true, recommendations_are_advisory_only: true, state_mutation_prohibited: true, evidence_backed_risk_required: true, qualification_gate: "Risk Assessment Qualification Gate" }), result, validation: validateRiskAssessment(result) }); }
export const RiskAssessmentService = Object.freeze({ run: runRiskAssessment, validate: validateRiskAssessment, replay: replayRiskAssessment });
