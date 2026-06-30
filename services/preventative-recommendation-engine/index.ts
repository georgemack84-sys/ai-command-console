import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runRiskForecasting, validateRiskForecasting } from "@/services/risk-forecasting-engine";
import type { RiskForecastingReport, RiskForecastScenario, RiskSeverityLevel } from "@/types/risk-forecasting-engine";
import type {
  ContingencyOption,
  GovernanceAlternative,
  MitigationPlan,
  OperatorAdvisoryLevel,
  PreventativeRecommendation,
  PreventativeRecommendationEngineContract,
  PreventativeRecommendationFailure,
  PreventativeRecommendationInput,
  PreventativeRecommendationObservabilitySurface,
  PreventativeRecommendationPriority,
  PreventativeRecommendationReplayResult,
  PreventativeRecommendationReport,
  PreventativeRecommendationScenario,
  PreventativeRecommendationType,
  PreventativeRecommendationValidationResult,
  RecoveryPreparationPlan,
} from "@/types/preventative-recommendation-engine";

const NOW = "2026-07-12T12:00:00.000Z";
const EXPIRES = "2026-07-12T18:00:00.000Z";
const VERSION = "preventative-recommendation-engine/v8ALT.3.4" as const;
const TENANT_ID = "tenant:autonomy:primary";
const recommendationTypes: readonly PreventativeRecommendationType[] = Object.freeze(["PREVENTATIVE_ACTION", "MITIGATION_PLAN", "CONTINGENCY_OPTION", "RESOURCE_ADJUSTMENT", "DEPENDENCY_OPTIMIZATION", "EXECUTION_OPTIMIZATION", "GOVERNANCE_REVIEW", "OPERATOR_ADVISORY", "RECOVERY_PREPARATION", "SAFE_PAUSE", "ESCALATION_PREPARATION"]);
const priorityLevels: readonly PreventativeRecommendationPriority[] = Object.freeze(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]);
const advisoryLevels: readonly OperatorAdvisoryLevel[] = Object.freeze(["INFORMATIONAL", "LOW_PRIORITY", "MEDIUM_PRIORITY", "HIGH_PRIORITY", "CRITICAL"]);
const pipelineStates = Object.freeze(["FORECAST_RECEIVED", "RISK_ANALYSIS", "OPTION_GENERATION", "MITIGATION_PLANNING", "CONTINGENCY_GENERATION", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "EXPLAINABILITY_GENERATION", "REPLAY_VALIDATION", "READY_FOR_OPERATOR", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function toForecastScenario(scenario: PreventativeRecommendationScenario): RiskForecastScenario {
  const map: Partial<Record<PreventativeRecommendationScenario, RiskForecastScenario>> = {
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    GOVERNANCE_INVALID: "GOVERNANCE_INVALID",
    CONSTITUTIONAL_INVALID: "CONSTITUTIONAL_INVALID",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    CROSS_TENANT_RECOMMENDATION: "CROSS_TENANT_FORECAST",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
  };
  return map[scenario] ?? "BASELINE";
}

function scenarioFailures(scenario: PreventativeRecommendationScenario): readonly PreventativeRecommendationFailure[] {
  const map: Partial<Record<PreventativeRecommendationScenario, PreventativeRecommendationFailure>> = {
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    MISSING_FORECAST_REFERENCE: "FORECAST_REFERENCE_MISSING",
    MISSING_EXPLANATION: "EXPLANATION_INCOMPLETE",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    LINEAGE_BROKEN: "LINEAGE_INVALID",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
    GOVERNANCE_INVALID: "GOVERNANCE_INVALID",
    CONSTITUTIONAL_INVALID: "CONSTITUTIONAL_INVALID",
    AUTHORITY_INVALID: "AUTHORITY_INVALID",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    AUTONOMOUS_EXECUTION_ATTEMPT: "AUTONOMOUS_EXECUTION_DETECTED",
    AUTONOMOUS_MITIGATION_ATTEMPT: "AUTONOMOUS_MITIGATION_DETECTED",
    AUTONOMOUS_RECOVERY_ATTEMPT: "AUTONOMOUS_RECOVERY_DETECTED",
    GOVERNANCE_MODIFICATION_ATTEMPT: "GOVERNANCE_MODIFICATION_DETECTED",
    CONSTITUTIONAL_MODIFICATION_ATTEMPT: "CONSTITUTIONAL_MODIFICATION_DETECTED",
    AUTHORITY_ESCALATION_ATTEMPT: "AUTHORITY_ESCALATION_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    CROSS_TENANT_RECOMMENDATION: "CROSS_TENANT_RECOMMENDATION_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function priorityFor(severity: RiskSeverityLevel): PreventativeRecommendationPriority {
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "SEVERE") return "URGENT";
  if (severity === "HIGH") return "HIGH";
  if (severity === "MODERATE") return "MEDIUM";
  return "LOW";
}

function urgencyFor(priority: PreventativeRecommendationPriority): OperatorAdvisoryLevel {
  const map: Record<PreventativeRecommendationPriority, OperatorAdvisoryLevel> = { LOW: "LOW_PRIORITY", MEDIUM: "MEDIUM_PRIORITY", HIGH: "HIGH_PRIORITY", URGENT: "HIGH_PRIORITY", CRITICAL: "CRITICAL" };
  return map[priority];
}

function typeForForecast(index: number): PreventativeRecommendationType {
  return recommendationTypes[index % recommendationTypes.length];
}

function mitigationPlan(recommendationId: string, failures: readonly PreventativeRecommendationFailure[]): MitigationPlan {
  const base = {
    plan_id: id("PMIT", "preventative-mitigation-plan", recommendationId),
    objectives: freezeArray(["reduce forecasted risk", "preserve mission continuity", "maintain governance compliance"]),
    implementation_sequence: freezeArray(["operator review", "governance checkpoint", "controlled mitigation preparation", "validation before action"]),
    required_approvals: freezeArray(failures.includes("OPERATOR_APPROVAL_MISSING") ? [] : ["operator approval", "governance approval"]),
    governance_checkpoints: freezeArray(["policy compatibility", "authority boundary", "tenant isolation"]),
    validation_requirements: freezeArray(["replay validation", "integrity verification", "lineage verification"]),
    rollback_considerations: freezeArray(["rollback remains advisory until operator approval"]),
    expected_outcomes: freezeArray(["risk reduced without autonomous execution"]),
  };
  return Object.freeze({ ...base, plan_hash: hashValue("preventative-mitigation-plan", base) });
}

function contingencyOption(recommendationId: string): ContingencyOption {
  const base = {
    option_id: id("PCO", "preventative-contingency-option", recommendationId),
    alternate_execution_path: "operator-reviewed alternative execution path",
    degraded_operating_mode: "safe degraded operating mode prepared",
    dependency_workaround: "dependency workaround prepared for review",
    scheduling_alternative: "scheduler adjustment proposed",
    governance_escalation: "governance escalation path prepared",
    safe_pause_recommendation: "safe pause available if risk worsens",
  };
  return Object.freeze({ ...base, option_hash: hashValue("preventative-contingency-option", base) });
}

function governanceAlternative(recommendationId: string, failures: readonly PreventativeRecommendationFailure[]): GovernanceAlternative {
  const base = {
    alternative_id: id("PGA", "preventative-governance-alternative", recommendationId),
    policy_compliance: failures.includes("GOVERNANCE_INVALID") ? "FAIL" as const : "PASS" as const,
    authority_boundary: failures.includes("AUTHORITY_INVALID") || failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    constitutional_requirement: failures.includes("CONSTITUTIONAL_INVALID") || failures.includes("CONSTITUTIONAL_MODIFICATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    certification_constraint: "requires certified advisory workflow",
    tenant_isolation: failures.includes("TENANT_ISOLATION_INVALID") || failures.includes("CROSS_TENANT_RECOMMENDATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    policy_impact_summary: "no policy change permitted",
    approval_requirement: "operator approval required before any downstream action",
  };
  return Object.freeze({ ...base, alternative_hash: hashValue("preventative-governance-alternative", base) });
}

function recoveryPreparation(recommendationId: string): RecoveryPreparationPlan {
  const base = {
    preparation_id: id("PRP", "preventative-recovery-preparation", recommendationId),
    rollback_readiness: 0.82,
    restart_readiness: 0.76,
    recovery_checkpoints: freezeArray(["verify checkpoint integrity", "prepare recovery package"]),
    dependency_restoration: freezeArray(["map critical dependencies", "prepare restoration order"]),
    integrity_verification_steps: freezeArray(["verify hashes", "lock evidence"]),
    replay_validation_steps: freezeArray(["validate replay references", "compare deterministic output"]),
    escalation_preparation: freezeArray(["notify governance if risk escalates"]),
    operator_intervention_guidance: freezeArray(["review forecast", "approve action manually if needed"]),
    recovery_readiness_score: 0.79,
    recovery_sequence: freezeArray(["operator review", "governance validation", "manual approval", "controlled action by authorized operator"]),
    recovery_prerequisites: freezeArray(["approval", "integrity verification", "tenant validation"]),
    recovery_limitations: freezeArray(["no autonomous recovery", "no automatic rollback", "no restart without approval"]),
  };
  return Object.freeze({ ...base, preparation_hash: hashValue("preventative-recovery-preparation", base) });
}

function recommendation(reportId: string, forecast: RiskForecastingReport["forecasts"][number], index: number, failures: readonly PreventativeRecommendationFailure[]): PreventativeRecommendation {
  const recommendation_id = id("PREC", "preventative-recommendation", { reportId, forecast: forecast.forecast_id, index });
  const priority = priorityFor(forecast.severity);
  const mitigation_plan = mitigationPlan(recommendation_id, failures);
  const contingency_options = freezeArray([contingencyOption(recommendation_id)]);
  const governance_alternatives = freezeArray([governanceAlternative(recommendation_id, failures)]);
  const recovery_preparation = recoveryPreparation(recommendation_id);
  const evidence = failures.includes("EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : freezeArray(forecast.supporting_evidence.map((item) => item.evidence_id));
  const forecastRefs = failures.includes("FORECAST_REFERENCE_MISSING") ? freezeArray<string>([]) : freezeArray([forecast.forecast_id, forecast.forecast_hash]);
  const explanation = failures.includes("EXPLANATION_INCOMPLETE") ? freezeArray<string>([]) : freezeArray([
    "recommendation generated from deterministic risk forecast",
    "originating forecast and historical evidence preserved",
    "contributing risk factors and expected outcome explained",
    "estimated risk reduction calculated from forecast impact",
    "governance rationale and constitutional validation recorded",
    "assumptions and limitations documented",
    "implementation requires operator approval",
  ]);
  const base = {
    recommendation_id,
    forecast_id: forecast.forecast_id,
    mission_id: forecast.mission_id,
    execution_id: forecast.execution_id,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") || failures.includes("CROSS_TENANT_RECOMMENDATION_DETECTED") ? "external-tenant" : forecast.tenant_id,
    recommendation_type: typeForForecast(index),
    priority,
    severity: forecast.severity,
    urgency: urgencyFor(priority),
    forecast_summary: forecast.forecast_summary,
    recommended_action: `Review ${forecast.forecast_category.toLowerCase()} preventative action with operator approval.`,
    expected_benefit: "reduced operational risk before failure materializes",
    estimated_risk_reduction: Number(Math.min(0.78, forecast.impact_score * 0.55).toFixed(4)),
    mitigation_plan,
    contingency_options,
    governance_alternatives,
    recovery_preparation,
    operator_required: !failures.includes("OPERATOR_APPROVAL_MISSING"),
    approval_required: !failures.includes("OPERATOR_APPROVAL_MISSING"),
    supporting_evidence: evidence,
    forecast_references: forecastRefs,
    assumptions: freezeArray(["forecast inputs are immutable", "recommendations are advisory", "operator approval controls action"]),
    constraints: freezeArray(["no autonomous execution", "no governance mutation", "tenant isolated"]),
    governance_validation: failures.includes("GOVERNANCE_INVALID") || failures.includes("GOVERNANCE_MODIFICATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    constitutional_validation: failures.includes("CONSTITUTIONAL_INVALID") || failures.includes("CONSTITUTIONAL_MODIFICATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    authority_validation: failures.includes("AUTHORITY_INVALID") || failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "FAIL" as const : "PASS" as const,
    explanation,
    lineage_reference: failures.includes("LINEAGE_INVALID") ? "" : `lineage:${recommendation_id}`,
    replay_reference: failures.includes("REPLAY_INVALID") ? "" : `replay:${recommendation_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("preventative-recommendation-integrity", { recommendation_id, mitigation: mitigation_plan.plan_hash, recovery: recovery_preparation.preparation_hash }),
    created_at: NOW,
    expires_at: "2026-07-12T18:00:00.000Z",
    advisory_only: true as const,
    recommendation_executed: failures.includes("AUTONOMOUS_EXECUTION_DETECTED"),
    mitigation_executed: failures.includes("AUTONOMOUS_MITIGATION_DETECTED"),
    recovery_initiated: failures.includes("AUTONOMOUS_RECOVERY_DETECTED"),
    governance_modified: failures.includes("GOVERNANCE_MODIFICATION_DETECTED"),
    constitutional_modified: failures.includes("CONSTITUTIONAL_MODIFICATION_DETECTED"),
    authority_escalated: failures.includes("AUTHORITY_ESCALATION_DETECTED"),
  };
  return Object.freeze({ ...base, recommendation_hash: hashValue("preventative-recommendation", base) });
}

function toForecastScenarioSafe(scenario: PreventativeRecommendationScenario): RiskForecastScenario {
  return toForecastScenario(scenario);
}

export function computePreventativeRecommendationHash(report: Omit<PreventativeRecommendationReport, "report_hash"> | PreventativeRecommendationReport): string {
  const { report_hash: _hash, ...source } = report as PreventativeRecommendationReport;
  return hashValue("preventative-recommendation-report", source);
}

export function runPreventativeRecommendations(input: PreventativeRecommendationInput = {}): PreventativeRecommendationReport {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const forecastReport = input.forecast_report ?? runRiskForecasting({ scenario: toForecastScenarioSafe(scenario), tenant_id: input.tenant_id, mission_id: input.mission_id });
  const report_id = id("PRR", "preventative-recommendation-report", { scenario, forecast: forecastReport.report_hash });
  const recommendations = freezeArray(forecastReport.forecasts.map((forecast, index) => recommendation(report_id, forecast, index, failures)));
  const repositoryBase = {
    repository_id: id("PRREPO", "preventative-recommendation-repository", report_id),
    tenant_id: recommendations[0]?.tenant_id ?? forecastReport.tenant_id,
    recommendation_ids: freezeArray(recommendations.map((item) => item.recommendation_id)),
    mitigation_plans: freezeArray(recommendations.map((item) => item.mitigation_plan.plan_id)),
    contingency_options: freezeArray(recommendations.flatMap((item) => item.contingency_options.map((option) => option.option_id))),
    recovery_preparation_plans: freezeArray(recommendations.map((item) => item.recovery_preparation.preparation_id)),
    governance_alternatives: freezeArray(recommendations.flatMap((item) => item.governance_alternatives.map((alt) => alt.alternative_id))),
    operator_advisories: freezeArray(recommendations.filter((item) => item.recommendation_type === "OPERATOR_ADVISORY").map((item) => item.recommendation_id)),
    replay_references: freezeArray(recommendations.map((item) => item.replay_reference).filter(Boolean)),
    lineage_references: freezeArray(recommendations.map((item) => item.lineage_reference).filter(Boolean)),
    integrity_hashes: freezeArray(recommendations.map((item) => item.integrity_hash).filter(Boolean)),
    append_only: true as const,
  };
  const base = {
    report_id,
    tenant_id: repositoryBase.tenant_id,
    mission_id: forecastReport.mission_id,
    pipeline_state: failures.length ? "REJECTED" as const : "READY_FOR_OPERATOR" as const,
    recommendations,
    repository: Object.freeze({ ...repositoryBase, repository_hash: hashValue("preventative-recommendation-repository", repositoryBase) }),
    source_forecast_report: forecastReport,
    replay_reference: failures.includes("REPLAY_INVALID") ? "" : `replay:${report_id}`,
    lineage_reference: failures.includes("LINEAGE_INVALID") ? "" : `lineage:${report_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("preventative-recommendation-report-integrity", recommendations.map((item) => item.recommendation_hash)),
    advisory_only: true as const,
  };
  return Object.freeze({ ...base, report_hash: computePreventativeRecommendationHash(base as Omit<PreventativeRecommendationReport, "report_hash">) });
}

export function validatePreventativeRecommendations(report?: PreventativeRecommendationReport): PreventativeRecommendationValidationResult {
  if (!report) {
    const failures = freezeArray<PreventativeRecommendationFailure>(["RECOMMENDATION_SCHEMA_INVALID"]);
    const source = { report_id: null, valid: false, recommendation_contract_valid: false, recommendation_schema_valid: false, preventative_recommendations_generated: false, mitigation_plans_reproducible: false, contingency_options_reproducible: false, operator_advisories_deterministic: false, governance_alternatives_reproducible: false, recovery_preparation_deterministic: false, priority_reproducible: false, evidence_complete: false, forecast_references_preserved: false, governance_valid: false, constitutional_valid: false, authority_valid: false, explanations_complete: false, replay_valid: false, lineage_preserved: false, integrity_valid: false, operator_approval_required: false, advisory_only: false, tenant_isolated: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("preventative-recommendation-validation", source) });
  }
  const recommendation_contract_valid = report.recommendations.length > 0;
  const recommendation_schema_valid = report.recommendations.every((item) => item.recommendation_id && item.recommended_action && item.expected_benefit);
  const preventative_recommendations_generated = report.recommendations.some((item) => item.recommendation_type === "PREVENTATIVE_ACTION");
  const mitigation_plans_reproducible = report.recommendations.every((item) => item.mitigation_plan.plan_hash && item.mitigation_plan.implementation_sequence.length);
  const contingency_options_reproducible = report.recommendations.every((item) => item.contingency_options.length > 0);
  const operator_advisories_deterministic = report.recommendations.every((item) => item.urgency);
  const governance_alternatives_reproducible = report.recommendations.every((item) => item.governance_alternatives.length > 0);
  const recovery_preparation_deterministic = report.recommendations.every((item) => item.recovery_preparation.preparation_hash);
  const priority_reproducible = report.recommendations.every((item) => priorityLevels.includes(item.priority));
  const evidence_complete = report.recommendations.every((item) => item.supporting_evidence.length > 0);
  const forecast_references_preserved = report.recommendations.every((item) => item.forecast_references.length >= 2);
  const governance_valid = report.recommendations.every((item) => item.governance_validation === "PASS" && !item.governance_modified);
  const constitutional_valid = report.recommendations.every((item) => item.constitutional_validation === "PASS" && !item.constitutional_modified);
  const authority_valid = report.recommendations.every((item) => item.authority_validation === "PASS" && !item.authority_escalated);
  const explanations_complete = report.recommendations.every((item) => item.explanation.length >= 7);
  const replay_valid = Boolean(report.replay_reference) && report.recommendations.every((item) => item.replay_reference);
  const lineage_preserved = Boolean(report.lineage_reference) && report.recommendations.every((item) => item.lineage_reference);
  const integrity_valid = Boolean(report.integrity_hash) && report.repository.integrity_hashes.length === report.recommendations.length;
  const operator_approval_required = report.recommendations.every((item) => item.operator_required && item.approval_required);
  const advisory_only = report.advisory_only && report.recommendations.every((item) => item.advisory_only && !item.recommendation_executed && !item.mitigation_executed && !item.recovery_initiated);
  const tenant_isolated = (report.tenant_id === TENANT_ID || report.tenant_id.startsWith("tenant:")) && report.recommendations.every((item) => item.tenant_id === report.tenant_id);
  const immutable_hash_valid = computePreventativeRecommendationHash(report) === report.report_hash;
  const forecastValid = validateRiskForecasting(report.source_forecast_report).valid;
  const failures = unique([
    ...(!recommendation_contract_valid ? ["RECOMMENDATION_SCHEMA_INVALID" as const] : []),
    ...(!recommendation_schema_valid ? ["RECOMMENDATION_SCHEMA_INVALID" as const] : []),
    ...(!preventative_recommendations_generated ? ["RECOMMENDATION_GENERATION_INVALID" as const] : []),
    ...(!mitigation_plans_reproducible ? ["MITIGATION_PLAN_INVALID" as const] : []),
    ...(!contingency_options_reproducible ? ["CONTINGENCY_OPTIONS_INVALID" as const] : []),
    ...(!operator_advisories_deterministic ? ["OPERATOR_ADVISORY_INVALID" as const] : []),
    ...(!governance_alternatives_reproducible ? ["GOVERNANCE_ALTERNATIVES_INVALID" as const] : []),
    ...(!recovery_preparation_deterministic ? ["RECOVERY_PREPARATION_INVALID" as const] : []),
    ...(!priority_reproducible ? ["PRIORITY_NONDETERMINISTIC" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!forecast_references_preserved || !forecastValid ? ["FORECAST_REFERENCE_MISSING" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!explanations_complete ? ["EXPLANATION_INCOMPLETE" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!lineage_preserved ? ["LINEAGE_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!advisory_only ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(report.recommendations.some((item) => item.recommendation_executed) ? ["AUTONOMOUS_EXECUTION_DETECTED" as const] : []),
    ...(report.recommendations.some((item) => item.mitigation_executed) ? ["AUTONOMOUS_MITIGATION_DETECTED" as const] : []),
    ...(report.recommendations.some((item) => item.recovery_initiated) ? ["AUTONOMOUS_RECOVERY_DETECTED" as const] : []),
    ...(report.recommendations.some((item) => item.governance_modified) ? ["GOVERNANCE_MODIFICATION_DETECTED" as const] : []),
    ...(report.recommendations.some((item) => item.constitutional_modified) ? ["CONSTITUTIONAL_MODIFICATION_DETECTED" as const] : []),
    ...(report.recommendations.some((item) => item.authority_escalated) ? ["AUTHORITY_ESCALATION_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(report.recommendations.some((item) => item.tenant_id === "external-tenant") ? ["CROSS_TENANT_RECOMMENDATION_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { report_id: report.report_id, valid, recommendation_contract_valid, recommendation_schema_valid, preventative_recommendations_generated, mitigation_plans_reproducible, contingency_options_reproducible, operator_advisories_deterministic, governance_alternatives_reproducible, recovery_preparation_deterministic, priority_reproducible, evidence_complete, forecast_references_preserved, governance_valid, constitutional_valid, authority_valid, explanations_complete, replay_valid, lineage_preserved, integrity_valid, operator_approval_required, advisory_only, tenant_isolated, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("preventative-recommendation-validation", source) });
}

export function replayPreventativeRecommendations(report = runPreventativeRecommendations()): PreventativeRecommendationReplayResult {
  const reconstructed_hash = computePreventativeRecommendationHash(report);
  const source = { replay_reference: report.replay_reference, report_id: report.report_id, deterministic: reconstructed_hash === report.report_hash && Boolean(report.replay_reference), reconstructed_hash, original_hash: report.report_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("preventative-recommendation-replay", source) });
}

export function buildPreventativeRecommendationObservabilitySurface(report = runPreventativeRecommendations()): PreventativeRecommendationObservabilitySurface {
  const highest_priority = [...report.recommendations].sort((a, b) => priorityLevels.indexOf(b.priority) - priorityLevels.indexOf(a.priority))[0]?.priority ?? "LOW";
  const highest_urgency = [...report.recommendations].sort((a, b) => advisoryLevels.indexOf(b.urgency) - advisoryLevels.indexOf(a.urgency))[0]?.urgency ?? "INFORMATIONAL";
  return Object.freeze({ report_id: report.report_id, recommendation_count: report.recommendations.length, highest_priority, highest_urgency, tenant_id: report.tenant_id, advisory_only: true, report_hash: report.report_hash });
}

export function getPreventativeRecommendationEngineContract(): PreventativeRecommendationEngineContract {
  const report = runPreventativeRecommendations();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["advisory-only-operation", "deterministic-recommendation-generation", "explainable-recommendations", "replay-reproducibility", "governance-first-decision-support", "constitutional-compliance", "operator-supremacy", "fail-closed-behavior", "immutable-recommendation-history", "tenant-isolation"]),
      recommendation_types: recommendationTypes,
      priority_levels: priorityLevels,
      advisory_levels: advisoryLevels,
      pipeline_states: pipelineStates,
      advisory_only: true,
    }),
    report,
    validation: validatePreventativeRecommendations(report),
    replay: replayPreventativeRecommendations(report),
    observability: buildPreventativeRecommendationObservabilitySurface(report),
  });
}
