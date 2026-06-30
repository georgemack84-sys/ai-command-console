import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateRuntimeHealth, validateRuntimeHealth } from "@/services/runtime-health-stability-engine";
import type { AdaptiveTrend } from "@/types/adaptive-runtime-assurance-contract";
import type { RuntimeHealthRecord, RuntimeHealthScenario } from "@/types/runtime-health-stability-engine";
import type {
  CertifiedDriftBaseline,
  DriftCertification,
  DriftDetectionInput,
  DriftDetectionTrendIntelligenceContract,
  DriftDomain,
  DriftFailure,
  DriftForecast,
  DriftIntelligenceRecord,
  DriftLifecycleStage,
  DriftPublisherSurface,
  DriftReplayResult,
  DriftScenario,
  DriftSeverity,
  DriftValidationResult,
  TrendReport,
} from "@/types/drift-detection-trend-intelligence-engine";

const NOW = "2026-07-02T15:00:00.000Z";
const VERSION = "drift-detection-trend-intelligence-engine/v8ALT.1D" as const;
const BASELINE_VERSION = "certified-drift-baseline/v8ALT.1D" as const;

const lifecycle: readonly DriftLifecycleStage[] = Object.freeze(["COLLECT_RUNTIME_DATA", "LOAD_CERTIFIED_BASELINES", "DETECT_DRIFT", "CALCULATE_TRENDS", "MEASURE_VELOCITY", "DETECT_ANOMALIES", "GENERATE_FORECASTS", "GENERATE_EXPLANATIONS", "VALIDATE_REPLAY", "STORE_RESULTS", "PUBLISH_INTELLIGENCE"]);
const domains: readonly DriftDomain[] = Object.freeze(["CONFIDENCE", "POLICY", "CONSTITUTIONAL", "EXECUTION", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE"]);
const severityLevels: readonly DriftSeverity[] = Object.freeze(["NONE", "MINIMAL", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(4))));
}

function scenarioFailure(scenario: DriftScenario): DriftFailure | null {
  const map: Partial<Record<DriftScenario, DriftFailure>> = {
    RAPID_CONFIDENCE_DEGRADATION: "RAPID_CONFIDENCE_DEGRADATION",
    LONG_TERM_CONFIDENCE_DECLINE: "LONG_TERM_CONFIDENCE_DECLINE",
    CONFIDENCE_OSCILLATION: "CONFIDENCE_OSCILLATION",
    CONFIDENCE_COLLAPSE: "CONFIDENCE_COLLAPSE",
    POLICY_DRIFT: "POLICY_DRIFT",
    CONSTITUTIONAL_DRIFT: "CONSTITUTIONAL_DRIFT",
    AUTHORITY_DRIFT: "AUTHORITY_DRIFT",
    COMPLIANCE_DEGRADATION: "COMPLIANCE_DEGRADATION",
    EXECUTION_DEGRADATION: "EXECUTION_DEGRADATION",
    PLANNING_DEGRADATION: "PLANNING_DEGRADATION",
    ORCHESTRATION_DEGRADATION: "ORCHESTRATION_DEGRADATION",
    DELEGATION_DEGRADATION: "DELEGATION_DEGRADATION",
    SUPERVISION_DEGRADATION: "SUPERVISION_DEGRADATION",
    RECURRING_INSTABILITY: "RECURRING_INSTABILITY",
    PERSISTENT_DEGRADATION: "PERSISTENT_DEGRADATION",
    ANOMALY_CLUSTER: "ANOMALY_CLUSTER",
    CASCADING_FAILURES: "CASCADING_FAILURES",
    BASELINE_INVALID: "BASELINE_INVALID",
    FORECAST_INVALID: "FORECAST_INVALID",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE",
    EXECUTION_AUTHORITY_ATTEMPT: "UNAUTHORIZED_EXECUTION_CAPABILITY",
  };
  return map[scenario] ?? null;
}

