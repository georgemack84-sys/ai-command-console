import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type { DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";
import type {
  BehavioralConsistencyReport,
  DeterminismVerificationReport,
  ReplayBaseline,
  ReplayConsistencyReport,
  ReplayDriftApiSurface,
  ReplayDriftFailure,
  ReplayDriftFoundation,
  ReplayDriftInput,
  ReplayDriftMetrics,
  ReplayDriftRecord,
  ReplayDriftResult,
  ReplayDriftScenario,
  ReplayDriftStatus,
  ReplayDriftTimeline,
  ReplayIntegrityAssessment,
  ReplayReconstructionReport,
  ReplayStabilityReport,
} from "@/types/replay-drift-detection";

const DETECTION_VERSION = "replay-drift-detection/v1" as const;
const DETECTION_IDENTIFIER = "ReplayDriftDetection" as const;
const DETECTION_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<ReplayDriftInput["scenario"]>;

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

function buildApiSurface(): ReplayDriftApiSurface {
  const base: Omit<ReplayDriftApiSurface, "integrity_hash"> = {
    api_id: "replay_drift_detection_api",
    detect_replay_drift: "POST /replay-drift-detection/detect",
    retrieve_baseline: "POST /replay-drift-detection/baseline",
    retrieve_consistency: "POST /replay-drift-detection/consistency",
    retrieve_behavioral: "POST /replay-drift-detection/behavioral",
    retrieve_reconstruction: "POST /replay-drift-detection/reconstruction",
    retrieve_determinism: "POST /replay-drift-detection/determinism",
    retrieve_stability: "POST /replay-drift-detection/stability",
    retrieve_assessment: "POST /replay-drift-detection/assessment",
    retrieve_timeline: "POST /replay-drift-detection/timeline",
    retrieve_ledger_record: "POST /replay-drift-detection/ledger",
    retrieve_metrics: "POST /replay-drift-detection/metrics",
    replay_detection: "POST /replay-drift-detection/replay",
    inspect_detection: "POST /replay-drift-detection/inspect",
    retrieve_contract: "GET /replay-drift-detection/contract",
    production_mutation_supported: false,
    replay_change_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): ReplayDriftFailure | undefined {
  const map: Partial<Record<ReplayDriftScenario, ReplayDriftFailure>> = {
    UNAUTHORIZED_REPLAY_CHANGE: "UNAUTHORIZED_REPLAY_CHANGE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_DETECTED",
    BEHAVIORAL_INCONSISTENCY: "BEHAVIORAL_INCONSISTENCY_DETECTED",
    REPLAY_INSTABILITY: "REPLAY_INSTABILITY_DETECTED",
    DETERMINISTIC_FAILURE: "DETERMINISTIC_FAILURE_DETECTED",
    RECONSTRUCTION_MISMATCH: "RECONSTRUCTION_MISMATCH_DETECTED",
    ADAPTATION_INDUCED_CHANGE: "ADAPTATION_INDUCED_REPLAY_CHANGE",
    INCONSISTENT_OUTPUTS: "INCONSISTENT_REPLAY_OUTPUTS",
    SEQUENCING_DRIFT: "REPLAY_SEQUENCING_DRIFT",
    DEPENDENCY_DRIFT: "REPLAY_DEPENDENCY_DRIFT",
    STATE_CORRUPTION: "REPLAY_STATE_CORRUPTION",
    RECOMMENDATION_VARIANCE: "RECOMMENDATION_VARIANCE",
    GOVERNANCE_VARIANCE: "GOVERNANCE_VARIANCE",
    DECISION_PATH_DEVIATION: "DECISION_PATH_DEVIATION",
    EXECUTION_INCONSISTENCY: "EXECUTION_INCONSISTENCY",
    MISSING_EVENTS: "MISSING_REPLAY_EVENTS",
    INCOMPLETE_LINEAGE: "INCOMPLETE_REPLAY_LINEAGE",
    RECONSTRUCTION_CORRUPTION: "RECONSTRUCTION_CORRUPTION",
    TIMELINE_INCONSISTENCY: "TIMELINE_INCONSISTENCY",
    NONDETERMINISTIC_EXECUTION: "NONDETERMINISTIC_EXECUTION",
    INCONSISTENT_STATE_TRANSITIONS: "INCONSISTENT_STATE_TRANSITIONS",
    DEPENDENCY_INDUCED_DRIFT: "DEPENDENCY_INDUCED_DRIFT",
    ARTIFACT_INCONSISTENCY: "REPLAY_ARTIFACT_INCONSISTENCY",
    ADAPTIVE_REPLAY_DEGRADATION: "ADAPTIVE_REPLAY_DEGRADATION",
    NONREPLAYABLE_ASSESSMENT: "NONREPLAYABLE_DRIFT_ASSESSMENT",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    UNKNOWN_BEHAVIOR: "UNKNOWN_REPLAY_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly ReplayDriftFailure[] {
  const failures: ReplayDriftFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly ReplayDriftFailure[]): DriftSeverity {
  if (failures.includes("UNKNOWN_REPLAY_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("REPLAY_STATE_CORRUPTION")) return "CRITICAL";
  if (failures.some((failure) => [
    "REPLAY_DIVERGENCE_DETECTED",
    "DETERMINISTIC_FAILURE_DETECTED",
    "RECONSTRUCTION_MISMATCH_DETECTED",
    "NONDETERMINISTIC_EXECUTION",
    "INCOMPLETE_REPLAY_LINEAGE",
    "RECONSTRUCTION_CORRUPTION",
    "ADAPTIVE_REPLAY_DEGRADATION",
  ].includes(failure))) return "HIGH";
  if (failures.length) return "MODERATE";
  return "INFORMATIONAL";
}

function responseFor(severity: DriftSeverity, failures: readonly ReplayDriftFailure[]): DriftResponse {
  if (failures.includes("UNKNOWN_REPLAY_BEHAVIOR") || severity === "CRITICAL") return "FAIL_CLOSED";
  if (severity === "HIGH") return "SUPPRESS_ADAPTATION";
  if (severity === "MODERATE") return "REQUIRE_REVIEW";
  return "MONITOR";
}

function statusFor(failures: readonly ReplayDriftFailure[]): ReplayDriftStatus {
  if (failures.includes("UNKNOWN_REPLAY_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("REPLAY_STATE_CORRUPTION")) return "FAIL_CLOSED";
  if (failures.some((failure) => [
    "REPLAY_DIVERGENCE_DETECTED",
    "DETERMINISTIC_FAILURE_DETECTED",
    "RECONSTRUCTION_MISMATCH_DETECTED",
    "NONDETERMINISTIC_EXECUTION",
    "INCOMPLETE_REPLAY_LINEAGE",
    "RECONSTRUCTION_CORRUPTION",
    "ADAPTIVE_REPLAY_DEGRADATION",
  ].includes(failure))) return "CONTAINED";
  if (failures.includes("UNAUTHORIZED_REPLAY_CHANGE")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "DRIFT_DETECTED" : "PASS";
}

function integrityScore(failures: readonly ReplayDriftFailure[]): number {
  if (!failures.length) return 0.98;
  if (failures.includes("UNKNOWN_REPLAY_BEHAVIOR") || failures.includes("TENANT_ISOLATION_BREACH") || failures.includes("REPLAY_STATE_CORRUPTION")) return 0.04;
  if (failures.includes("REPLAY_DIVERGENCE_DETECTED") || failures.includes("DETERMINISTIC_FAILURE_DETECTED") || failures.includes("RECONSTRUCTION_MISMATCH_DETECTED")) return 0.16;
  return 0.55;
}

function buildBaseline(): ReplayBaseline {
  const base: Omit<ReplayBaseline, "integrity_hash"> = {
    baseline_id: "replay_drift_baseline_v1",
    replay_version: "replay-policy/v1",
    deterministic_rules: freezeArray(["identical_inputs_identical_outputs", "stable_ordering_required", "no_time_dependent_variance", "deterministic_dependency_resolution"]),
    reconstruction_requirements: freezeArray(["event_reconstruction_required", "decision_reconstruction_required", "evidence_lineage_required", "audit_reconstruction_required", "ledger_reconstruction_required"]),
    validation_policies: freezeArray(["pre_production_replay_validation", "drift_containment_on_divergence", "forensic_evidence_preservation", "repeatable_validation_required"]),
    governance_requirements: freezeArray(["governance_review_for_replay_change", "operator_visibility_required", "auditability_preserved"]),
    constitutional_requirements: freezeArray(["replayability_nonnegotiable", "tenant_isolation_required", "operator_authority_preserved"]),
    certification_requirements: freezeArray(["certification_before_replay_recovery", "certification_before_adaptation_release", "replay_integrity_evidence_required"]),
    approval_reference: "governance-approval:replay-drift-baseline:v1",
    effective_date: "2026-07-11",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function consistencyFailures(failures: readonly ReplayDriftFailure[]): readonly ReplayDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "REPLAY_DIVERGENCE_DETECTED",
    "INCONSISTENT_REPLAY_OUTPUTS",
    "REPLAY_SEQUENCING_DRIFT",
    "REPLAY_ARTIFACT_INCONSISTENCY",
    "ADAPTATION_INDUCED_REPLAY_CHANGE",
  ].includes(failure)));
}

function behavioralFailures(failures: readonly ReplayDriftFailure[]): readonly ReplayDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "BEHAVIORAL_INCONSISTENCY_DETECTED",
    "RECOMMENDATION_VARIANCE",
    "GOVERNANCE_VARIANCE",
    "DECISION_PATH_DEVIATION",
    "EXECUTION_INCONSISTENCY",
  ].includes(failure)));
}

function reconstructionFailures(failures: readonly ReplayDriftFailure[]): readonly ReplayDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "RECONSTRUCTION_MISMATCH_DETECTED",
    "MISSING_REPLAY_EVENTS",
    "INCOMPLETE_REPLAY_LINEAGE",
    "RECONSTRUCTION_CORRUPTION",
    "TIMELINE_INCONSISTENCY",
  ].includes(failure)));
}

