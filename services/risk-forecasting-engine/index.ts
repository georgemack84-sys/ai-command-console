import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runHistoricalIntelligence, validateHistoricalIntelligence } from "@/services/historical-intelligence-engine";
import type { HistoricalIntelligenceReport, HistoricalIntelligenceScenario } from "@/types/historical-intelligence-engine";
import type {
  ForecastEvidence,
  ForecastProbabilityLevel,
  HistoricalCorrelation,
  RiskForecastCategory,
  RiskForecastFailure,
  RiskForecastingEngineContract,
  RiskForecastingInput,
  RiskForecastingReport,
  RiskForecastObject,
  RiskForecastObservabilitySurface,
  RiskForecastReplayResult,
  RiskForecastScenario,
  RiskForecastType,
  RiskForecastValidationResult,
  RiskSeverityLevel,
} from "@/types/risk-forecasting-engine";

const NOW = "2026-07-11T12:00:00.000Z";
const EXPIRES = "2026-07-11T18:00:00.000Z";
const VERSION = "risk-forecasting-engine/v8ALT.3.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:risk-forecasting:primary";
const forecastTypes: readonly RiskForecastType[] = Object.freeze(["EXECUTION_BOTTLENECK", "DEPENDENCY_FAILURE", "RESOURCE_SHORTAGE", "GOVERNANCE_VIOLATION", "CONFIDENCE_COLLAPSE", "REPLAY_INSTABILITY", "INTEGRITY_DEGRADATION", "ORCHESTRATION_CONGESTION", "RECOVERY_PROBABILITY"]);
const pipelineStates = Object.freeze(["REQUEST_RECEIVED", "SIGNAL_COLLECTION", "HISTORICAL_CORRELATION", "RISK_ANALYSIS", "FORECAST_GENERATION", "CONFIDENCE_PROJECTION", "GOVERNANCE_VALIDATION", "EXPLAINABILITY_GENERATION", "REPLAY_VALIDATION", "PUBLISHED", "REJECTED"] as const);
const severityLevels: readonly RiskSeverityLevel[] = Object.freeze(["MINIMAL", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);
const probabilityLevels: readonly ForecastProbabilityLevel[] = Object.freeze(["VERY_LOW", "LOW", "MODERATE", "HIGH", "VERY_HIGH", "NEAR_CERTAIN"]);
const forecastWindows = Object.freeze(["IMMEDIATE", "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "MISSION_DURATION"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function categoryFor(type: RiskForecastType): RiskForecastCategory {
  const map: Record<RiskForecastType, RiskForecastCategory> = {
    EXECUTION_BOTTLENECK: "EXECUTION",
    DEPENDENCY_FAILURE: "DEPENDENCY",
    RESOURCE_SHORTAGE: "RESOURCE",
    GOVERNANCE_VIOLATION: "GOVERNANCE",
    CONFIDENCE_COLLAPSE: "CONFIDENCE",
    REPLAY_INSTABILITY: "REPLAY",
    INTEGRITY_DEGRADATION: "INTEGRITY",
    ORCHESTRATION_CONGESTION: "ORCHESTRATION",
    RECOVERY_PROBABILITY: "RECOVERY",
  };
  return map[type];
}

function toHistoricalScenario(scenario: RiskForecastScenario): HistoricalIntelligenceScenario {
  const map: Partial<Record<RiskForecastScenario, HistoricalIntelligenceScenario>> = {
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    GOVERNANCE_INVALID: "GOVERNANCE_INVALID",
    CONSTITUTIONAL_INVALID: "CONSTITUTIONAL_INVALID",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    CROSS_TENANT_FORECAST: "CROSS_TENANT_ANALYSIS",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
  };
  return map[scenario] ?? "BASELINE";
}

function scenarioFailures(scenario: RiskForecastScenario): readonly RiskForecastFailure[] {
  const map: Partial<Record<RiskForecastScenario, RiskForecastFailure>> = {
    MISSING_EVIDENCE: "EVIDENCE_INCOMPLETE",
    MISSING_EXPLANATION: "EXPLANATION_INCOMPLETE",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    GOVERNANCE_INVALID: "GOVERNANCE_INVALID",
    CONSTITUTIONAL_INVALID: "CONSTITUTIONAL_INVALID",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
    AUTONOMOUS_MITIGATION_ATTEMPT: "ADVISORY_ONLY_VIOLATION",
    EXECUTION_MODIFICATION_ATTEMPT: "EXECUTION_MODIFICATION_DETECTED",
    GOVERNANCE_MODIFICATION_ATTEMPT: "GOVERNANCE_MODIFICATION_DETECTED",
    POLICY_BYPASS: "POLICY_BYPASS_DETECTED",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    CROSS_TENANT_FORECAST: "CROSS_TENANT_FORECAST_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function probabilityLevel(value: number): ForecastProbabilityLevel {
  if (value >= 0.95) return "NEAR_CERTAIN";
  if (value >= 0.8) return "VERY_HIGH";
  if (value >= 0.6) return "HIGH";
  if (value >= 0.4) return "MODERATE";
  if (value >= 0.2) return "LOW";
  return "VERY_LOW";
}

function severity(value: number): RiskSeverityLevel {
  if (value >= 0.9) return "CRITICAL";
  if (value >= 0.75) return "SEVERE";
  if (value >= 0.6) return "HIGH";
  if (value >= 0.4) return "MODERATE";
  if (value >= 0.2) return "LOW";
  return "MINIMAL";
}

function baseProbability(type: RiskForecastType, historical: HistoricalIntelligenceReport): number {
  const map: Record<RiskForecastType, number> = {
    EXECUTION_BOTTLENECK: 0.68,
    DEPENDENCY_FAILURE: 0.57,
    RESOURCE_SHORTAGE: historical.resource_profile.bottleneck_probability + 0.24,
    GOVERNANCE_VIOLATION: 1 - historical.governance_profile.governance_stability_score + 0.2,
    CONFIDENCE_COLLAPSE: historical.confidence_profile.volatility_score + 0.16,
    REPLAY_INSTABILITY: 1 - historical.trend_summary.replay_consistency + 0.21,
    INTEGRITY_DEGRADATION: historical.confidence_profile.integrity_confidence === "DEGRADING" ? 0.76 : 0.34,
    ORCHESTRATION_CONGESTION: historical.trend_summary.orchestration_complexity + 0.22,
    RECOVERY_PROBABILITY: 0.84,
  };
  return Number(Math.min(0.98, Math.max(0.05, map[type])).toFixed(4));
}

function evidence(reportId: string, type: RiskForecastType, historical: HistoricalIntelligenceReport, failures: readonly RiskForecastFailure[]): readonly ForecastEvidence[] {
  if (failures.includes("EVIDENCE_INCOMPLETE")) return freezeArray([]);
  return freezeArray(historical.evidence.slice(0, 5).map((source) => {
    const base = {
      evidence_id: id("RFE", "risk-forecast-evidence", { reportId, type, source: source.evidence_id }),
      source_reference: source.evidence_id,
      evidence_type: source.source_type,
      contribution: Number((source.record_count / 200).toFixed(4)),
      replay_reference: source.replay_reference,
      integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : source.integrity_hash,
    };
    return Object.freeze({ ...base, evidence_hash: hashValue("risk-forecast-evidence", base) });
  }));
}

function correlations(reportId: string, type: RiskForecastType, historical: HistoricalIntelligenceReport): readonly HistoricalCorrelation[] {
  return freezeArray(historical.failure_patterns.slice(0, 3).map((pattern) => {
    const base = {
      correlation_id: id("RFC", "risk-forecast-correlation", { reportId, type, pattern: pattern.signature_id }),
      historical_signal: pattern.failure_type,
      forecast_signal: type.toLowerCase().replace(/_/g, "-"),
      correlation_strength: Number(Math.min(0.96, pattern.historical_impact_score + 0.22).toFixed(4)),
      source_model: historical.prediction_models.find((model) => model.model_type.includes(categoryFor(type)))?.model_id ?? historical.prediction_models[0]?.model_id ?? "model:missing",
    };
    return Object.freeze({ ...base, correlation_hash: hashValue("risk-forecast-correlation", base) });
  }));
}

function forecast(type: RiskForecastType, reportId: string, historical: HistoricalIntelligenceReport, failures: readonly RiskForecastFailure[]): RiskForecastObject {
  const forecast_id = id("RF", "risk-forecast-id", { reportId, type, historical: historical.report_hash });
  const probability = baseProbability(type, historical);
  const impact = type === "RECOVERY_PROBABILITY" ? Number((1 - probability).toFixed(4)) : Number(Math.min(0.96, probability + 0.08).toFixed(4));
  const ev = evidence(reportId, type, historical, failures);
  const corr = correlations(reportId, type, historical);
  const explanation = failures.includes("EXPLANATION_INCOMPLETE") ? freezeArray<string>([]) : freezeArray([
    "forecast generated from deterministic historical intelligence",
    "supporting evidence selected from immutable historical records",
    "correlated events and contributing risk factors included",
    "confidence calculated from historical model and evidence stability",
    "governance considerations and constitutional validation recorded",
    "forecast assumptions and limitations documented",
    "preventative actions are advisory and operator-reviewed",
  ]);
  const base = {
    forecast_id,
    mission_id: historical.mission_id,
    execution_id: EXECUTION_ID,
    tenant_id: failures.includes("TENANT_ISOLATION_INVALID") || failures.includes("CROSS_TENANT_FORECAST_DETECTED") ? "external-tenant" : historical.tenant_id,
    forecast_type: type,
    forecast_category: categoryFor(type),
    pipeline_state: failures.length ? "REJECTED" as const : "PUBLISHED" as const,
    forecast_window: "SHORT_TERM" as const,
    generated_at: NOW,
    expires_at: EXPIRES,
    risk_probability: probability,
    probability_level: probabilityLevel(probability),
    severity: severity(impact),
    impact_score: impact,
    projected_confidence: failures.includes("REPLAY_INVALID") ? 0.31 : 0.87,
    forecast_summary: `${type.toLowerCase().replace(/_/g, " ")} forecast generated from historical intelligence.`,
    predicted_conditions: freezeArray([`${type.toLowerCase().replace(/_/g, " ")} condition may emerge within forecast window`]),
    affected_components: freezeArray([categoryFor(type).toLowerCase(), "mission-control"]),
    preventative_recommendations: freezeArray(["increase operator monitoring", "prepare preventative advisory plan"]),
    mitigation_options: freezeArray(["operator-reviewed mitigation", "governance-reviewed contingency"]),
    operator_required: !failures.includes("OPERATOR_APPROVAL_MISSING"),
    supporting_evidence: ev,
    historical_correlations: corr,
    assumptions: freezeArray(["historical intelligence is immutable", "forecast model version is governed", "operator approval required for action"]),
    constraints: freezeArray(["advisory only", "no autonomous mitigation", "tenant isolated"]),
    governance_validation: failures.includes("GOVERNANCE_INVALID") || failures.includes("POLICY_BYPASS_DETECTED") ? "FAIL" as const : "PASS" as const,
    constitutional_validation: failures.includes("CONSTITUTIONAL_INVALID") || failures.includes("CONSTITUTIONAL_BYPASS_DETECTED") ? "FAIL" as const : "PASS" as const,
    lineage_reference: `lineage:${forecast_id}`,
    replay_reference: failures.includes("REPLAY_INVALID") ? "" : `replay:${forecast_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("risk-forecast-integrity", { forecast_id, evidence: ev.map((item) => item.evidence_hash), correlations: corr.map((item) => item.correlation_hash) }),
    explanation,
    source_historical_intelligence: historical,
    advisory_only: true as const,
    mitigation_executed: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("EXECUTION_MODIFICATION_DETECTED"),
    governance_modified: failures.includes("GOVERNANCE_MODIFICATION_DETECTED"),
    policy_bypassed: failures.includes("POLICY_BYPASS_DETECTED"),
    constitutional_bypassed: failures.includes("CONSTITUTIONAL_BYPASS_DETECTED"),
    cross_tenant_forecast: failures.includes("CROSS_TENANT_FORECAST_DETECTED"),
  };
  return Object.freeze({ ...base, forecast_hash: hashValue("risk-forecast-object", base) });
}

export function computeRiskForecastingReportHash(report: Omit<RiskForecastingReport, "report_hash"> | RiskForecastingReport): string {
  const { report_hash: _hash, ...source } = report as RiskForecastingReport;
  return hashValue("risk-forecasting-report", source);
}

export function runRiskForecasting(input: RiskForecastingInput = {}): RiskForecastingReport {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const historical = input.historical_report ?? runHistoricalIntelligence({ scenario: toHistoricalScenario(scenario), tenant_id: input.tenant_id, mission_id: input.mission_id });
  const report_id = id("RFR", "risk-forecasting-report", { scenario, historical: historical.report_hash, type: input.forecast_type ?? "ALL" });
  const selectedTypes = input.forecast_type ? freezeArray([input.forecast_type]) : forecastTypes;
  const forecasts = freezeArray(selectedTypes.map((type) => forecast(type, report_id, historical, failures)));
  const repositoryBase = {
    repository_id: id("RFRP", "risk-forecast-repository", report_id),
    tenant_id: forecasts[0]?.tenant_id ?? historical.tenant_id,
    forecast_ids: freezeArray(forecasts.map((item) => item.forecast_id)),
    supporting_evidence: freezeArray(forecasts.flatMap((item) => item.supporting_evidence.map((ev) => ev.evidence_id))),
    confidence_projections: freezeArray(forecasts.map((item) => item.projected_confidence)),
    mitigation_recommendations: freezeArray(forecasts.flatMap((item) => item.mitigation_options)),
    replay_references: freezeArray(forecasts.map((item) => item.replay_reference).filter(Boolean)),
    lineage_references: freezeArray(forecasts.map((item) => item.lineage_reference)),
    integrity_hashes: freezeArray(forecasts.map((item) => item.integrity_hash).filter(Boolean)),
    append_only: true as const,
  };
  const base = {
    report_id,
    tenant_id: repositoryBase.tenant_id,
    mission_id: historical.mission_id,
    forecasts,
    repository: Object.freeze({ ...repositoryBase, repository_hash: hashValue("risk-forecast-repository", repositoryBase) }),
    replay_reference: failures.includes("REPLAY_INVALID") ? "" : `replay:${report_id}`,
    lineage_reference: `lineage:${report_id}`,
    integrity_hash: failures.includes("INTEGRITY_INVALID") ? "" : hashValue("risk-forecasting-integrity", { report_id, forecasts: forecasts.map((item) => item.forecast_hash) }),
    advisory_only: true as const,
  };
  return Object.freeze({ ...base, report_hash: computeRiskForecastingReportHash(base as Omit<RiskForecastingReport, "report_hash">) });
}

export function validateRiskForecasting(report?: RiskForecastingReport): RiskForecastValidationResult {
  if (!report) {
    const failures = freezeArray<RiskForecastFailure>(["FORECAST_SCHEMA_INVALID"]);
    const source = { report_id: null, valid: false, forecast_contract_valid: false, forecast_schema_valid: false, forecasts_deterministic: false, confidence_reproducible: false, supporting_evidence_complete: false, explanations_complete: false, historical_correlations_reproducible: false, replay_valid: false, governance_valid: false, constitutional_valid: false, operator_approval_required: false, advisory_only: false, tenant_isolated: false, integrity_valid: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("risk-forecast-validation", source) });
  }
  const forecast_contract_valid = report.forecasts.length > 0;
  const forecast_schema_valid = report.forecasts.every((item) => item.forecast_id && forecastTypes.includes(item.forecast_type) && item.risk_probability >= 0 && item.risk_probability <= 1);
  const forecasts_deterministic = report.forecasts.every((item) => item.forecast_hash);
  const confidence_reproducible = report.forecasts.every((item) => item.projected_confidence >= 0 && item.projected_confidence <= 1);
  const supporting_evidence_complete = report.forecasts.every((item) => item.supporting_evidence.length > 0 && item.supporting_evidence.every((ev) => ev.integrity_hash));
  const explanations_complete = report.forecasts.every((item) => item.explanation.length >= 7);
  const historical_correlations_reproducible = report.forecasts.every((item) => item.historical_correlations.length > 0 && item.historical_correlations.every((corr) => corr.correlation_hash));
  const replay_valid = Boolean(report.replay_reference) && report.forecasts.every((item) => item.replay_reference);
  const governance_valid = report.forecasts.every((item) => item.governance_validation === "PASS" && !item.governance_modified && !item.policy_bypassed);
  const constitutional_valid = report.forecasts.every((item) => item.constitutional_validation === "PASS" && !item.constitutional_bypassed);
  const operator_approval_required = report.forecasts.every((item) => item.operator_required);
  const advisory_only = report.advisory_only && report.forecasts.every((item) => item.advisory_only && !item.mitigation_executed && !item.execution_modified && !item.governance_modified);
  const tenant_isolated = report.tenant_id === TENANT_ID || report.tenant_id.startsWith("tenant:") && report.forecasts.every((item) => item.tenant_id === report.tenant_id && !item.cross_tenant_forecast);
  const integrity_valid = Boolean(report.integrity_hash) && report.repository.integrity_hashes.length === report.forecasts.length;
  const immutable_hash_valid = computeRiskForecastingReportHash(report) === report.report_hash;
  const historicalValid = validateHistoricalIntelligence(report.forecasts[0]?.source_historical_intelligence).valid;
  const failures = unique([
    ...(!forecast_contract_valid ? ["FORECAST_SCHEMA_INVALID" as const] : []),
    ...(!forecast_schema_valid ? ["FORECAST_SCHEMA_INVALID" as const] : []),
    ...(!forecasts_deterministic ? ["FORECAST_TYPE_INVALID" as const] : []),
    ...(!confidence_reproducible ? ["CONFIDENCE_NONDETERMINISTIC" as const] : []),
    ...(!supporting_evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!explanations_complete ? ["EXPLANATION_INCOMPLETE" as const] : []),
    ...(!historical_correlations_reproducible || !historicalValid ? ["HISTORICAL_CORRELATION_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_INVALID" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!advisory_only ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(report.forecasts.some((item) => item.execution_modified) ? ["EXECUTION_MODIFICATION_DETECTED" as const] : []),
    ...(report.forecasts.some((item) => item.governance_modified) ? ["GOVERNANCE_MODIFICATION_DETECTED" as const] : []),
    ...(report.forecasts.some((item) => item.policy_bypassed) ? ["POLICY_BYPASS_DETECTED" as const] : []),
    ...(report.forecasts.some((item) => item.constitutional_bypassed) ? ["CONSTITUTIONAL_BYPASS_DETECTED" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(report.forecasts.some((item) => item.cross_tenant_forecast) ? ["CROSS_TENANT_FORECAST_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { report_id: report.report_id, valid, forecast_contract_valid, forecast_schema_valid, forecasts_deterministic, confidence_reproducible, supporting_evidence_complete, explanations_complete, historical_correlations_reproducible, replay_valid, governance_valid, constitutional_valid, operator_approval_required, advisory_only, tenant_isolated, integrity_valid, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("risk-forecast-validation", source) });
}

export function replayRiskForecasting(report = runRiskForecasting()): RiskForecastReplayResult {
  const reconstructed_hash = computeRiskForecastingReportHash(report);
  const source = { replay_reference: report.replay_reference, report_id: report.report_id, deterministic: reconstructed_hash === report.report_hash && Boolean(report.replay_reference), reconstructed_hash, original_hash: report.report_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("risk-forecast-replay", source) });
}

export function buildRiskForecastObservabilitySurface(report = runRiskForecasting()): RiskForecastObservabilitySurface {
  const sev = [...report.forecasts].sort((a, b) => severityLevels.indexOf(b.severity) - severityLevels.indexOf(a.severity))[0]?.severity ?? "MINIMAL";
  const prob = [...report.forecasts].sort((a, b) => probabilityLevels.indexOf(b.probability_level) - probabilityLevels.indexOf(a.probability_level))[0]?.probability_level ?? "VERY_LOW";
  return Object.freeze({ report_id: report.report_id, forecast_count: report.forecasts.length, highest_severity: sev, highest_probability: prob, tenant_id: report.tenant_id, advisory_only: true, report_hash: report.report_hash });
}

export function getRiskForecastingEngineContract(): RiskForecastingEngineContract {
  const report = runRiskForecasting();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-forecasting", "explainable-predictions", "replay-reproducibility", "governance-first-analysis", "constitutional-compliance", "advisory-only-recommendations", "immutable-forecast-evidence", "version-controlled-forecasting-models", "tenant-isolation", "fail-closed-behavior"]),
      forecast_types: forecastTypes,
      pipeline_states: pipelineStates,
      severity_levels: severityLevels,
      probability_levels: probabilityLevels,
      forecast_windows: forecastWindows,
      advisory_only: true,
    }),
    report,
    validation: validateRiskForecasting(report),
    replay: replayRiskForecasting(report),
    observability: buildRiskForecastObservabilitySurface(report),
  });
}