function healthScenarioFor(scenario: DriftScenario): RuntimeHealthScenario {
  if (scenario === "CONFIDENCE_OSCILLATION") return "CONFIDENCE_OSCILLATION";
  if (scenario === "EXECUTION_DEGRADATION") return "EXECUTION_INSTABILITY";
  if (scenario === "PLANNING_DEGRADATION") return "PLANNING_INSTABILITY";
  if (scenario === "ORCHESTRATION_DEGRADATION") return "ORCHESTRATION_INSTABILITY";
  if (scenario === "DELEGATION_DEGRADATION") return "DELEGATION_INSTABILITY";
  if (scenario === "SUPERVISION_DEGRADATION") return "SUPERVISION_INSTABILITY";
  if (scenario === "RECURRING_INSTABILITY") return "REPEATED_DEGRADATION";
  if (scenario === "PERSISTENT_DEGRADATION") return "UNHEALTHY_TREND";
  if (scenario === "CASCADING_FAILURES") return "RECURRING_WORKFLOW_FAILURES";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_MISMATCH";
  if (scenario === "TENANT_ISOLATION_FAILURE") return "TENANT_ISOLATION_FAILURE";
  if (scenario === "EXECUTION_AUTHORITY_ATTEMPT") return "EXECUTION_AUTHORITY_ATTEMPT";
  return "BASELINE";
}

function categoryFor(failure: DriftFailure | null): DriftDomain {
  if (!failure) return "CONFIDENCE";
  if (failure.includes("POLICY")) return "POLICY";
  if (failure.includes("CONSTITUTIONAL") || failure.includes("AUTHORITY")) return "CONSTITUTIONAL";
  if (failure.includes("EXECUTION") || failure.includes("CASCADING")) return "EXECUTION";
  if (failure.includes("PLANNING")) return "PLANNING";
  if (failure.includes("ORCHESTRATION")) return "ORCHESTRATION";
  if (failure.includes("DELEGATION")) return "DELEGATION";
  if (failure.includes("SUPERVISION")) return "SUPERVISION";
  if (failure.includes("GOVERNANCE") || failure.includes("COMPLIANCE")) return "GOVERNANCE";
  return "CONFIDENCE";
}

function driftImpact(failure: DriftFailure | null): number {
  if (!failure) return 0;
  if (["CONFIDENCE_COLLAPSE", "CASCADING_FAILURES", "TENANT_ISOLATION_FAILURE", "UNAUTHORIZED_EXECUTION_CAPABILITY"].includes(failure)) return 90;
  if (["PERSISTENT_DEGRADATION", "RECURRING_INSTABILITY", "POLICY_DRIFT", "CONSTITUTIONAL_DRIFT", "REPLAY_MISMATCH"].includes(failure)) return 65;
  if (["RAPID_CONFIDENCE_DEGRADATION", "EXECUTION_DEGRADATION", "PLANNING_DEGRADATION", "ORCHESTRATION_DEGRADATION", "ANOMALY_CLUSTER"].includes(failure)) return 50;
  if (["LONG_TERM_CONFIDENCE_DECLINE", "CONFIDENCE_OSCILLATION", "DELEGATION_DEGRADATION", "SUPERVISION_DEGRADATION", "COMPLIANCE_DEGRADATION", "AUTHORITY_DRIFT"].includes(failure)) return 35;
  return 25;
}

function severityFor(score: number): DriftSeverity {
  if (score <= 0) return "NONE";
  if (score < 10) return "MINIMAL";
  if (score < 25) return "LOW";
  if (score < 45) return "MODERATE";
  if (score < 65) return "HIGH";
  if (score < 85) return "SEVERE";
  return "CRITICAL";
}

function trendFor(failure: DriftFailure | null): AdaptiveTrend {
  if (!failure) return "STABLE";
  if (failure.includes("RECOVERY")) return "IMPROVING";
  return "DECLINING";
}

export function buildCertifiedDriftBaselines(): readonly CertifiedDriftBaseline[] {
  return freezeArray([...domains, "CONFIDENCE_BASELINE" as const].map((category) => {
    const source = {
      baseline_id: id("DDB", "drift-baseline-id", category),
      category,
      baseline_version: BASELINE_VERSION,
      baseline_score: 96,
      immutable: true as const,
      replay_compatible: true,
      integrity_hash: hashValue("drift-baseline-integrity", { category, score: 96 }),
    };
    return Object.freeze({ ...source, baseline_hash: hashValue("certified-drift-baseline", source) });
  }));
}