function determinismFailures(failures: readonly ReplayDriftFailure[]): readonly ReplayDriftFailure[] {
  return freezeArray(failures.filter((failure) => [
    "DETERMINISTIC_FAILURE_DETECTED",
    "NONDETERMINISTIC_EXECUTION",
    "INCONSISTENT_STATE_TRANSITIONS",
    "DEPENDENCY_INDUCED_DRIFT",
    "REPLAY_INSTABILITY_DETECTED",
    "REPLAY_DEPENDENCY_DRIFT",
  ].includes(failure)));
}

function buildConsistency(score: number, failures: readonly ReplayDriftFailure[]): ReplayConsistencyReport {
  const detected = consistencyFailures(failures);
  const base: Omit<ReplayConsistencyReport, "integrity_hash"> = {
    report_id: `replay_consistency_${hash({ score, failures }).slice(0, 14)}`,
    output_consistency_score: failures.includes("INCONSISTENT_REPLAY_OUTPUTS") || failures.includes("REPLAY_DIVERGENCE_DETECTED") ? 0.18 : score,
    decision_path_consistency_score: failures.includes("DECISION_PATH_DEVIATION") ? 0.28 : score,
    recommendation_ordering_score: failures.includes("REPLAY_SEQUENCING_DRIFT") ? 0.32 : score,
    governance_evaluation_score: failures.includes("GOVERNANCE_VARIANCE") ? 0.3 : score,
    evidence_lineage_score: failures.includes("INCOMPLETE_REPLAY_LINEAGE") ? 0.22 : score,
    artifact_consistency_score: failures.includes("REPLAY_ARTIFACT_INCONSISTENCY") ? 0.29 : score,
    replay_difference_summary: detected.length ? "Replay differences detected against approved deterministic baseline." : "No replay differences detected.",
    behavioral_comparison_matrix: detected.length ? freezeArray(["baseline:approved", "candidate:divergent", "difference:contained"]) : freezeArray(["baseline:approved", "candidate:identical", "difference:none"]),
    detected_differences: detected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildBehavioral(score: number, failures: readonly ReplayDriftFailure[]): BehavioralConsistencyReport {
  const detected = behavioralFailures(failures);
  const base: Omit<BehavioralConsistencyReport, "integrity_hash"> = {
    report_id: `behavioral_consistency_${hash({ score, failures }).slice(0, 14)}`,
    decision_consistency_score: failures.includes("DECISION_PATH_DEVIATION") ? 0.27 : score,
    recommendation_consistency_score: failures.includes("RECOMMENDATION_VARIANCE") ? 0.3 : score,
    evidence_processing_score: Number((score - 0.01).toFixed(2)),
    governance_behavior_score: failures.includes("GOVERNANCE_VARIANCE") ? 0.3 : score,
    operator_visibility_score: score,
    audit_generation_score: score,
    certification_behavior_score: score,
    decision_variance_analysis: detected.length ? "Behavioral variance detected during replay." : "Replay behavior matches approved execution behavior.",
    detected_variances: detected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReconstruction(score: number, failures: readonly ReplayDriftFailure[]): ReplayReconstructionReport {
  const detected = reconstructionFailures(failures);
  const base: Omit<ReplayReconstructionReport, "integrity_hash"> = {
    report_id: `replay_reconstruction_${hash({ score, failures }).slice(0, 14)}`,
    event_reconstruction_score: failures.includes("MISSING_REPLAY_EVENTS") ? 0.2 : score,
    decision_reconstruction_score: failures.includes("RECONSTRUCTION_MISMATCH_DETECTED") ? 0.18 : score,
    recommendation_reconstruction_score: score,
    evidence_reconstruction_score: failures.includes("INCOMPLETE_REPLAY_LINEAGE") ? 0.22 : score,
    governance_reconstruction_score: score,
    simulation_reconstruction_score: score,
    audit_reconstruction_score: failures.includes("TIMELINE_INCONSISTENCY") ? 0.31 : score,
    ledger_reconstruction_score: failures.includes("RECONSTRUCTION_CORRUPTION") ? 0.12 : score,
    reconstruction_integrity_summary: detected.length ? "Replay reconstruction cannot be fully trusted until reviewed." : "Replay reconstruction is complete and deterministic.",
    reconstruction_failures: detected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDeterminism(score: number, failures: readonly ReplayDriftFailure[]): DeterminismVerificationReport {
  const detected = determinismFailures(failures);
  const base: Omit<DeterminismVerificationReport, "integrity_hash"> = {
    report_id: `determinism_verification_${hash({ score, failures }).slice(0, 14)}`,
    deterministic_execution_score: failures.includes("DETERMINISTIC_FAILURE_DETECTED") || failures.includes("NONDETERMINISTIC_EXECUTION") ? 0.15 : score,
    identical_output_score: failures.includes("INCONSISTENT_REPLAY_OUTPUTS") ? 0.18 : score,
    state_consistency_score: failures.includes("INCONSISTENT_STATE_TRANSITIONS") ? 0.25 : score,
    reproducibility_score: failures.includes("NONREPLAYABLE_DRIFT_ASSESSMENT") ? 0.24 : score,
    ordering_consistency_score: failures.includes("REPLAY_SEQUENCING_DRIFT") ? 0.32 : score,
    dependency_consistency_score: failures.includes("DEPENDENCY_INDUCED_DRIFT") || failures.includes("REPLAY_DEPENDENCY_DRIFT") ? 0.26 : score,
    execution_integrity_score: failures.includes("EXECUTION_INCONSISTENCY") ? 0.3 : score,
    execution_stability_analysis: detected.length ? "Deterministic execution degraded and is contained." : "Deterministic execution preserved across replay sessions.",
    deterministic_failures: detected,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStability(score: number, consistency: ReplayConsistencyReport, behavioral: BehavioralConsistencyReport, reconstruction: ReplayReconstructionReport, determinism: DeterminismVerificationReport): ReplayStabilityReport {
  const replay_drift_score = Number((1 - score).toFixed(2));
  const base: Omit<ReplayStabilityReport, "integrity_hash"> = {
    score_id: `replay_stability_${hash({ score, consistency: consistency.integrity_hash }).slice(0, 14)}`,
    replay_consistency_score: consistency.output_consistency_score,
    determinism_score: determinism.deterministic_execution_score,
    reconstruction_score: reconstruction.decision_reconstruction_score,
    behavioral_consistency_score: behavioral.decision_consistency_score,
    dependency_stability_score: determinism.dependency_consistency_score,
    replay_integrity_score: score,
    replay_drift_score,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function containmentActions(failures: readonly ReplayDriftFailure[], response: DriftResponse): readonly string[] {
  if (!failures.length) return freezeArray(["monitor_replay_integrity"]);
  const actions = ["suppress_replay_divergent_adaptation", "quarantine_replay_failure", "require_deterministic_replay_validation", "preserve_forensic_evidence", "notify_operators"];
  if (response === "FAIL_CLOSED") actions.push("fail_closed");
  if (response !== "MONITOR") actions.push("require_governance_review", "require_certification_before_recovery");
  return freezeArray(actions);
}

function buildAssessment(failures: readonly ReplayDriftFailure[], severity: DriftSeverity, response: DriftResponse, actions: readonly string[]): ReplayIntegrityAssessment {
  const base: Omit<ReplayIntegrityAssessment, "integrity_hash"> = {
    assessment_id: `replay_integrity_${hash(failures).slice(0, 14)}`,
    drift_detected: failures.length > 0,
    detected_behaviors: failures,
    affected_replay_refs: failures.length ? freezeArray(["replay:adaptive-proposal", "replay:simulation", "replay:governance-evaluation"]) : freezeArray([]),
    replay_consistency: failures.length ? "Replay consistency violation detected." : "Replay consistency preserved.",
    replay_divergence: failures.includes("REPLAY_DIVERGENCE_DETECTED") ? "Replay divergence detected before production." : "No replay divergence detected.",
    behavioral_analysis: behavioralFailures(failures).length ? "Replay behavior differs from approved execution behavior." : "Behavioral replay equivalence preserved.",
    reconstruction_analysis: reconstructionFailures(failures).length ? "Replay reconstruction requires containment and review." : "Replay reconstruction complete.",
    deterministic_verification: determinismFailures(failures).length ? "Determinism verification failed." : "Deterministic verification passed.",
    governance_impacts: failures.length ? freezeArray(["governance_review_required"]) : freezeArray(["governance_preserved"]),
    certification_impacts: failures.length ? freezeArray(["certification_required_before_recovery"]) : freezeArray(["certification_ready"]),
    supporting_evidence: freezeArray(["evidence:replay-snapshots", "evidence:behavioral-matrix", "evidence:reconstruction-ledger", "evidence:determinism-trace"]),
    recommended_response: response,
    containment_actions: actions,
    severity,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: true,
    audit_ready: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTimeline(failures: readonly ReplayDriftFailure[], actions: readonly string[]): ReplayDriftTimeline {
  const base: Omit<ReplayDriftTimeline, "integrity_hash"> = {
    timeline_id: `replay_drift_timeline_${hash(failures).slice(0, 14)}`,
    replay_executions: freezeArray(["replay:baseline", "replay:candidate", "replay:verification"]),
    replay_validations: freezeArray(["validation:consistency", "validation:determinism", "validation:reconstruction"]),
    replay_drift_events: failures,
    deterministic_failures: determinismFailures(failures),
    reconstruction_events: reconstructionFailures(failures).length ? freezeArray(["reconstruction:contained"]) : freezeArray(["reconstruction:complete"]),
    governance_reviews: failures.length ? freezeArray(["governance:required"]) : freezeArray([]),
    certification_outcomes: failures.length ? freezeArray(["certification:blocked_until_recovery"]) : freezeArray(["certification:ready"]),
    containment_actions: actions,
    replay_recoveries: failures.length ? freezeArray(["recovery:pending_certification"]) : freezeArray([]),
    operator_reviews: failures.length ? freezeArray(["operator:notification_required"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: ReplayDriftInput, baseline: ReplayBaseline, stability: ReplayStabilityReport, assessment: ReplayIntegrityAssessment): ReplayDriftRecord {
  const base: Omit<ReplayDriftRecord, "integrity_hash"> = {
    drift_id: `replay_drift_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", failures: assessment.detected_behaviors, score: stability.replay_integrity_score }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    replay_version: baseline.replay_version,
    drift_category: assessment.detected_behaviors[0] ?? "NO_REPLAY_DRIFT",
    replay_drift_score: stability.replay_drift_score,
    replay_integrity_score: stability.replay_integrity_score,
    determinism_score: stability.determinism_score,
    reconstruction_score: stability.reconstruction_score,
    behavioral_consistency_score: stability.behavioral_consistency_score,
    severity: assessment.severity,
    affected_replay_refs: assessment.affected_replay_refs,
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:simulation"]),
    affected_recommendations: freezeArray(["recommendation:adaptive", "recommendation:governance-reviewed"]),
    supporting_evidence: assessment.integrity_hash,
    recommended_response: assessment.recommended_response,
    containment_required: assessment.detected_behaviors.length > 0,
    governance_impact: assessment.detected_behaviors.length ? "governance_review_required" : "governance_preserved",
    certification_impact: assessment.detected_behaviors.length ? "certification_blocked_until_replay_recovery" : "certification_ready",
    replay_refs: freezeArray(["replay:replay-drift-detection"]),
    timestamp: DETECTION_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(stability: ReplayStabilityReport, assessment: ReplayIntegrityAssessment, failures: readonly ReplayDriftFailure[]): ReplayDriftMetrics {
  const base: Omit<ReplayDriftMetrics, "integrity_hash"> = {
    replay_drift_score: stability.replay_drift_score,
    replay_integrity_score: stability.replay_integrity_score,
    determinism_score: stability.determinism_score,
    reconstruction_score: stability.reconstruction_score,
    behavioral_consistency_score: stability.behavioral_consistency_score,
    containment_required: assessment.detected_behaviors.length > 0,
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_EXECUTION"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_DRIFT_ASSESSMENT"),
    governance_preserved: !failures.includes("UNAUTHORIZED_REPLAY_CHANGE") && !failures.includes("GOVERNANCE_VARIANCE"),
    certification_preserved: !failures.includes("ADAPTIVE_REPLAY_DEGRADATION") && !failures.includes("RECONSTRUCTION_MISMATCH_DETECTED"),
    operator_authority_preserved: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ReplayDriftResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    baseline_hash: result.baseline.integrity_hash,
    consistency_hash: result.consistency_report.integrity_hash,
    behavioral_hash: result.behavioral_report.integrity_hash,
    reconstruction_hash: result.reconstruction_report.integrity_hash,
    determinism_hash: result.determinism_report.integrity_hash,
    stability_hash: result.stability_report.integrity_hash,
    assessment_hash: result.integrity_assessment.integrity_hash,
    timeline_hash: result.timeline.integrity_hash,
    record_hash: result.drift_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ReplayDriftResult, "integrity_hash">): string {
  return hash({
    version: result.replay_drift_detection_version,
    detection_identifier: result.detection_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.drift_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function detectReplayDrift(input: ReplayDriftInput = {}): ReplayDriftResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const integrity = integrityScore(failures);
  const severity = severityFor(failures);
  const response = responseFor(severity, failures);
  const actions = containmentActions(failures, response);
  const baseline = buildBaseline();
  const consistency_report = buildConsistency(integrity, failures);
  const behavioral_report = buildBehavioral(integrity, failures);
  const reconstruction_report = buildReconstruction(integrity, failures);
  const determinism_report = buildDeterminism(integrity, failures);
  const stability_report = buildStability(integrity, consistency_report, behavioral_report, reconstruction_report, determinism_report);
  const integrity_assessment = buildAssessment(failures, severity, response, actions);
  const timeline = buildTimeline(failures, actions);
  const drift_record = buildRecord(input, baseline, stability_report, integrity_assessment);
  const metrics = buildMetrics(stability_report, integrity_assessment, failures);
  const base: Omit<ReplayDriftResult, "integrity_hash" | "replay_hash"> = {
    replay_drift_detection_version: DETECTION_VERSION,
    detection_identifier: DETECTION_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    architecture_result,
    baseline,
    consistency_report,
    behavioral_report,
    reconstruction_report,
    determinism_report,
    stability_report,
    integrity_assessment,
    timeline,
    drift_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_REPLAY_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_DRIFT_ASSESSMENT"),
    governance_preserved: metrics.governance_preserved,
    certification_preserved: metrics.certification_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_replay_change: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayReplayDriftDetection(result: ReplayDriftResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.baseline) &&
    verifyHashedRecord(result.consistency_report) &&
    verifyHashedRecord(result.behavioral_report) &&
    verifyHashedRecord(result.reconstruction_report) &&
    verifyHashedRecord(result.determinism_report) &&
    verifyHashedRecord(result.stability_report) &&
    verifyHashedRecord(result.integrity_assessment) &&
    verifyHashedRecord(result.timeline) &&
    verifyHashedRecord(result.drift_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getReplayDriftFoundation(): ReplayDriftFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    replay_drift_detection_version: DETECTION_VERSION,
    api_surface,
    result: detectReplayDrift(),
  });
}

export const ReplayDriftDetection = Object.freeze({
  detect: detectReplayDrift,
  replay: replayReplayDriftDetection,
});
