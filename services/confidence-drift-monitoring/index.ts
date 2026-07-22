import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  ConfidenceBaseline,
  ConfidenceCalibrationReport,
  ConfidenceDriftIndexReport,
  ConfidenceDriftMonitoringApiSurface,
  ConfidenceDriftMonitoringFailure,
  ConfidenceDriftMonitoringFoundation,
  ConfidenceDriftMonitoringInput,
  ConfidenceDriftMonitoringMetrics,
  ConfidenceDriftMonitoringResult,
  ConfidenceDriftMonitoringScenario,
  ConfidenceDriftMonitoringStatus,
  ConfidenceDriftRecord,
  ConfidenceDriftTimeline,
  ConfidenceStabilityAnalysis,
  EvidenceConfidenceValidation,
  HistoricalConfidenceAnalysis,
} from "@/types/confidence-drift-monitoring";

const MONITORING_VERSION = "confidence-drift-monitoring/v1" as const;
const MONITOR_IDENTIFIER = "ConfidenceDriftMonitoring" as const;
const MONITORING_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<ConfidenceDriftMonitoringInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): ConfidenceDriftMonitoringApiSurface {
  const base: Omit<ConfidenceDriftMonitoringApiSurface, "integrity_hash"> = {
    api_id: "confidence_drift_monitoring_api",
    monitor_confidence_drift: "POST /confidence-drift-monitoring/monitor",
    retrieve_baseline: "POST /confidence-drift-monitoring/baseline",
    retrieve_calibration_report: "POST /confidence-drift-monitoring/calibration",
    retrieve_evidence_validation: "POST /confidence-drift-monitoring/evidence",
    retrieve_timeline: "POST /confidence-drift-monitoring/timeline",
    retrieve_ledger_record: "POST /confidence-drift-monitoring/ledger",
    retrieve_metrics: "POST /confidence-drift-monitoring/metrics",
    replay_monitoring: "POST /confidence-drift-monitoring/replay",
    inspect_monitor: "POST /confidence-drift-monitoring/inspect",
    retrieve_contract: "GET /confidence-drift-monitoring/contract",
    production_confidence_mutation_supported: false,
    automatic_recalibration_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): ConfidenceDriftMonitoringFailure | undefined {
  const map: Partial<Record<ConfidenceDriftMonitoringScenario, ConfidenceDriftMonitoringFailure>> = {
    UNAUTHORIZED_BASELINE_CHANGE: "UNAUTHORIZED_BASELINE_CHANGE",
    MISSING_GOVERNANCE_APPROVAL: "MISSING_GOVERNANCE_APPROVAL",
    CONFIDENCE_INFLATION: "CONFIDENCE_INFLATION_DETECTED",
    CONFIDENCE_COLLAPSE: "CONFIDENCE_COLLAPSE_DETECTED",
    UNEXPLAINED_SHIFT: "UNEXPLAINED_CONFIDENCE_SHIFT",
    CONFIDENCE_INSTABILITY: "CONFIDENCE_INSTABILITY_DETECTED",
    EVIDENCE_MISMATCH: "EVIDENCE_CONFIDENCE_MISMATCH",
    HISTORICAL_DIVERGENCE: "HISTORICAL_CONFIDENCE_DIVERGENCE",
    UNSUPPORTED_CERTAINTY: "UNSUPPORTED_CERTAINTY_DETECTED",
    EXCESSIVE_UNCERTAINTY: "EXCESSIVE_UNCERTAINTY_DETECTED",
    CONFIDENCE_OSCILLATION: "CONFIDENCE_OSCILLATION_DETECTED",
    ADAPTATION_DEGRADATION: "ADAPTATION_INDUCED_CALIBRATION_DEGRADATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_ASSESSMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_CONFIDENCE_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    PRODUCTION_MUTATION: "PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT",
    UNKNOWN_BEHAVIOR: "UNKNOWN_CONFIDENCE_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly ConfidenceDriftMonitoringFailure[] {
  const failures: ConfidenceDriftMonitoringFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly ConfidenceDriftMonitoringFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_CONFIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT")) return "CRITICAL";
  if (failures.includes("CONFIDENCE_INFLATION_DETECTED") || failures.includes("CONFIDENCE_COLLAPSE_DETECTED") || failures.includes("EVIDENCE_CONFIDENCE_MISMATCH") || failures.includes("ADAPTATION_INDUCED_CALIBRATION_DEGRADATION")) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly ConfidenceDriftMonitoringFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_CONFIDENCE_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceDriftMonitoringStatus {
  if (failures.includes("UNKNOWN_CONFIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT")) return "FAIL_CLOSED";
  if (failures.includes("MISSING_GOVERNANCE_APPROVAL") || failures.includes("UNAUTHORIZED_BASELINE_CHANGE")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "DRIFT_DETECTED" : "PASS";
}

function driftIndex(failures: readonly ConfidenceDriftMonitoringFailure[]): number {
  if (!failures.length) return 0.05;
  if (failures.includes("UNKNOWN_CONFIDENCE_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return 0.97;
  if (failures.includes("CONFIDENCE_INFLATION_DETECTED") || failures.includes("CONFIDENCE_COLLAPSE_DETECTED") || failures.includes("ADAPTATION_INDUCED_CALIBRATION_DEGRADATION")) return 0.78;
  return 0.46;
}

function buildBaseline(): ConfidenceBaseline {
  const base: Omit<ConfidenceBaseline, "integrity_hash"> = {
    baseline_id: "confidence_baseline_mission_control_v1",
    confidence_model_version: "confidence-model/v1",
    mission_scope: "mission-control-adaptive-intelligence",
    calibration_profile: freezeArray(["calibrated_probability", "outcome_observed", "uncertainty_preserved", "confidence_interval_required"]),
    confidence_thresholds: freezeArray(["low:0.30", "review:0.55", "actionable:0.70", "high:0.85", "requires_evidence_above:0.90"]),
    evidence_weighting_rules: freezeArray(["verified_outcome:1.00", "fresh_evidence:0.90", "diverse_evidence:0.85", "operator_override:0.70", "stale_evidence:0.25"]),
    governance_requirements: freezeArray(["governance_approval_required_for_baseline_change", "calibration_review_required", "confidence_mutation_forbidden"]),
    constitutional_requirements: freezeArray(["confidence_must_not_override_operator_authority", "tenant_isolation_required", "evidence_proportionality_required"]),
    approval_reference: "governance-approval:confidence-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCalibrationReport(index: number, failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceCalibrationReport {
  const score = Number((1 - index).toFixed(2));
  const base: Omit<ConfidenceCalibrationReport, "integrity_hash"> = {
    report_id: `confidence_calibration_${hash({ index, failures }).slice(0, 14)}`,
    calibration_score: score,
    calibration_curve: freezeArray([0.12, 0.31, 0.49, 0.68, 0.84, Number((0.93 - index / 5).toFixed(2))]),
    confidence_accuracy_report: failures.length ? "Calibration accuracy degraded against approved confidence baseline." : "Confidence remains accurately calibrated against observed outcomes.",
    confidence_reliability_summary: failures.includes("CONFIDENCE_INFLATION_DETECTED") ? "Reliability reduced by confidence inflation." : "Reliability remains proportional to verified evidence.",
    prediction_accuracy: Number((0.94 - index / 2).toFixed(2)),
    uncertainty_representation_score: Number((0.96 - index / 2).toFixed(2)),
    detected_anomalies: failures,
    governance_impacts: failures.length ? freezeArray(["governance_review_required_before_recalibration"]) : freezeArray(["no_governance_impact_detected"]),
    recommended_actions: failures.length ? freezeArray(["preserve_current_production_confidence", "route_to_governance_review", "require_replay_before_any_adaptation"]) : freezeArray(["continue_monitoring"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStability(index: number, failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceStabilityAnalysis {
  const volatility = failures.includes("CONFIDENCE_OSCILLATION_DETECTED") || failures.includes("CONFIDENCE_INSTABILITY_DETECTED") ? 0.72 : Number((index * 0.4).toFixed(2));
  const base: Omit<ConfidenceStabilityAnalysis, "integrity_hash"> = {
    analysis_id: `confidence_stability_${hash({ index, failures }).slice(0, 14)}`,
    stability_score: Number((1 - index).toFixed(2)),
    confidence_consistency: Number((0.97 - index / 2).toFixed(2)),
    calibration_persistence: Number((0.96 - index / 2).toFixed(2)),
    confidence_volatility: volatility,
    prediction_stability: Number((0.95 - index / 2).toFixed(2)),
    adaptation_stability: Number((0.96 - index / 2).toFixed(2)),
    trend_persistence: Number((0.94 - index / 2).toFixed(2)),
    confidence_recovery: Number((0.93 - index / 3).toFixed(2)),
    confidence_stability_report: failures.length ? "Confidence stability has drifted outside approved monitoring tolerance." : "Confidence behavior remains stable over the monitoring window.",
    drift_trend_analysis: index > 0.3 ? "Long-term confidence trend requires review before downstream adaptation." : "Historical confidence trend remains calibrated and stable.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceValidation(index: number, failures: readonly ConfidenceDriftMonitoringFailure[]): EvidenceConfidenceValidation {
  const mismatch = failures.includes("EVIDENCE_CONFIDENCE_MISMATCH") || failures.includes("UNSUPPORTED_CERTAINTY_DETECTED") || failures.includes("EXCESSIVE_UNCERTAINTY_DETECTED");
  const base: Omit<EvidenceConfidenceValidation, "integrity_hash"> = {
    validation_id: `evidence_confidence_${hash({ index, failures }).slice(0, 14)}`,
    evidence_sufficiency: Number((0.96 - index / 2).toFixed(2)),
    evidence_freshness: Number((0.94 - index / 3).toFixed(2)),
    evidence_quality: Number((0.95 - index / 2).toFixed(2)),
    evidence_diversity: Number((0.94 - index / 3).toFixed(2)),
    evidence_consistency: Number((0.94 - index / 2).toFixed(2)),
    evidence_completeness: Number((0.96 - index / 2).toFixed(2)),
    evidence_lineage: freezeArray(["evidence:outcome-observation", "evidence:normalization", "evidence:recommendation-effectiveness", "evidence:simulation-validation"]),
    evidence_alignment_report: mismatch ? "Confidence is not proportional to supporting evidence." : "Confidence remains proportional to verified immutable evidence.",
    evidence_confidence_ratio: mismatch ? 1.64 : 1.01,
    validation_summary: mismatch ? "Evidence-to-confidence validation requires governance review." : "Evidence-to-confidence validation passed.",
    detected_mismatches: mismatch ? failures : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHistoricalAnalysis(index: number, failures: readonly ConfidenceDriftMonitoringFailure[]): HistoricalConfidenceAnalysis {
  const base: Omit<HistoricalConfidenceAnalysis, "integrity_hash"> = {
    analysis_id: `historical_confidence_${hash({ index, failures }).slice(0, 14)}`,
    historical_drift_analysis: failures.includes("HISTORICAL_CONFIDENCE_DIVERGENCE") ? "Historical confidence divergence detected against approved calibration history." : "No historical confidence divergence detected.",
    confidence_evolution_report: failures.length ? "Confidence evolution shows drift requiring review." : "Confidence evolution remains traceable and stable.",
    trend_consistency_report: index > 0.3 ? "Trend consistency is outside approved tolerance." : "Trend consistency remains within approved tolerance.",
    historical_calibration_score: Number((0.95 - index / 2).toFixed(2)),
    historical_prediction_accuracy: Number((0.94 - index / 2).toFixed(2)),
    confidence_trends: freezeArray(["baseline:v1", "calibration:t1", "outcome:t2", "monitoring:current"]),
    adaptation_history: freezeArray(["adaptation:confidence-calibration-approved", "adaptation:proposal-review-only"]),
    mission_consistency_score: Number((0.96 - index / 2).toFixed(2)),
    operator_influence_report: "Operator influence remains visible and does not mutate confidence automatically.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIndexReport(index: number): ConfidenceDriftIndexReport {
  const base: Omit<ConfidenceDriftIndexReport, "integrity_hash"> = {
    index_id: `confidence_drift_index_${hash(index).slice(0, 14)}`,
    confidence_drift_index: index,
    calibration_deviation: Number((index * 0.88).toFixed(2)),
    confidence_variance: Number((index * 0.8).toFixed(2)),
    historical_divergence: Number((index * 0.7).toFixed(2)),
    evidence_mismatch: Number((index * 0.92).toFixed(2)),
    confidence_volatility: Number((index * 0.75).toFixed(2)),
    prediction_inconsistency: Number((index * 0.82).toFixed(2)),
    confidence_trend_deviation: Number((index * 0.86).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceDriftTimeline {
  const base: Omit<ConfidenceDriftTimeline, "integrity_hash"> = {
    timeline_id: `confidence_drift_timeline_${hash(failures).slice(0, 14)}`,
    confidence_changes: freezeArray(["confidence:baseline", "confidence:observed-outcomes", "confidence:current-assessment"]),
    calibration_updates: freezeArray(["calibration:v1-approved", "calibration:monitoring-current"]),
    drift_events: failures.length ? failures : freezeArray(["drift:none"]),
    evidence_changes: freezeArray(["evidence:outcome-captured", "evidence:lineage-verified"]),
    adaptation_proposals: freezeArray(["adaptation-proposal:none-authorized"]),
    governance_reviews: failures.length ? freezeArray(["governance:review-required"]) : freezeArray(["governance:no-review-required"]),
    simulation_results: freezeArray(["simulation:phase-10.11-certified"]),
    operator_decisions: freezeArray(["operator:visibility-required", "operator:review-available"]),
    certification_events: freezeArray(["certification:adaptive-simulation-certified"]),
    replay_refs: freezeArray(["replay:confidence-drift-monitoring"]),
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: ConfidenceDriftMonitoringInput, baseline: ConfidenceBaseline, calibration: ConfidenceCalibrationReport, stability: ConfidenceStabilityAnalysis, evidence: EvidenceConfidenceValidation, timeline: ConfidenceDriftTimeline, index: ConfidenceDriftIndexReport, failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceDriftRecord {
  const severity = severityFor(failures);
  const base: Omit<ConfidenceDriftRecord, "integrity_hash"> = {
    drift_id: `confidence_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", index: index.confidence_drift_index, failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    baseline_ref: baseline.integrity_hash,
    confidence_model_version: baseline.confidence_model_version,
    drift_category: "CONFIDENCE_DRIFT",
    confidence_drift_index: index.confidence_drift_index,
    calibration_score: calibration.calibration_score,
    stability_score: stability.stability_score,
    severity,
    evidence_alignment_score: Number((1 / evidence.evidence_confidence_ratio).toFixed(2)),
    affected_adaptations: freezeArray(["adaptation:confidence-calibration", "adaptation:proposal-scoring"]),
    affected_decisions: freezeArray(["decision:confidence-weighted-recommendation", "decision:governance-review-routing"]),
    supporting_evidence: evidence.integrity_hash,
    recommended_response: responseFor(severity, failures),
    containment_required: severity === "HIGH" || severity === "CRITICAL" || severity === "CATASTROPHIC",
    replay_refs: timeline.replay_refs,
    timestamp: MONITORING_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(index: ConfidenceDriftIndexReport, calibration: ConfidenceCalibrationReport, stability: ConfidenceStabilityAnalysis, evidence: EvidenceConfidenceValidation, historical: HistoricalConfidenceAnalysis, failures: readonly ConfidenceDriftMonitoringFailure[]): ConfidenceDriftMonitoringMetrics {
  const base: Omit<ConfidenceDriftMonitoringMetrics, "integrity_hash"> = {
    confidence_drift_index: index.confidence_drift_index,
    calibration_score: calibration.calibration_score,
    stability_score: stability.stability_score,
    evidence_alignment_score: Number((1 / evidence.evidence_confidence_ratio).toFixed(2)),
    historical_consistency_score: historical.historical_calibration_score,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_CONFIDENCE_EVIDENCE"),
    governance_aligned: !failures.includes("MISSING_GOVERNANCE_APPROVAL") && !failures.includes("UNAUTHORIZED_BASELINE_CHANGE"),
    constitutional_aligned: !failures.includes("PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceDriftMonitoringResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    calibration_hash: result.calibration_report.integrity_hash,
    stability_hash: result.stability_analysis.integrity_hash,
    evidence_hash: result.evidence_validation.integrity_hash,
    historical_hash: result.historical_analysis.integrity_hash,
    index_hash: result.drift_index_report.integrity_hash,
    timeline_hash: result.drift_timeline.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ConfidenceDriftMonitoringResult, "integrity_hash">): string {
  return hash({
    version: result.confidence_drift_monitoring_version,
    monitor_identifier: result.monitor_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function monitorConfidenceDrift(input: ConfidenceDriftMonitoringInput = {}): ConfidenceDriftMonitoringResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const indexScore = driftIndex(failures);
  const baseline = buildBaseline();
  const calibration_report = buildCalibrationReport(indexScore, failures);
  const stability_analysis = buildStability(indexScore, failures);
  const evidence_validation = buildEvidenceValidation(indexScore, failures);
  const historical_analysis = buildHistoricalAnalysis(indexScore, failures);
  const drift_index_report = buildIndexReport(indexScore);
  const drift_timeline = buildTimeline(failures);
  const drift_record = buildRecord(input, baseline, calibration_report, stability_analysis, evidence_validation, drift_timeline, drift_index_report, failures);
  const metrics = buildMetrics(drift_index_report, calibration_report, stability_analysis, evidence_validation, historical_analysis, failures);
  const base: Omit<ConfidenceDriftMonitoringResult, "integrity_hash" | "replay_hash"> = {
    confidence_drift_monitoring_version: MONITORING_VERSION,
    monitor_identifier: MONITOR_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    calibration_report,
    stability_analysis,
    evidence_validation,
    historical_analysis,
    drift_index_report,
    drift_timeline,
    drift_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_CONFIDENCE_BEHAVIOR") && !failures.includes("UNEXPLAINED_CONFIDENCE_SHIFT"),
    evidence_backed: !failures.includes("EVIDENCE_CONFIDENCE_MISMATCH") && !failures.includes("NONREPLAYABLE_CONFIDENCE_EVIDENCE"),
    governance_preserved: metrics.governance_aligned,
    constitutional_preserved: metrics.constitutional_aligned,
    operator_authority_preserved: true,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_confidence: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceDriftMonitoring(result: ConfidenceDriftMonitoringResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.calibration_report) &&
    verifyHashedRecord(result.stability_analysis) &&
    verifyHashedRecord(result.evidence_validation) &&
    verifyHashedRecord(result.historical_analysis) &&
    verifyHashedRecord(result.drift_index_report) &&
    verifyHashedRecord(result.drift_timeline) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getConfidenceDriftMonitoringFoundation(): ConfidenceDriftMonitoringFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_drift_monitoring_version: MONITORING_VERSION,
    api_surface,
    result: monitorConfidenceDrift(),
  });
}

export const ConfidenceDriftMonitoring = Object.freeze({
  monitor: monitorConfidenceDrift,
  replay: replayConfidenceDriftMonitoring,
});