function forecast(driftId: string, score: number, health: RuntimeHealthRecord, failure: DriftFailure | null): DriftForecast {
  const predicted_health = normalizeScore(health.overall_runtime_health - score * 0.35);
  const predicted_confidence = normalizeScore((health.overall_runtime_health + health.stability_score) / 2 - score * 0.25);
  const source = {
    forecast_id: id("DDF", "drift-forecast-id", driftId),
    degradation_forecast: score >= 45 ? "degradation likely without operator attention" : "degradation not projected from current evidence",
    recovery_prediction: score === 0 ? "baseline recovery not required" : score < 45 ? "recovery likely with monitoring" : "recovery requires governance-visible mitigation planning",
    stability_forecast: predicted_health >= 90 ? "stable" : predicted_health >= 70 ? "watch" : "unstable",
    predicted_health,
    predicted_confidence,
    recovery_likelihood: normalizeScore(100 - score),
    certification_readiness: !failure && predicted_health >= 90 && predicted_confidence >= 90,
  };
  return Object.freeze({ ...source, forecast_hash: hashValue("drift-forecast", source) });
}

function explanation(driftId: string, domain: DriftDomain, failure: DriftFailure | null, score: number, health: RuntimeHealthRecord, forecastValue: DriftForecast) {
  const failures = failure ? freezeArray([failure]) : freezeArray<DriftFailure>([]);
  const source = {
    explanation_id: id("DDE", "drift-explanation-id", driftId),
    affected_subsystem: domain,
    contributing_factors: failures,
    detected_deviations: failures.length ? freezeArray([`Deviation detected: ${failure}`]) : freezeArray(["No material deviation from certified baseline."]),
    baseline_comparison: `current ${normalizeScore(96 - score)} compared with certified baseline 96`,
    trend_interpretation: trendFor(failure) === "DECLINING" ? "drift trend is declining and requires proactive operator awareness" : "drift trend is stable against certified baseline",
    velocity_analysis: `degradation velocity ${score / 100}; recovery velocity ${forecastValue.recovery_likelihood / 100}`,
    anomaly_rationale: score >= 45 ? "deterministic anomaly threshold exceeded" : "anomaly threshold not exceeded",
    governance_influence: freezeArray([`governance-health:${health.governance_health}`]),
    constitutional_influence: freezeArray([`tenant:${health.tenant_id}`, `advisory-only:${health.advisory_only}`]),
    supporting_evidence: freezeArray([...health.evidence, health.integrity_hash, forecastValue.forecast_hash]),
  };
  return Object.freeze({ ...source, explanation_hash: hashValue("drift-explanation", source) });
}

export function computeDriftRecordHash(record: Omit<DriftIntelligenceRecord, "record_hash"> | DriftIntelligenceRecord): string {
  const { record_hash: _hash, ...source } = record as DriftIntelligenceRecord;
  return hashValue("drift-intelligence-record", source);
}

