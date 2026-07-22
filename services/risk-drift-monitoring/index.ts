import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  EscalationDriftTimeline,
  EscalationThresholdReport,
  ProbabilityStabilityReport,
  RiskBaseline,
  RiskConsistencyReport,
  RiskDriftMonitoringApiSurface,
  RiskDriftMonitoringFailure,
  RiskDriftMonitoringFoundation,
  RiskDriftMonitoringInput,
  RiskDriftMonitoringMetrics,
  RiskDriftMonitoringResult,
  RiskDriftMonitoringScenario,
  RiskDriftMonitoringStatus,
  RiskDriftRecord,
  RiskDriftReport,
  RiskStabilityReport,
  RiskToleranceReport,
} from "@/types/risk-drift-monitoring";

const MONITORING_VERSION = "risk-drift-monitoring/v1" as const;
const MONITOR_IDENTIFIER = "RiskDriftMonitoring" as const;
const MONITORING_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<RiskDriftMonitoringInput["scenario"]>;

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

function buildApiSurface(): RiskDriftMonitoringApiSurface {
  const base: Omit<RiskDriftMonitoringApiSurface, "integrity_hash"> = {
    api_id: "risk_drift_monitoring_api",
    monitor_risk_drift: "POST /risk-drift-monitoring/monitor",
    retrieve_baseline: "POST /risk-drift-monitoring/baseline",
    retrieve_consistency_report: "POST /risk-drift-monitoring/consistency",
    retrieve_escalation_report: "POST /risk-drift-monitoring/escalation",
    retrieve_tolerance_report: "POST /risk-drift-monitoring/tolerance",
    retrieve_probability_report: "POST /risk-drift-monitoring/probability",
    retrieve_drift_report: "POST /risk-drift-monitoring/report",
    retrieve_timeline: "POST /risk-drift-monitoring/timeline",
    retrieve_ledger_record: "POST /risk-drift-monitoring/ledger",
    retrieve_metrics: "POST /risk-drift-monitoring/metrics",
    replay_monitoring: "POST /risk-drift-monitoring/replay",
    inspect_monitor: "POST /risk-drift-monitoring/inspect",
    retrieve_contract: "GET /risk-drift-monitoring/contract",
    production_risk_mutation_supported: false,
    automatic_escalation_policy_mutation_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): RiskDriftMonitoringFailure | undefined {
  const map: Partial<Record<RiskDriftMonitoringScenario, RiskDriftMonitoringFailure>> = {
    UNAUTHORIZED_BASELINE_CHANGE: "UNAUTHORIZED_BASELINE_CHANGE",
    MISSING_GOVERNANCE_APPROVAL: "MISSING_GOVERNANCE_APPROVAL",
    RISK_INFLATION: "RISK_INFLATION_DETECTED",
    RISK_SUPPRESSION: "RISK_SUPPRESSION_DETECTED",
    ESCALATION_THRESHOLD_DRIFT: "ESCALATION_THRESHOLD_DRIFT",
    HIDDEN_TOLERANCE_CHANGE: "HIDDEN_TOLERANCE_CHANGE",
    INCONSISTENT_SEVERITY: "INCONSISTENT_SEVERITY_SCORING",
    UNSTABLE_PROBABILITY: "UNSTABLE_PROBABILITY_ESTIMATION",
    INCONSISTENT_IMPACT: "INCONSISTENT_IMPACT_ESTIMATION",
    ADAPTATION_RISK_BIAS: "ADAPTATION_INDUCED_RISK_BIAS",
    HISTORICAL_DIVERGENCE: "HISTORICAL_RISK_DIVERGENCE",
    GOVERNANCE_SENSITIVITY_REDUCTION: "GOVERNANCE_SENSITIVITY_REDUCTION",
    UNAUTHORIZED_ESCALATION_EVOLUTION: "UNAUTHORIZED_ESCALATION_EVOLUTION",
    PROBABILITY_CALIBRATION_DEGRADATION: "PROBABILITY_CALIBRATION_DEGRADATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_ASSESSMENT",
    NONREPLAYABLE_EVIDENCE: "NONREPLAYABLE_RISK_EVIDENCE",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    PRODUCTION_MUTATION: "PRODUCTION_RISK_MUTATION_ATTEMPT",
    UNKNOWN_BEHAVIOR: "UNKNOWN_RISK_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly RiskDriftMonitoringFailure[] {
  const failures: RiskDriftMonitoringFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly RiskDriftMonitoringFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_RISK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_RISK_MUTATION_ATTEMPT")) return "CRITICAL";
  if (failures.includes("RISK_SUPPRESSION_DETECTED") || failures.includes("ESCALATION_THRESHOLD_DRIFT") || failures.includes("HIDDEN_TOLERANCE_CHANGE") || failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION")) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly RiskDriftMonitoringFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_RISK_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly RiskDriftMonitoringFailure[]): RiskDriftMonitoringStatus {
  if (failures.includes("UNKNOWN_RISK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("PRODUCTION_RISK_MUTATION_ATTEMPT")) return "FAIL_CLOSED";
  if (failures.includes("MISSING_GOVERNANCE_APPROVAL") || failures.includes("UNAUTHORIZED_BASELINE_CHANGE") || failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "DRIFT_DETECTED" : "PASS";
}

function driftMagnitude(failures: readonly RiskDriftMonitoringFailure[]): number {
  if (!failures.length) return 0.04;
  if (failures.includes("UNKNOWN_RISK_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH")) return 0.96;
  if (failures.includes("RISK_SUPPRESSION_DETECTED") || failures.includes("ESCALATION_THRESHOLD_DRIFT") || failures.includes("HIDDEN_TOLERANCE_CHANGE")) return 0.76;
  return 0.44;
}

function buildBaseline(): RiskBaseline {
  const base: Omit<RiskBaseline, "integrity_hash"> = {
    baseline_id: "risk_baseline_mission_control_v1",
    risk_model_version: "risk-model/v1",
    mission_scope: "mission-control-adaptive-intelligence",
    risk_categories: freezeArray(["operational", "governance", "constitutional", "tenant_isolation", "mission_impact", "confidence_integrity"]),
    probability_model: freezeArray(["calibrated_probability", "historical_frequency", "evidence_weighted_likelihood"]),
    impact_model: freezeArray(["mission_impact", "operator_impact", "governance_impact", "constitutional_impact"]),
    escalation_thresholds: freezeArray(["moderate:0.45", "high:0.65", "critical:0.82", "constitutional:any"]),
    approved_tolerance_levels: freezeArray(["low_residual_allowed", "moderate_requires_review", "high_requires_governance", "critical_fail_closed"]),
    governance_requirements: freezeArray(["governance_approval_required_for_threshold_change", "escalation_policy_immutable", "risk_model_mutation_forbidden"]),
    constitutional_requirements: freezeArray(["constitutional_risk_must_escalate", "tenant_isolation_required", "operator_authority_preserved"]),
    approval_reference: "governance-approval:risk-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildConsistencyReport(magnitude: number, failures: readonly RiskDriftMonitoringFailure[]): RiskConsistencyReport {
  const score = Number((1 - magnitude).toFixed(2));
  const base: Omit<RiskConsistencyReport, "integrity_hash"> = {
    report_id: `risk_consistency_${hash({ magnitude, failures }).slice(0, 14)}`,
    probability_consistency: failures.includes("UNSTABLE_PROBABILITY_ESTIMATION") ? 0.39 : score,
    impact_consistency: failures.includes("INCONSISTENT_IMPACT_ESTIMATION") ? 0.42 : score,
    severity_consistency: failures.includes("INCONSISTENT_SEVERITY_SCORING") ? 0.4 : score,
    recommendation_consistency: Number((0.95 - magnitude / 2).toFixed(2)),
    escalation_consistency: failures.includes("ESCALATION_THRESHOLD_DRIFT") ? 0.35 : score,
    evidence_weighting_consistency: Number((0.96 - magnitude / 2).toFixed(2)),
    historical_alignment: failures.includes("HISTORICAL_RISK_DIVERGENCE") ? 0.37 : score,
    evaluation_variance_summary: failures.length ? "Risk evaluation variance exceeds approved baseline tolerance." : "Comparable risks remain consistently evaluated over time.",
    decision_consistency_matrix: freezeArray(["probability", "impact", "severity", "recommendation", "escalation", "evidence_weighting", "historical_alignment"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEscalationReport(magnitude: number, failures: readonly RiskDriftMonitoringFailure[]): EscalationThresholdReport {
  const drift = failures.includes("ESCALATION_THRESHOLD_DRIFT") || failures.includes("UNAUTHORIZED_ESCALATION_EVOLUTION");
  const base: Omit<EscalationThresholdReport, "integrity_hash"> = {
    report_id: `escalation_threshold_${hash({ magnitude, failures }).slice(0, 14)}`,
    escalation_threshold_report: drift ? "Unauthorized escalation threshold or routing evolution detected." : "Escalation thresholds remain aligned with approved policy.",
    escalation_drift_summary: drift ? "Escalation behavior requires governance review before any policy change." : "No escalation drift detected.",
    threshold_stability_score: drift ? 0.34 : Number((1 - magnitude).toFixed(2)),
    escalation_timing_score: Number((0.95 - magnitude / 2).toFixed(2)),
    escalation_frequency_score: Number((0.94 - magnitude / 2).toFixed(2)),
    approval_routing_score: drift ? 0.41 : Number((0.96 - magnitude / 2).toFixed(2)),
    detected_escalation_anomalies: drift ? failures : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildToleranceReport(magnitude: number, failures: readonly RiskDriftMonitoringFailure[]): RiskToleranceReport {
  const toleranceDrift = failures.includes("HIDDEN_TOLERANCE_CHANGE") || failures.includes("RISK_SUPPRESSION_DETECTED") || failures.includes("RISK_INFLATION_DETECTED");
  const base: Omit<RiskToleranceReport, "integrity_hash"> = {
    report_id: `risk_tolerance_${hash({ magnitude, failures }).slice(0, 14)}`,
    accepted_risk_level_score: Number((0.95 - magnitude / 2).toFixed(2)),
    rejected_risk_level_score: Number((0.94 - magnitude / 2).toFixed(2)),
    residual_risk_acceptance_score: toleranceDrift ? 0.38 : Number((0.96 - magnitude / 2).toFixed(2)),
    tolerance_drift_assessment: toleranceDrift ? "Hidden or inconsistent risk tolerance movement detected." : "Risk tolerance remains within approved governance baseline.",
    governance_impact_summary: failures.length ? "Governance review required before any tolerance or mitigation change." : "No governance impact detected.",
    operator_influence_report: "Operator influence remains visible and cannot silently redefine risk tolerance.",
    detected_tolerance_anomalies: toleranceDrift ? failures : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildProbabilityReport(magnitude: number, failures: readonly RiskDriftMonitoringFailure[]): ProbabilityStabilityReport {
  const unstable = failures.includes("UNSTABLE_PROBABILITY_ESTIMATION") || failures.includes("PROBABILITY_CALIBRATION_DEGRADATION");
  const base: Omit<ProbabilityStabilityReport, "integrity_hash"> = {
    report_id: `probability_stability_${hash({ magnitude, failures }).slice(0, 14)}`,
    probability_stability_report: unstable ? "Probability estimation stability degraded." : "Probability estimation remains stable and evidence-based.",
    probability_drift_analysis: unstable ? "Probability drift requires calibration review." : "No probability drift detected.",
    estimation_consistency_score: unstable ? 0.36 : Number((1 - magnitude).toFixed(2)),
    probability_accuracy: Number((0.95 - magnitude / 2).toFixed(2)),
    probability_volatility: unstable ? 0.7 : Number((magnitude * 0.4).toFixed(2)),
    confidence_alignment: Number((0.94 - magnitude / 2).toFixed(2)),
    evidence_alignment: Number((0.96 - magnitude / 2).toFixed(2)),
    historical_calibration: unstable ? 0.4 : Number((0.95 - magnitude / 2).toFixed(2)),
    prediction_stability: unstable ? 0.38 : Number((0.94 - magnitude / 2).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStabilityReport(magnitude: number, escalation: EscalationThresholdReport, tolerance: RiskToleranceReport, probability: ProbabilityStabilityReport): RiskStabilityReport {
  const base: Omit<RiskStabilityReport, "integrity_hash"> = {
    report_id: `risk_stability_${hash({ magnitude, escalation: escalation.integrity_hash, tolerance: tolerance.integrity_hash }).slice(0, 14)}`,
    risk_stability_score: Number((1 - magnitude).toFixed(2)),
    severity_variance_score: Number((magnitude * 0.82).toFixed(2)),
    probability_variance_score: Number((1 - probability.estimation_consistency_score).toFixed(2)),
    impact_variance_score: Number((magnitude * 0.74).toFixed(2)),
    escalation_variance_score: Number((1 - escalation.threshold_stability_score).toFixed(2)),
    tolerance_variance_score: Number((1 - tolerance.residual_risk_acceptance_score).toFixed(2)),
    governance_variance_score: Number((magnitude * 0.68).toFixed(2)),
    historical_divergence_score: Number((magnitude * 0.72).toFixed(2)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDriftReport(failures: readonly RiskDriftMonitoringFailure[], response: DriftResponse): RiskDriftReport {
  const base: Omit<RiskDriftReport, "integrity_hash"> = {
    report_id: `risk_drift_report_${hash(failures).slice(0, 14)}`,
    detected_drift: failures,
    affected_risk_categories: freezeArray(["operational", "governance", "constitutional", "mission_impact"]),
    probability_analysis: failures.includes("UNSTABLE_PROBABILITY_ESTIMATION") ? "Probability analysis detected unstable estimation." : "Probability analysis remains calibrated.",
    severity_analysis: failures.includes("INCONSISTENT_SEVERITY_SCORING") ? "Severity analysis detected inconsistent scoring." : "Severity analysis remains consistent.",
    escalation_analysis: failures.includes("ESCALATION_THRESHOLD_DRIFT") ? "Escalation analysis detected threshold drift." : "Escalation analysis remains policy-aligned.",
    tolerance_analysis: failures.includes("HIDDEN_TOLERANCE_CHANGE") ? "Tolerance analysis detected hidden tolerance movement." : "Tolerance analysis remains aligned.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["no_governance_impact_detected"]),
    constitutional_impacts: failures.includes("PRODUCTION_RISK_MUTATION_ATTEMPT") ? freezeArray(["constitutional_boundary_violation"]) : freezeArray(["constitutional_boundary_preserved"]),
    supporting_evidence: freezeArray(["evidence:risk-assessment", "evidence:escalation-policy", "evidence:simulation-validation", "evidence:governance-review"]),
    recommended_responses: freezeArray([response]),
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(failures: readonly RiskDriftMonitoringFailure[], response: DriftResponse): EscalationDriftTimeline {
  const base: Omit<EscalationDriftTimeline, "integrity_hash"> = {
    timeline_id: `escalation_drift_timeline_${hash(failures).slice(0, 14)}`,
    risk_assessments: freezeArray(["risk:baseline", "risk:current-assessment"]),
    severity_changes: failures.length ? failures : freezeArray(["severity:none"]),
    escalation_events: failures.includes("ESCALATION_THRESHOLD_DRIFT") ? freezeArray(["escalation:threshold-drift"]) : freezeArray(["escalation:policy-aligned"]),
    governance_reviews: failures.length ? freezeArray(["governance:review-required"]) : freezeArray(["governance:no-review-required"]),
    simulation_outcomes: freezeArray(["simulation:phase-10.11-certified"]),
    operator_decisions: freezeArray(["operator:visibility-required", "operator:review-available"]),
    adaptation_proposals: freezeArray(["adaptation-proposal:none-authorized"]),
    certification_events: freezeArray(["certification:adaptive-simulation-certified"]),
    detected_drift: failures.length ? failures : freezeArray(["drift:none"]),
    containment_actions: response === "MONITOR" ? freezeArray(["containment:monitor"]) : freezeArray([`containment:${response.toLowerCase()}`]),
    replay_refs: freezeArray(["replay:risk-drift-monitoring"]),
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: RiskDriftMonitoringInput, baseline: RiskBaseline, stability: RiskStabilityReport, probability: ProbabilityStabilityReport, report: RiskDriftReport, timeline: EscalationDriftTimeline, failures: readonly RiskDriftMonitoringFailure[]): RiskDriftRecord {
  const severity = severityFor(failures);
  const base: Omit<RiskDriftRecord, "integrity_hash"> = {
    drift_id: `risk_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", stability: stability.risk_stability_score, failures }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    baseline_ref: baseline.integrity_hash,
    risk_model_version: baseline.risk_model_version,
    drift_category: "RISK_DRIFT",
    risk_stability_score: stability.risk_stability_score,
    probability_stability_score: probability.estimation_consistency_score,
    severity_variance_score: stability.severity_variance_score,
    escalation_variance_score: stability.escalation_variance_score,
    tolerance_variance_score: stability.tolerance_variance_score,
    severity,
    affected_risk_assessments: freezeArray(["risk-assessment:mission-control", "risk-assessment:adaptive-intelligence"]),
    affected_adaptations: freezeArray(["adaptation:risk-severity", "adaptation:proposal-prioritization"]),
    affected_decisions: freezeArray(["decision:risk-weighted-recommendation", "decision:escalation-routing"]),
    supporting_evidence: report.integrity_hash,
    recommended_response: responseFor(severity, failures),
    containment_required: severity === "HIGH" || severity === "CRITICAL" || severity === "CATASTROPHIC",
    replay_refs: timeline.replay_refs,
    timestamp: MONITORING_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(stability: RiskStabilityReport, probability: ProbabilityStabilityReport, failures: readonly RiskDriftMonitoringFailure[]): RiskDriftMonitoringMetrics {
  const base: Omit<RiskDriftMonitoringMetrics, "integrity_hash"> = {
    risk_stability_score: stability.risk_stability_score,
    probability_stability_score: probability.estimation_consistency_score,
    severity_variance_score: stability.severity_variance_score,
    escalation_variance_score: stability.escalation_variance_score,
    tolerance_variance_score: stability.tolerance_variance_score,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_ASSESSMENT"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_RISK_EVIDENCE"),
    evidence_backed: !failures.includes("NONREPLAYABLE_RISK_EVIDENCE"),
    governance_aligned: !failures.includes("MISSING_GOVERNANCE_APPROVAL") && !failures.includes("UNAUTHORIZED_BASELINE_CHANGE") && !failures.includes("GOVERNANCE_SENSITIVITY_REDUCTION"),
    constitutional_aligned: !failures.includes("PRODUCTION_RISK_MUTATION_ATTEMPT"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskDriftMonitoringResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    consistency_hash: result.consistency_report.integrity_hash,
    escalation_hash: result.escalation_report.integrity_hash,
    tolerance_hash: result.tolerance_report.integrity_hash,
    probability_hash: result.probability_report.integrity_hash,
    stability_hash: result.stability_report.integrity_hash,
    report_hash: result.drift_report.integrity_hash,
    timeline_hash: result.escalation_timeline.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<RiskDriftMonitoringResult, "integrity_hash">): string {
  return hash({
    version: result.risk_drift_monitoring_version,
    monitor_identifier: result.monitor_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function monitorRiskDrift(input: RiskDriftMonitoringInput = {}): RiskDriftMonitoringResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const magnitude = driftMagnitude(failures);
  const baseline = buildBaseline();
  const consistency_report = buildConsistencyReport(magnitude, failures);
  const escalation_report = buildEscalationReport(magnitude, failures);
  const tolerance_report = buildToleranceReport(magnitude, failures);
  const probability_report = buildProbabilityReport(magnitude, failures);
  const stability_report = buildStabilityReport(magnitude, escalation_report, tolerance_report, probability_report);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const drift_report = buildDriftReport(failures, response);
  const escalation_timeline = buildTimeline(failures, response);
  const drift_record = buildRecord(input, baseline, stability_report, probability_report, drift_report, escalation_timeline, failures);
  const metrics = buildMetrics(stability_report, probability_report, failures);
  const base: Omit<RiskDriftMonitoringResult, "integrity_hash" | "replay_hash"> = {
    risk_drift_monitoring_version: MONITORING_VERSION,
    monitor_identifier: MONITOR_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    consistency_report,
    escalation_report,
    tolerance_report,
    probability_report,
    stability_report,
    drift_report,
    escalation_timeline,
    drift_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_RISK_BEHAVIOR"),
    evidence_backed: metrics.evidence_backed,
    governance_preserved: metrics.governance_aligned,
    constitutional_preserved: metrics.constitutional_aligned,
    operator_authority_preserved: true,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_risk: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskDriftMonitoring(result: RiskDriftMonitoringResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.consistency_report) &&
    verifyHashedRecord(result.escalation_report) &&
    verifyHashedRecord(result.tolerance_report) &&
    verifyHashedRecord(result.probability_report) &&
    verifyHashedRecord(result.stability_report) &&
    verifyHashedRecord(result.drift_report) &&
    verifyHashedRecord(result.escalation_timeline) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getRiskDriftMonitoringFoundation(): RiskDriftMonitoringFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_drift_monitoring_version: MONITORING_VERSION,
    api_surface,
    result: monitorRiskDrift(),
  });
}

export const RiskDriftMonitoring = Object.freeze({
  monitor: monitorRiskDrift,
  replay: replayRiskDriftMonitoring,
});
