import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runOperationalIntelligence, validateOperationalIntelligence } from "@/services/operational-intelligence";
import { runOperatorDashboard, validateOperatorDashboard } from "@/services/operator-dashboard";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runProductionMonitoringPrimitives, validateProductionMonitoringPrimitives } from "@/services/production-monitoring-primitives";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import type { AlertSeverity, MonitoringExperienceBundle, MonitoringExperienceDecision, MonitoringExperienceFailure, MonitoringExperienceInput, MonitoringExperienceResult, MonitoringExperienceScenario, MonitoringExperienceValidation } from "@/types/monitoring-experience";

const VERSION = "monitoring-experience/mc-13b" as const;
const IDENTIFIER = "MonitoringExperience" as const;
const SEVERITIES = Object.freeze<AlertSeverity[]>(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const UPSTREAM_REFS = Object.freeze(["production-monitoring-primitives/mc-13a", "mission-management/mc-1", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "risk-assessment/mc-8"]);
const DOWNSTREAM_REFS = Object.freeze(["operator-dashboard/mc-10", "operational-intelligence/mc-12"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { monitoring: runProductionMonitoringPrimitives(), mission: runMissionManagement(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), risk: runRiskAssessment(), dashboard: runOperatorDashboard(), intelligence: runOperationalIntelligence() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly MonitoringExperienceFailure[], failure: MonitoringExperienceFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: MonitoringExperienceScenario): MonitoringExperienceFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly MonitoringExperienceFailure[], scenario?: MonitoringExperienceScenario): MonitoringExperienceDecision {
  const conditional = new Set<MonitoringExperienceFailure>(["ALERT_ENGINE_MISSING", "ALERT_REGISTRY_MISSING", "ALERT_CATEGORIZATION_MISSING", "SEVERITY_CLASSIFICATION_MISSING", "ALERT_HISTORY_MISSING", "ALERT_EVIDENCE_MISSING", "DUPLICATE_DETECTION_MISSING", "SLA_ENGINE_MISSING", "SLA_DASHBOARD_MISSING", "SLA_COMPLIANCE_RECORDS_MISSING", "SLA_VIOLATION_DETECTION_MISSING", "SLA_EVIDENCE_MISSING", "ANALYTICS_ENGINE_MISSING", "TREND_ANALYSIS_MISSING", "OPERATIONAL_METRICS_MISSING", "BOTTLENECK_IDENTIFICATION_MISSING", "PERFORMANCE_SUMMARIES_MISSING", "HEALTH_REPORTING_MISSING", "HEALTH_EVIDENCE_MISSING", "MISSION_HEALTH_MISSING", "PORTFOLIO_HEALTH_MISSING", "RUNTIME_HEALTH_MISSING", "ALERT_CENTER_MISSING", "ALERT_FILTERS_MISSING", "EVIDENCE_NAVIGATION_MISSING", "REPLAY_LINKAGE_MISSING", "LIVE_DASHBOARD_MISSING", "DASHBOARD_VIEWS_MISSING", "DASHBOARD_EVIDENCE_MISSING", "DASHBOARD_PERFORMANCE_FAILED", "MONITORING_EXPERIENCE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "MONITORING_EXPERIENCE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "MONITORING_EXPERIENCE_QUALIFIED";
}
function resultReplayHash(result: Omit<MonitoringExperienceResult, "replay_hash" | "integrity_hash">): string { return hash({ aggregator: result.aggregator.integrity_hash, alerts: result.alerts.integrity_hash, sla: result.sla.integrity_hash, analytics: result.analytics.integrity_hash, health: result.health.integrity_hash, alert_center: result.alert_center.integrity_hash, dashboard: result.dashboard.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<MonitoringExperienceResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runMonitoringExperience(input: MonitoringExperienceInput = {}): MonitoringExperienceResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<MonitoringExperienceFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_13A_MONITORING_PRIMITIVES_INVALID", !validateProductionMonitoringPrimitives(baselines.monitoring).valid],
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_8_RISK_ASSESSMENT_INVALID", !validateRiskAssessment(baselines.risk).valid],
    ["MC_10_OPERATOR_DASHBOARD_INVALID", !validateOperatorDashboard(baselines.dashboard).valid],
    ["MC_12_OPERATIONAL_INTELLIGENCE_INVALID", !validateOperationalIntelligence(baselines.intelligence).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const aggregatorOk = !has(failures, "MONITORING_AGGREGATOR_MISSING") && !has(failures, "MONITORING_PRIMITIVES_NOT_CONSUMED") && !has(failures, "SYNTHETIC_MONITORING_USED") && !has(failures, "UNQUALIFIED_MONITORING_DATA_USED");
  const alertsOk = !has(failures, "ALERT_ENGINE_MISSING") && !has(failures, "ALERT_REGISTRY_MISSING") && !has(failures, "ALERT_CATEGORIZATION_MISSING") && !has(failures, "SEVERITY_CLASSIFICATION_MISSING") && !has(failures, "ALERT_HISTORY_MISSING") && !has(failures, "ALERT_EVIDENCE_MISSING") && !has(failures, "DUPLICATE_DETECTION_MISSING") && !has(failures, "ADVISORY_ALERT_BEHAVIOR_MISSING");
  const slaOk = !has(failures, "SLA_ENGINE_MISSING") && !has(failures, "SLA_DASHBOARD_MISSING") && !has(failures, "SLA_COMPLIANCE_RECORDS_MISSING") && !has(failures, "SLA_VIOLATION_DETECTION_MISSING") && !has(failures, "SLA_EVIDENCE_MISSING");
  const analyticsOk = !has(failures, "ANALYTICS_ENGINE_MISSING") && !has(failures, "TREND_ANALYSIS_MISSING") && !has(failures, "OPERATIONAL_METRICS_MISSING") && !has(failures, "BOTTLENECK_IDENTIFICATION_MISSING") && !has(failures, "PERFORMANCE_SUMMARIES_MISSING");
  const healthOk = !has(failures, "HEALTH_REPORTING_MISSING") && !has(failures, "HEALTH_EVIDENCE_MISSING") && !has(failures, "MISSION_HEALTH_MISSING") && !has(failures, "PORTFOLIO_HEALTH_MISSING") && !has(failures, "RUNTIME_HEALTH_MISSING");
  const centerOk = !has(failures, "ALERT_CENTER_MISSING") && !has(failures, "ALERT_FILTERS_MISSING") && !has(failures, "EVIDENCE_NAVIGATION_MISSING") && !has(failures, "REPLAY_LINKAGE_MISSING");
  const dashboardOk = !has(failures, "LIVE_DASHBOARD_MISSING") && !has(failures, "DASHBOARD_VIEWS_MISSING") && !has(failures, "DASHBOARD_EVIDENCE_MISSING") && !has(failures, "DASHBOARD_PERFORMANCE_FAILED");
  const evidenceOk = alertsOk && slaOk && analyticsOk && healthOk && dashboardOk;
  const noExecution = !has(failures, "EXECUTION_ATTEMPTED") && !has(failures, "AUTOMATION_INVOKED");
  const noMutation = !has(failures, "MISSION_MUTATION_ATTEMPTED") && !has(failures, "RUNTIME_COMMAND_ATTEMPTED");
  const governanceOk = !has(failures, "GOVERNANCE_BYPASS_ATTEMPTED") && !has(failures, "ALERT_SELF_ACKNOWLEDGED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "MONITORING_EXPERIENCE_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.monitoring.tenant_id;
  const experience_id = input.experience_id ?? `monitoring-experience:mc-13b:${input.seed ?? "canonical"}`;
  const aggregator = nested({ aggregator_id: aggregatorOk ? "aggregator:mc-13b:monitoring" : "", consumes_mc13a_primitives: aggregatorOk, consumes_mission_lifecycle: aggregatorOk, consumes_portfolio_registry: aggregatorOk, consumes_operational_evidence: aggregatorOk, consumes_digital_twin: aggregatorOk, consumes_risk_assessment: aggregatorOk, qualified_data_only: aggregatorOk, deterministic_aggregation: aggregatorOk });
  const alerts = nested({ alert_registry_id: alertsOk ? "registry:mc-13b:alerts" : "", severities: alertsOk ? freezeArray(SEVERITIES) : freezeArray<AlertSeverity>([]), alert_generation: alertsOk, alert_categorization: alertsOk, severity_classification: alertsOk, alert_acknowledgement_tracking: alertsOk, escalation_recommendations: alertsOk, alert_history: alertsOk, alert_evidence: alertsOk, suppression_policies: alertsOk, duplicate_detection: alertsOk, advisory_only: alertsOk && governanceOk });
  const sla = nested({ sla_id: slaOk ? "sla:mc-13b:monitoring" : "", availability_monitoring: slaOk, response_time_tracking: slaOk, throughput_monitoring: slaOk, error_rate_monitoring: slaOk, compliance_evaluation: slaOk, trend_analysis: slaOk, violation_detection: slaOk, compliance_evidence: slaOk, dashboard: slaOk, reports: slaOk });
  const analytics = nested({ analytics_id: analyticsOk ? "analytics:mc-13b:operations" : "", trend_analysis: analyticsOk, capacity_utilization: analyticsOk, resource_efficiency: analyticsOk, mission_throughput: analyticsOk, performance_summaries: analyticsOk, bottleneck_identification: analyticsOk, historical_comparison: analyticsOk, operational_metrics: analyticsOk, evidence_backed: analyticsOk });
  const health = nested({ health_report_id: healthOk ? "health:mc-13b:reports" : "", mission_health: healthOk, runtime_health: healthOk, infrastructure_health: healthOk, service_health: healthOk, portfolio_health: healthOk, resource_health: healthOk, health_history: healthOk, health_evidence: healthOk });
  const alert_center = nested({ center_id: centerOk ? "center:mc-13b:alerts" : "", active_alerts: centerOk, alert_filters: centerOk, severity_grouping: centerOk, mission_grouping: centerOk, portfolio_grouping: centerOk, historical_alerts: centerOk, evidence_navigation: centerOk, replay_linkage: centerOk, alert_search: centerOk });
  const dashboard = nested({ dashboard_id: dashboardOk ? "dashboard:mc-13b:live-operations" : "", active_missions: dashboardOk, mission_health: dashboardOk, runtime_health: dashboardOk, resource_utilization: dashboardOk, alert_summaries: dashboardOk, sla_status: dashboardOk, digital_twin_synchronization: dashboardOk, risk_indicators: dashboardOk, portfolio_status: dashboardOk, service_availability: dashboardOk, dashboard_performance: dashboardOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-13b:experience" : "", alert_evidence: alertsOk, sla_evidence: slaOk, analytics_evidence: analyticsOk, health_evidence: healthOk, dashboard_evidence: dashboardOk, monitoring_timeline: evidenceOk, monitoring_reports: evidenceOk, deterministic_replay: evidenceOk, immutable: evidenceOk });
  const readiness = nested({ readiness_id: "MC-13B-MONITORING-EXPERIENCE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") || failure === "MC_10_OPERATOR_DASHBOARD_INVALID" || failure === "MC_12_OPERATIONAL_INTELLIGENCE_INVALID"), downstream_ready: !has(failures, "MC_10_OPERATOR_DASHBOARD_INVALID") && !has(failures, "MC_12_OPERATIONAL_INTELLIGENCE_INVALID"), aggregator_ready: aggregatorOk, alerts_ready: alertsOk, sla_ready: slaOk, analytics_ready: analyticsOk, health_ready: healthOk, alert_center_ready: centerOk, dashboard_ready: dashboardOk, evidence_ready: evidenceOk, deterministic_replay: evidenceOk, primitives_only: aggregatorOk, advisory_only_alerts: alertsOk && governanceOk, observational_only: noExecution && noMutation, no_execution: noExecution, no_runtime_mutation: noMutation, operator_authority_preserved: governanceOk, governance_preserved: governanceOk, qualification_ready: qualified && governanceOk, failures });
  const base: Omit<MonitoringExperienceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), downstream_refs: freezeArray(DOWNSTREAM_REFS), tenant_id, experience_id, aggregator, alerts, sla, analytics, health, alert_center, dashboard, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMonitoringExperience(result?: MonitoringExperienceResult): MonitoringExperienceValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, aggregator_valid: false, alerts_valid: false, sla_valid: false, analytics_valid: false, health_valid: false, alert_center_valid: false, dashboard_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["MONITORING_AGGREGATOR_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const aggregator_valid = verifyHashed(result.aggregator) && result.aggregator.consumes_mc13a_primitives && result.aggregator.qualified_data_only && result.aggregator.deterministic_aggregation;
  const alerts_valid = verifyHashed(result.alerts) && result.alerts.severities.length === 5 && result.alerts.alert_generation && result.alerts.severity_classification && result.alerts.alert_evidence && result.alerts.duplicate_detection && result.alerts.advisory_only;
  const sla_valid = verifyHashed(result.sla) && result.sla.availability_monitoring && result.sla.response_time_tracking && result.sla.compliance_evaluation && result.sla.violation_detection && result.sla.compliance_evidence;
  const analytics_valid = verifyHashed(result.analytics) && result.analytics.trend_analysis && result.analytics.capacity_utilization && result.analytics.bottleneck_identification && result.analytics.operational_metrics && result.analytics.evidence_backed;
  const health_valid = verifyHashed(result.health) && result.health.mission_health && result.health.runtime_health && result.health.portfolio_health && result.health.health_evidence;
  const alert_center_valid = verifyHashed(result.alert_center) && result.alert_center.active_alerts && result.alert_center.alert_filters && result.alert_center.evidence_navigation && result.alert_center.replay_linkage && result.alert_center.alert_search;
  const dashboard_valid = verifyHashed(result.dashboard) && result.dashboard.active_missions && result.dashboard.resource_utilization && result.dashboard.alert_summaries && result.dashboard.sla_status && result.dashboard.digital_twin_synchronization && result.dashboard.risk_indicators && result.dashboard.dashboard_performance;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.alert_evidence && result.evidence.sla_evidence && result.evidence.analytics_evidence && result.evidence.health_evidence && result.evidence.dashboard_evidence && result.evidence.deterministic_replay && result.evidence.immutable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.downstream_ready && result.readiness.deterministic_replay && result.readiness.primitives_only && result.readiness.advisory_only_alerts && result.readiness.observational_only && result.readiness.no_execution && result.readiness.no_runtime_mutation && result.readiness.operator_authority_preserved && result.readiness.governance_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && aggregator_valid && alerts_valid && sla_valid && analytics_valid && health_valid && alert_center_valid && dashboard_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, aggregator_valid, alerts_valid, sla_valid, analytics_valid, health_valid, alert_center_valid, dashboard_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayMonitoringExperience(result = runMonitoringExperience()): boolean { const replayed = runMonitoringExperience(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMonitoringExperience(result).valid; }
export function getMonitoringExperienceBundle(): MonitoringExperienceBundle { const result = runMonitoringExperience(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, capability_type: "Operational Visibility Layer", consumes_monitoring_primitives: true, advisory_alerts_only: true, observational_only: true, no_execution_authority: true, operator_approval_required: true, qualification_gate: "MC-13B Monitoring Experience Qualification Gate" }), result, validation: validateMonitoringExperience(result) }); }
export const MonitoringExperienceService = Object.freeze({ run: runMonitoringExperience, validate: validateMonitoringExperience, replay: replayMonitoringExperience });