export function evaluateDriftIntelligence(input: DriftDetectionInput = {}): DriftIntelligenceRecord {
  const scenario = input.scenario ?? "BASELINE";
  const health = input.health ?? evaluateRuntimeHealth({ scenario: healthScenarioFor(scenario) });
  const healthValidation = validateRuntimeHealth(health);
  const scenarioFailureValue = scenarioFailure(scenario);
  const healthFailure = !healthValidation.replay_valid ? "REPLAY_MISMATCH" as const : !healthValidation.tenant_isolated ? "TENANT_ISOLATION_FAILURE" as const : !healthValidation.advisory_only ? "UNAUTHORIZED_EXECUTION_CAPABILITY" as const : null;
  const failure = scenarioFailureValue ?? healthFailure;
  const domain = categoryFor(failure);
  const baselines = buildCertifiedDriftBaselines();
  const baseline = baselines.find((item) => item.category === domain) ?? baselines[0];
  const driftScore = scenario === "BASELINE_INVALID" ? 20 : normalizeScore(driftImpact(failure));
  const driftId = id("DDI", "drift-intelligence-id", { scenario, health: health.record_hash });
  const forecastValue = forecast(driftId, scenario === "FORECAST_INVALID" ? 100 : driftScore, health, failure);
  const explanationValue = explanation(driftId, domain, failure, driftScore, health, forecastValue);
  const base = {
    drift_id: driftId,
    tenant_id: health.tenant_id,
    mission_id: health.mission_id,
    execution_id: health.execution_id,
    engine_version: VERSION,
    evaluation_timestamp: NOW,
    drift_category: domain,
    affected_subsystem: domain,
    baseline_version: BASELINE_VERSION,
    current_state: normalizeScore((health.overall_runtime_health + health.stability_score) / 2),
    baseline_state: baseline?.baseline_score ?? 0,
    drift_severity: severityFor(driftScore),
    drift_score: driftScore,
    trend_direction: trendFor(failure),
    degradation_velocity: failure ? normalizeScore(driftScore / 100) : 0,
    recovery_velocity: failure ? normalizeScore(forecastValue.recovery_likelihood / 100) : 1,
    forecast: forecastValue,
    predicted_health: forecastValue.predicted_health,
    predicted_confidence: forecastValue.predicted_confidence,
    anomaly_detected: driftScore >= 45 || scenario === "ANOMALY_CLUSTER",
    drift_explanation: explanationValue,
    supporting_evidence: explanationValue.supporting_evidence,
    lineage_reference: `lineage:${health.lineage_reference}:${driftId}`,
    replay_reference: `replay:${driftId}:v8alt-1d`,
    integrity_hash: hashValue("drift-intelligence-integrity", { driftId, driftScore, forecast: forecastValue.forecast_hash, explanation: explanationValue.explanation_hash, evidence: explanationValue.supporting_evidence }),
    advisory_only: true as const,
    execution_authorized: scenario === "EXECUTION_AUTHORITY_ATTEMPT",
    execution_modified: false,
    governance_modified: false,
  };
  return Object.freeze({ ...base, record_hash: computeDriftRecordHash(base as Omit<DriftIntelligenceRecord, "record_hash">) });
}

export function buildTrendReports(record = evaluateDriftIntelligence()): readonly TrendReport[] {
  return freezeArray((["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"] as const).map((period, index) => {
    const source = {
      trend_report_id: id("DDT", "drift-trend-report-id", { period, drift: record.drift_id }),
      mission_id: record.mission_id,
      evaluation_period: period,
      subsystem: record.affected_subsystem,
      rolling_average: normalizeScore(record.current_state - index * record.drift_score * 0.05),
      health_trend: record.trend_direction,
      confidence_trend: record.trend_direction,
      stability_trend: record.trend_direction,
      forecast: record.forecast,
      recommendations: record.drift_score === 0 ? freezeArray(["Continue certified drift monitoring."]) : freezeArray([`Investigate ${record.affected_subsystem} drift before severity escalates.`]),
      generated_at: NOW,
      replay_reference: record.replay_reference,
    };
    return Object.freeze({ ...source, trend_hash: hashValue("drift-trend-report", source) });
  }));
}

export function replayDriftIntelligence(record = evaluateDriftIntelligence()): DriftReplayResult {
  const deterministic = computeDriftRecordHash(record) === record.record_hash;
  const source = {
    replay_id: id("DDR", "drift-replay-id", record.drift_id),
    drift_id: record.drift_id,
    deterministic,
    reconstructed_drift_score: record.drift_score,
    reconstructed_forecast_hash: record.forecast.forecast_hash,
    reconstructed_explanation_hash: record.drift_explanation.explanation_hash,
    replay_failures: deterministic ? freezeArray<DriftFailure>([]) : freezeArray<DriftFailure>(["REPLAY_MISMATCH"]),
  };
  return Object.freeze({ ...source, replay_hash: hashValue("drift-replay", source) });
}

