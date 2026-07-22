import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runInstitutionalMemory, validateInstitutionalMemory } from "@/services/institutional-memory";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runMissionRecommendationIntelligence, validateMissionRecommendationIntelligence } from "@/services/mission-recommendation-intelligence";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runOperatorDashboard, validateOperatorDashboard } from "@/services/operator-dashboard";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { IntelligenceCategory, OperationalIntelligenceBundle, OperationalIntelligenceDecision, OperationalIntelligenceFailure, OperationalIntelligenceInput, OperationalIntelligenceResult, OperationalIntelligenceScenario, OperationalIntelligenceValidation } from "@/types/operational-intelligence";

const VERSION = "operational-intelligence/mc-12" as const;
const IDENTIFIER = "OperationalIntelligence" as const;
const CATEGORIES = Object.freeze<IntelligenceCategory[]>(["MISSION", "PORTFOLIO", "ORGANIZATIONAL", "CAPABILITY", "RISK", "EXECUTIVE"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "operator-dashboard/mc-10", "institutional-memory/mc-11", "temporal-analytics/contract"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), risk: runRiskAssessment(), recommendations: runMissionRecommendationIntelligence(), dashboard: runOperatorDashboard(), memory: runInstitutionalMemory() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly OperationalIntelligenceFailure[], failure: OperationalIntelligenceFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: OperationalIntelligenceScenario): OperationalIntelligenceFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly OperationalIntelligenceFailure[], scenario?: OperationalIntelligenceScenario): OperationalIntelligenceDecision {
  const conditional = new Set<OperationalIntelligenceFailure>(["STRATEGIC_INTELLIGENCE_ENGINE_MISSING", "TREND_ANALYSIS_MISSING", "STRATEGIC_ASSESSMENT_MISSING", "OPERATIONAL_PATTERN_DETECTION_MISSING", "LONG_TERM_PERFORMANCE_ANALYSIS_MISSING", "ORGANIZATIONAL_HEALTH_ANALYSIS_MISSING", "MISSION_SUCCESS_ANALYSIS_MISSING", "INSIGHT_ENGINE_MISSING", "EMERGING_ISSUES_MISSING", "SUCCESS_PATTERNS_MISSING", "DEGRADATION_INDICATORS_MISSING", "BOTTLENECK_OBSERVATIONS_MISSING", "GOVERNANCE_OBSERVATIONS_MISSING", "EXECUTIVE_INTELLIGENCE_MISSING", "TREND_ENGINE_MISSING", "FORECAST_ENGINE_MISSING", "ORGANIZATIONAL_INTELLIGENCE_MISSING", "CAPABILITY_INTELLIGENCE_MISSING", "RISK_INTELLIGENCE_MISSING", "INTELLIGENCE_REGISTRY_MISSING", "INTELLIGENCE_REPORTS_MISSING", "EXECUTIVE_BRIEFINGS_MISSING", "INTELLIGENCE_EVIDENCE_MISSING", "OPERATIONAL_INTELLIGENCE_APIS_MISSING", "OPERATIONAL_INTELLIGENCE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "OPERATIONAL_INTELLIGENCE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "OPERATIONAL_INTELLIGENCE_QUALIFIED";
}
function resultReplayHash(result: Omit<OperationalIntelligenceResult, "replay_hash" | "integrity_hash">): string { return hash({ temporal: result.temporal.integrity_hash, strategic: result.strategic.integrity_hash, insights: result.insights.integrity_hash, executive: result.executive.integrity_hash, trends: result.trends.integrity_hash, forecast: result.forecast.integrity_hash, organization: result.organization.integrity_hash, registry: result.registry.integrity_hash, reports: result.reports.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<OperationalIntelligenceResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runOperationalIntelligence(input: OperationalIntelligenceInput = {}): OperationalIntelligenceResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<OperationalIntelligenceFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_8_RISK_ASSESSMENT_INVALID", !validateRiskAssessment(baselines.risk).valid],
    ["MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", !validateMissionRecommendationIntelligence(baselines.recommendations).valid],
    ["MC_10_OPERATOR_DASHBOARD_INVALID", !validateOperatorDashboard(baselines.dashboard).valid],
    ["MC_11_INSTITUTIONAL_MEMORY_INVALID", !validateInstitutionalMemory(baselines.memory).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const temporalOk = !has(failures, "TEMPORAL_ANALYTICS_CONTRACT_MISSING") && !has(failures, "TEMPORAL_ANALYTICS_NON_COMPLIANT");
  const strategicOk = !has(failures, "STRATEGIC_INTELLIGENCE_ENGINE_MISSING") && !has(failures, "TREND_ANALYSIS_MISSING") && !has(failures, "STRATEGIC_ASSESSMENT_MISSING") && !has(failures, "OPERATIONAL_PATTERN_DETECTION_MISSING") && !has(failures, "LONG_TERM_PERFORMANCE_ANALYSIS_MISSING") && !has(failures, "ORGANIZATIONAL_HEALTH_ANALYSIS_MISSING") && !has(failures, "MISSION_SUCCESS_ANALYSIS_MISSING") && !has(failures, "DETERMINISTIC_GENERATION_FAILED");
  const insightOk = !has(failures, "INSIGHT_ENGINE_MISSING") && !has(failures, "EMERGING_ISSUES_MISSING") && !has(failures, "SUCCESS_PATTERNS_MISSING") && !has(failures, "DEGRADATION_INDICATORS_MISSING") && !has(failures, "BOTTLENECK_OBSERVATIONS_MISSING") && !has(failures, "GOVERNANCE_OBSERVATIONS_MISSING");
  const executiveOk = !has(failures, "EXECUTIVE_INTELLIGENCE_MISSING") && !has(failures, "EXECUTIVE_REPORTS_INCONSISTENT") && !has(failures, "EXECUTIVE_BRIEFINGS_MISSING");
  const trendOk = !has(failures, "TREND_ENGINE_MISSING") && !has(failures, "TREND_DETECTION_INACCURATE");
  const forecastOk = !has(failures, "FORECAST_ENGINE_MISSING") && !has(failures, "FORECASTS_NOT_REPRODUCIBLE") && !has(failures, "FORECASTS_NOT_ADVISORY");
  const organizationOk = !has(failures, "ORGANIZATIONAL_INTELLIGENCE_MISSING");
  const registryOk = !has(failures, "INTELLIGENCE_REGISTRY_MISSING");
  const reportsOk = !has(failures, "INTELLIGENCE_REPORTS_MISSING") && !has(failures, "PORTFOLIO_INTELLIGENCE_INVALID") && !has(failures, "MISSION_INTELLIGENCE_INVALID") && !has(failures, "CAPABILITY_INTELLIGENCE_MISSING") && !has(failures, "RISK_INTELLIGENCE_MISSING");
  const evidenceOk = !has(failures, "INTELLIGENCE_EVIDENCE_MISSING") && !has(failures, "INTELLIGENCE_WITHOUT_EVIDENCE") && !has(failures, "EVIDENCE_TRACEABILITY_INCOMPLETE") && !has(failures, "REPLAY_TRACEABILITY_MISSING") && !has(failures, "INSTITUTIONAL_MEMORY_INTEGRATION_MISSING");
  const apisOk = !has(failures, "OPERATIONAL_INTELLIGENCE_APIS_MISSING");
  const noExecution = !has(failures, "OPERATION_EXECUTION_ATTEMPTED") && !has(failures, "MISSION_APPROVAL_ATTEMPTED");
  const noMutation = !has(failures, "OPERATIONAL_STATE_MUTATION_ATTEMPTED") && !has(failures, "MISSION_DATA_MUTATION_ATTEMPTED");
  const governanceOk = !has(failures, "GOVERNANCE_OVERRIDE_ATTEMPTED") && !has(failures, "AUTHORITY_VALIDATION_BYPASSED") && !has(failures, "POLICY_EVALUATION_BYPASSED") && !has(failures, "SAFETY_VALIDATION_BYPASSED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "OPERATIONAL_INTELLIGENCE_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.portfolio.tenant_id;
  const intelligence_id = input.intelligence_id ?? `operational-intelligence:mc-12:${input.seed ?? "canonical"}`;
  const temporal = nested({ contract_id: temporalOk ? "contract:mc-12:temporal-analytics" : "", historical_evidence: temporalOk, operational_metrics: temporalOk, trend_inputs: temporalOk, portfolio_history: temporalOk, deterministic_inputs: temporalOk, evidence_backed: temporalOk });
  const strategic = nested({ engine_id: strategicOk ? "engine:mc-12:strategic-intelligence" : "", trend_analysis: strategicOk, strategic_assessment: strategicOk, operational_pattern_detection: strategicOk, long_term_performance_analysis: strategicOk, organizational_health_analysis: strategicOk, mission_success_analysis: strategicOk, deterministic_generation: strategicOk });
  const insights = nested({ insight_id: insightOk ? "insights:mc-12:operational" : "", emerging_issues: insightOk, recurring_success_patterns: insightOk, degradation_indicators: insightOk, operational_bottlenecks: insightOk, governance_observations: insightOk, evidence_backed_observations: insightOk });
  const executive = nested({ executive_id: executiveOk ? "executive:mc-12:intelligence" : "", executive_dashboards: executiveOk, executive_summaries: executiveOk, organizational_health_reports: executiveOk, strategic_status_reports: executiveOk, executive_briefings: executiveOk, consistent_reports: executiveOk });
  const trends = nested({ trend_id: trendOk ? "trends:mc-12:intelligence" : "", mission_trends: trendOk, portfolio_trends: trendOk, resource_trends: trendOk, capability_trends: trendOk, operational_trends: trendOk, governance_trends: trendOk, accurate_detection: trendOk });
  const forecast = nested({ forecast_id: forecastOk ? "forecast:mc-12:strategic" : "", temporal_analytics: forecastOk, historical_evidence: forecastOk, institutional_memory: forecastOk, portfolio_history: forecastOk, evidence_backed_projections: forecastOk, advisory_forecasts: forecastOk, reproducible_forecasts: forecastOk });
  const organization = nested({ organization_id: organizationOk ? "organization:mc-12:intelligence" : "", organizational_maturity: organizationOk, operational_readiness: organizationOk, execution_efficiency: organizationOk, governance_effectiveness: organizationOk, policy_compliance: organizationOk, operational_stability: organizationOk });
  const registry = nested({ registry_id: registryOk ? "registry:mc-12:intelligence" : "", categories: registryOk ? freezeArray(CATEGORIES) : freezeArray<IntelligenceCategory>([]), intelligence_reports: registryOk, operational_insights: registryOk, executive_intelligence: registryOk, trend_reports: registryOk, strategic_forecasts: registryOk, executive_briefings: registryOk, governed_registry: registryOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-12:intelligence" : "", mission_intelligence: reportsOk, portfolio_intelligence: reportsOk, organizational_intelligence: reportsOk, capability_intelligence: reportsOk, risk_intelligence: reportsOk, executive_intelligence: reportsOk, strategic_trend_reports: reportsOk, qualification_report: reportsOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-12:intelligence" : "", originating_evidence: evidenceOk, supporting_reports: evidenceOk, temporal_references: evidenceOk, confidence_indicators: evidenceOk, traceability: evidenceOk, provenance: evidenceOk, replay_references: evidenceOk, institutional_memory_references: evidenceOk, immutable: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-12:operational-intelligence" : "", strategic_api: apisOk, insight_api: apisOk, executive_api: apisOk, trend_api: apisOk, forecast_api: apisOk, organizational_api: apisOk, registry_api: apisOk, report_api: apisOk, evidence_api: apisOk, stable: apisOk });
  const readiness = nested({ readiness_id: "MC-12-OPERATIONAL-INTELLIGENCE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), temporal_ready: temporalOk, strategic_ready: strategicOk, insight_ready: insightOk, executive_ready: executiveOk, trend_ready: trendOk, forecast_ready: forecastOk, organizational_ready: organizationOk, registry_ready: registryOk, reports_ready: reportsOk, evidence_ready: evidenceOk, apis_ready: apisOk, deterministic: temporalOk && strategicOk, advisory_only: forecastOk, no_execution: noExecution, no_state_mutation: noMutation, governance_preserved: governanceOk, temporal_analytics_compliant: temporalOk, replay_traceable: evidenceOk, institutional_memory_integrated: evidenceOk && forecastOk, qualification_ready: qualified, failures });
  const base: Omit<OperationalIntelligenceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, intelligence_id, temporal, strategic, insights, executive, trends, forecast, organization, registry, reports, evidence, apis, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperationalIntelligence(result?: OperationalIntelligenceResult): OperationalIntelligenceValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, temporal_valid: false, strategic_valid: false, insights_valid: false, executive_valid: false, trends_valid: false, forecast_valid: false, organization_valid: false, registry_valid: false, reports_valid: false, evidence_valid: false, apis_valid: false, readiness_valid: false, failures: freezeArray(["STRATEGIC_INTELLIGENCE_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const temporal_valid = verifyHashed(result.temporal) && result.temporal.deterministic_inputs && result.temporal.evidence_backed;
  const strategic_valid = verifyHashed(result.strategic) && result.strategic.trend_analysis && result.strategic.strategic_assessment && result.strategic.deterministic_generation;
  const insights_valid = verifyHashed(result.insights) && result.insights.emerging_issues && result.insights.operational_bottlenecks && result.insights.evidence_backed_observations;
  const executive_valid = verifyHashed(result.executive) && result.executive.executive_summaries && result.executive.executive_briefings && result.executive.consistent_reports;
  const trends_valid = verifyHashed(result.trends) && result.trends.mission_trends && result.trends.portfolio_trends && result.trends.governance_trends && result.trends.accurate_detection;
  const forecast_valid = verifyHashed(result.forecast) && result.forecast.temporal_analytics && result.forecast.institutional_memory && result.forecast.advisory_forecasts && result.forecast.reproducible_forecasts;
  const organization_valid = verifyHashed(result.organization) && result.organization.organizational_maturity && result.organization.governance_effectiveness && result.organization.operational_stability;
  const registry_valid = verifyHashed(result.registry) && result.registry.categories.length === 6 && result.registry.governed_registry;
  const reports_valid = verifyHashed(result.reports) && result.reports.mission_intelligence && result.reports.portfolio_intelligence && result.reports.executive_intelligence && result.reports.qualification_report;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.originating_evidence && result.evidence.temporal_references && result.evidence.replay_references && result.evidence.institutional_memory_references && result.evidence.immutable;
  const apis_valid = verifyHashed(result.apis) && result.apis.strategic_api && result.apis.executive_api && result.apis.forecast_api && result.apis.evidence_api && result.apis.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.deterministic && result.readiness.advisory_only && result.readiness.no_execution && result.readiness.no_state_mutation && result.readiness.governance_preserved && result.readiness.temporal_analytics_compliant && result.readiness.replay_traceable && result.readiness.institutional_memory_integrated && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && temporal_valid && strategic_valid && insights_valid && executive_valid && trends_valid && forecast_valid && organization_valid && registry_valid && reports_valid && evidence_valid && apis_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, temporal_valid, strategic_valid, insights_valid, executive_valid, trends_valid, forecast_valid, organization_valid, registry_valid, reports_valid, evidence_valid, apis_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayOperationalIntelligence(result = runOperationalIntelligence()): boolean { const replayed = runOperationalIntelligence(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationalIntelligence(result).valid; }
export function getOperationalIntelligenceBundle(): OperationalIntelligenceBundle { const result = runOperationalIntelligence(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_strategic_intelligence_engine: true, owns_operational_insight_engine: true, owns_executive_intelligence_service: true, owns_trend_forecast_and_organizational_intelligence: true, consumes_temporal_analytics_contract: true, evidence_backed_executive_insight_required: true, advisory_only: true, no_operational_execution: true, qualification_gate: "Operational Intelligence Qualification Gate" }), result, validation: validateOperationalIntelligence(result) }); }
export const OperationalIntelligenceService = Object.freeze({ run: runOperationalIntelligence, validate: validateOperationalIntelligence, replay: replayOperationalIntelligence });