export function validateDriftIntelligence(record?: DriftIntelligenceRecord): DriftValidationResult {
  if (!record) {
    const failures = freezeArray<DriftFailure>(["BASELINE_INVALID"]);
    const source = { drift_id: null, validation_state: "FAIL" as const, valid: false, drift_valid: false, baseline_valid: false, forecast_valid: false, evidence_complete: false, replay_valid: false, governance_valid: false, constitutional_valid: false, tenant_isolated: false, advisory_only: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("drift-validation", source) });
  }
  const drift_valid = record.drift_score >= 0 && record.drift_score <= 100 && severityLevels.includes(record.drift_severity);
  const baseline_valid = record.baseline_version === BASELINE_VERSION && record.baseline_state > 0;
  const forecast_valid = Boolean(record.forecast.forecast_hash) && record.forecast.predicted_health >= 0 && record.forecast.predicted_confidence >= 0;
  const evidence_complete = record.supporting_evidence.length > 0 && record.drift_explanation.supporting_evidence.length > 0;
  const replay_valid = replayDriftIntelligence(record).deterministic;
  const governance_valid = !["POLICY", "GOVERNANCE"].includes(record.affected_subsystem) || record.drift_score < 45;
  const constitutional_valid = record.tenant_id.startsWith("tenant:") && record.affected_subsystem !== "CONSTITUTIONAL";
  const tenant_isolated = record.tenant_id.startsWith("tenant:");
  const advisory_only = record.advisory_only && !record.execution_authorized && !record.execution_modified && !record.governance_modified;
  const explanationFailures = record.drift_explanation.contributing_factors;
  const failures = unique([
    ...explanationFailures,
    ...(!drift_valid ? ["BASELINE_INVALID" as const] : []),
    ...(!baseline_valid ? ["BASELINE_INVALID" as const] : []),
    ...(!forecast_valid ? ["FORECAST_INVALID" as const] : []),
    ...(!evidence_complete ? ["BASELINE_INVALID" as const] : []),
    ...(!replay_valid || computeDriftRecordHash(record) !== record.record_hash ? ["REPLAY_MISMATCH" as const] : []),
    ...(!governance_valid ? ["POLICY_DRIFT" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_DRIFT" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_FAILURE" as const] : []),
    ...(!advisory_only ? ["UNAUTHORIZED_EXECUTION_CAPABILITY" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { drift_id: record.drift_id, validation_state: valid ? "PASS" as const : "FAIL" as const, valid, drift_valid, baseline_valid, forecast_valid, evidence_complete, replay_valid, governance_valid, constitutional_valid, tenant_isolated, advisory_only, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("drift-validation", source) });
}

export function certifyDriftIntelligence(record = evaluateDriftIntelligence()): DriftCertification {
  const validation = validateDriftIntelligence(record);
  const source = {
    certification_id: id("DDC", "drift-certification-id", record.drift_id),
    drift_id: record.drift_id,
    certified: validation.valid && record.drift_severity === "NONE",
    validation,
    ready_for_assurance_recommendation_engine: validation.valid,
  };
  return Object.freeze({ ...source, certification_hash: hashValue("drift-certification", source) });
}

export function publishDriftIntelligence(record = evaluateDriftIntelligence()): DriftPublisherSurface {
  return Object.freeze({
    drift_id: record.drift_id,
    drift_category: record.drift_category,
    affected_subsystem: record.affected_subsystem,
    drift_severity: record.drift_severity,
    drift_score: record.drift_score,
    trend_direction: record.trend_direction,
    anomaly_detected: record.anomaly_detected,
    predicted_health: record.predicted_health,
    predicted_confidence: record.predicted_confidence,
    recommendations: buildTrendReports(record)[0]?.recommendations ?? freezeArray([]),
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    advisory_only: true,
  });
}

export function getDriftDetectionTrendIntelligenceContract(): DriftDetectionTrendIntelligenceContract {
  const drift = evaluateDriftIntelligence();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic", "explainable", "replayable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "integrity-protected", "certification-ready", "advisory-only"]),
      lifecycle,
      domains,
      severity_levels: severityLevels,
      advisory_only: true,
    }),
    baselines: buildCertifiedDriftBaselines(),
    drift,
    trends: buildTrendReports(drift),
    validation: validateDriftIntelligence(drift),
    replay: replayDriftIntelligence(drift),
    certification: certifyDriftIntelligence(drift),
  });
}
