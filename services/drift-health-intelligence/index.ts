import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildRuntimeObservationPackage, computeRuntimeObservationHash, computeSupervisionEventHash } from "@/services/runtime-observation-engine";
import type { RuntimeObservationPackage, RuntimeObservationScenario } from "@/types/runtime-observation-engine";
import type {
  ConfidenceTrendState,
  DriftCategory,
  DriftHealthDashboardSurface,
  DriftHealthEvidence,
  DriftHealthFailureReason,
  DriftHealthFramework,
  DriftHealthPackage,
  DriftHealthReplayResult,
  DriftHealthScenario,
  DriftHealthState,
  DriftHealthValidationResult,
  DriftIntelligence,
  DriftRuntimeHealthLevel,
  DriftSeverity,
  GovernanceDriftState,
  HealthAssessment,
  SupervisionAlert,
} from "@/types/drift-health-intelligence";

const NOW = "2026-06-29T23:30:00.000Z";
const ENGINE_VERSION = "drift-health-intelligence/v8E.C" as const;
const PIPELINE = Object.freeze(["Observation Received", "Normalization", "Baseline Comparison", "Drift Detection", "Severity Assessment", "Health Evaluation", "Trend Projection", "Alert Generation", "Evidence Recording"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function observationScenarioFor(scenario: DriftHealthScenario): RuntimeObservationScenario {
  if (scenario === "GOVERNANCE_DRIFT_NOT_IDENTIFIED" as never) return "GOVERNANCE_MISSING";
  if (scenario === "POLICY_DRIFT") return "GOVERNANCE_MISSING";
  if (scenario === "CONSTITUTIONAL_DRIFT") return "CONSTITUTION_UNOBSERVABLE";
  if (scenario === "AUTHORITY_DRIFT") return "AUTHORITY_UNAVAILABLE";
  if (scenario === "CONFIDENCE_DEGRADATION") return "CONFIDENCE_MISSING";
  if (scenario === "HEALTH_DEGRADATION") return "HEALTH_MISSING";
  if (scenario === "EVIDENCE_INCOMPLETE" || scenario === "EVIDENCE_DETERIORATION") return "EVIDENCE_MISSING";
  if (scenario === "REPLAY_MISMATCH" || scenario === "TREND_REPLAY_FAILED") return "REPLAY_MISMATCH";
  if (scenario === "TENANT_VIOLATION") return "TENANT_VIOLATION";
  if (scenario === "HIDDEN_ANALYSIS") return "HIDDEN_OBSERVATION_CHANNEL";
  if (scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  return "BASELINE";
}

function scenarioFailures(scenario: DriftHealthScenario): readonly DriftHealthFailureReason[] {
  const map: Partial<Record<DriftHealthScenario, DriftHealthFailureReason>> = {
    WORKFLOW_DEVIATION: "WORKFLOW_DEVIATION_MISSED",
    CHECKPOINT_VIOLATION: "CHECKPOINT_VIOLATION_MISSED",
    ORDERING_VIOLATION: "ORDERING_DRIFT_MISSED",
    UNAUTHORIZED_STATE_TRANSITION: "EXECUTION_DRIFT_NOT_DETECTED",
    POLICY_DRIFT: "GOVERNANCE_DRIFT_NOT_IDENTIFIED",
    AUTHORITY_DRIFT: "AUTHORITY_DRIFT_NOT_RECOGNIZED",
    CONSTITUTIONAL_DRIFT: "CONSTITUTIONAL_DRIFT_NOT_DETECTED",
    CONFIDENCE_DEGRADATION: "CONFIDENCE_DEGRADATION_NOT_MEASURED",
    EVIDENCE_DETERIORATION: "EVIDENCE_DETERIORATION_NOT_IDENTIFIED",
    HEALTH_DEGRADATION: "HEALTH_DEGRADATION_NOT_ASSESSED",
    RETRY_STORM: "RETRY_STORM_MISSED",
    DEPENDENCY_FAILURE: "DEPENDENCY_FAILURE_MISSED",
    SEVERITY_NONDETERMINISTIC: "SEVERITY_SCORING_NONDETERMINISTIC",
    TREND_REPLAY_FAILED: "TREND_ANALYSIS_NOT_REPRODUCIBLE",
    ALERT_INCOMPLETE: "SUPERVISION_ALERT_INCOMPLETE",
    EVIDENCE_INCOMPLETE: "DRIFT_EVIDENCE_INCOMPLETE",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    HIDDEN_ANALYSIS: "HIDDEN_ANALYTICAL_STATE_DETECTED",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function collectFailures(observationPackage: RuntimeObservationPackage, scenario: DriftHealthScenario): readonly DriftHealthFailureReason[] {
  const failures: DriftHealthFailureReason[] = [...scenarioFailures(scenario)];
  for (const failure of observationPackage.validation.failures) {
    if (failure === "EXECUTION_PROGRESS_UNOBSERVABLE") failures.push("EXECUTION_DRIFT_NOT_DETECTED");
    if (failure === "GOVERNANCE_OBSERVATION_MISSING") failures.push("GOVERNANCE_DRIFT_NOT_IDENTIFIED");
    if (failure === "CONSTITUTIONAL_OBSERVATION_MISSING") failures.push("CONSTITUTIONAL_DRIFT_NOT_DETECTED");
    if (failure === "AUTHORITY_VALIDATION_UNAVAILABLE") failures.push("AUTHORITY_DRIFT_NOT_RECOGNIZED");
    if (failure === "CONFIDENCE_METRICS_MISSING") failures.push("CONFIDENCE_DEGRADATION_NOT_MEASURED");
    if (failure === "HEALTH_METRICS_MISSING") failures.push("HEALTH_DEGRADATION_NOT_ASSESSED");
    if (failure === "RUNTIME_EVIDENCE_MISSING") failures.push("DRIFT_EVIDENCE_INCOMPLETE");
    if (failure === "REPLAY_RECONSTRUCTION_MISMATCH") failures.push("REPLAY_RECONSTRUCTION_MISMATCH");
    if (failure === "TENANT_ISOLATION_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATION");
    if (failure === "INTEGRITY_HASH_MISMATCH") failures.push("INTEGRITY_HASH_MISMATCH");
    if (failure === "HIDDEN_OBSERVATION_CHANNEL_DETECTED") failures.push("HIDDEN_ANALYTICAL_STATE_DETECTED");
  }
  return unique(failures);
}

function severityFor(failures: readonly DriftHealthFailureReason[]): DriftSeverity {
  if (failures.some((failure) => ["TENANT_ISOLATION_VIOLATION", "INTEGRITY_HASH_MISMATCH", "HIDDEN_ANALYTICAL_STATE_DETECTED", "CONSTITUTIONAL_DRIFT_NOT_DETECTED"].includes(failure))) return "CRITICAL";
  if (failures.some((failure) => ["GOVERNANCE_DRIFT_NOT_IDENTIFIED", "AUTHORITY_DRIFT_NOT_RECOGNIZED", "REPLAY_RECONSTRUCTION_MISMATCH"].includes(failure))) return "HIGH";
  if (failures.some((failure) => ["EXECUTION_DRIFT_NOT_DETECTED", "WORKFLOW_DEVIATION_MISSED", "HEALTH_DEGRADATION_NOT_ASSESSED", "CONFIDENCE_DEGRADATION_NOT_MEASURED"].includes(failure))) return "MEDIUM";
  if (failures.length) return "LOW";
  return "NONE";
}

function healthLevel(score: number): DriftRuntimeHealthLevel {
  if (score >= 96) return "OPTIMAL";
  if (score >= 88) return "HEALTHY";
  if (score >= 75) return "STABLE";
  if (score >= 55) return "DEGRADED";
  if (score >= 30) return "HIGH_RISK";
  return "CRITICAL";
}

function trendFor(failures: readonly DriftHealthFailureReason[]): ConfidenceTrendState {
  if (failures.some((failure) => ["CONFIDENCE_DEGRADATION_NOT_MEASURED", "EVIDENCE_DETERIORATION_NOT_IDENTIFIED"].includes(failure))) return "COLLAPSED";
  if (failures.some((failure) => ["SEVERITY_SCORING_NONDETERMINISTIC", "TREND_ANALYSIS_NOT_REPRODUCIBLE"].includes(failure))) return "UNSTABLE";
  if (failures.length) return "DECLINING";
  return "STABLE";
}

function governanceStateFor(failures: readonly DriftHealthFailureReason[]): GovernanceDriftState {
  const severity = severityFor(failures);
  if (severity === "CRITICAL") return "CRITICAL_DRIFT";
  if (severity === "HIGH") return "MAJOR_DRIFT";
  if (severity === "MEDIUM") return "MODERATE_DRIFT";
  if (severity === "LOW") return "MINOR_DRIFT";
  return "COMPLIANT";
}

function categoryFor(failures: readonly DriftHealthFailureReason[]): DriftCategory {
  if (failures.some((failure) => ["GOVERNANCE_DRIFT_NOT_IDENTIFIED", "AUTHORITY_DRIFT_NOT_RECOGNIZED", "CONSTITUTIONAL_DRIFT_NOT_DETECTED"].includes(failure))) return "GOVERNANCE";
  if (failures.some((failure) => ["CONFIDENCE_DEGRADATION_NOT_MEASURED", "EVIDENCE_DETERIORATION_NOT_IDENTIFIED"].includes(failure))) return "CONFIDENCE";
  if (failures.some((failure) => ["HEALTH_DEGRADATION_NOT_ASSESSED", "RETRY_STORM_MISSED", "DEPENDENCY_FAILURE_MISSED"].includes(failure))) return "HEALTH";
  return "EXECUTION";
}

function driftHashSource(drift: Omit<DriftIntelligence, "integrity_hash"> | DriftIntelligence) {
  return {
    drift_id: drift.drift_id,
    execution_id: drift.execution_id,
    mission_id: drift.mission_id,
    tenant_id: drift.tenant_id,
    drift_category: drift.drift_category,
    drift_type: drift.drift_type,
    expected_behavior: drift.expected_behavior,
    observed_behavior: drift.observed_behavior,
    severity: drift.severity,
    confidence: drift.confidence,
    impact_score: drift.impact_score,
    affected_components: drift.affected_components,
    supporting_observations: drift.supporting_observations,
    timestamp: drift.timestamp,
    evidence_reference: drift.evidence_reference,
    replay_reference: drift.replay_reference,
    lineage_reference: drift.lineage_reference,
  };
}

export function computeDriftIntelligenceHash(drift: Omit<DriftIntelligence, "integrity_hash"> | DriftIntelligence): string {
  return hashValue("drift-health-drift-intelligence", driftHashSource(drift));
}

function buildDrift(observationPackage: RuntimeObservationPackage, failures: readonly DriftHealthFailureReason[], scenario: DriftHealthScenario): DriftIntelligence {
  const observation = observationPackage.observation;
  const severity = severityFor(failures);
  const source = {
    drift_id: id("DHI", "drift-health-drift-id", { observation: observation.observation_id, scenario }),
    execution_id: observation.execution_id,
    mission_id: observation.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : observation.tenant_id,
    drift_category: categoryFor(failures),
    drift_type: failures[0] ?? "NO_DRIFT",
    expected_behavior: "approved execution remains governed, observable, replayable, and confidence-stable",
    observed_behavior: failures.length ? failures.join(",") : "observed behavior matches approved baseline",
    severity,
    confidence: failures.includes("CONFIDENCE_DEGRADATION_NOT_MEASURED") ? 0.2 : 0.94,
    impact_score: severity === "CRITICAL" ? 100 : severity === "HIGH" ? 82 : severity === "MEDIUM" ? 58 : severity === "LOW" ? 25 : 0,
    affected_components: freezeArray(failures.length ? [categoryFor(failures).toLowerCase(), "runtime-supervision"] : ["none"]),
    supporting_observations: freezeArray([observation.integrity_hash]),
    timestamp: NOW,
    evidence_reference: scenario === "EVIDENCE_INCOMPLETE" ? "" : observationPackage.runtime_evidence.integrity_hash,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : observation.replay_reference,
    lineage_reference: observation.lineage_reference,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-drift-intelligence" : computeDriftIntelligenceHash(source) });
}

function healthHashSource(health: Omit<HealthAssessment, "integrity_hash"> | HealthAssessment) {
  return {
    assessment_id: health.assessment_id,
    execution_id: health.execution_id,
    mission_id: health.mission_id,
    tenant_id: health.tenant_id,
    runtime_health: health.runtime_health,
    execution_health: health.execution_health,
    governance_health: health.governance_health,
    confidence_health: health.confidence_health,
    dependency_health: health.dependency_health,
    resource_health: health.resource_health,
    overall_health_score: health.overall_health_score,
    degradation_trend: health.degradation_trend,
    timestamp: health.timestamp,
    replay_reference: health.replay_reference,
  };
}

export function computeHealthAssessmentHash(health: Omit<HealthAssessment, "integrity_hash"> | HealthAssessment): string {
  return hashValue("drift-health-health-assessment", healthHashSource(health));
}

function buildHealth(observationPackage: RuntimeObservationPackage, failures: readonly DriftHealthFailureReason[], drift: DriftIntelligence, scenario: DriftHealthScenario): HealthAssessment {
  const score = Math.max(0, 100 - drift.impact_score);
  const source = {
    assessment_id: id("DHH", "drift-health-assessment-id", drift.drift_id),
    execution_id: drift.execution_id,
    mission_id: drift.mission_id,
    tenant_id: drift.tenant_id,
    runtime_health: healthLevel(score),
    execution_health: healthLevel(failures.some((failure) => ["EXECUTION_DRIFT_NOT_DETECTED", "WORKFLOW_DEVIATION_MISSED", "CHECKPOINT_VIOLATION_MISSED", "ORDERING_DRIFT_MISSED"].includes(failure)) ? 58 : 96),
    governance_health: healthLevel(failures.some((failure) => ["GOVERNANCE_DRIFT_NOT_IDENTIFIED", "AUTHORITY_DRIFT_NOT_RECOGNIZED", "CONSTITUTIONAL_DRIFT_NOT_DETECTED"].includes(failure)) ? 42 : 96),
    confidence_health: healthLevel(failures.includes("CONFIDENCE_DEGRADATION_NOT_MEASURED") ? 20 : 96),
    dependency_health: healthLevel(failures.includes("DEPENDENCY_FAILURE_MISSED") ? 40 : 96),
    resource_health: healthLevel(failures.includes("RETRY_STORM_MISSED") ? 50 : 96),
    overall_health_score: score,
    degradation_trend: trendFor(failures),
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : observationPackage.observation.replay_reference,
  };
  return Object.freeze({ ...source, integrity_hash: computeHealthAssessmentHash(source) });
}

function alertHashSource(alert: Omit<SupervisionAlert, "integrity_hash"> | SupervisionAlert) {
  return {
    alert_id: alert.alert_id,
    execution_id: alert.execution_id,
    mission_id: alert.mission_id,
    tenant_id: alert.tenant_id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    detected_drift: alert.detected_drift,
    health_state: alert.health_state,
    confidence_state: alert.confidence_state,
    governance_state: alert.governance_state,
    recommended_action: alert.recommended_action,
    evidence_reference: alert.evidence_reference,
    replay_reference: alert.replay_reference,
    timestamp: alert.timestamp,
  };
}

export function computeSupervisionAlertHash(alert: Omit<SupervisionAlert, "integrity_hash"> | SupervisionAlert): string {
  return hashValue("drift-health-supervision-alert", alertHashSource(alert));
}

function buildAlert(drift: DriftIntelligence, health: HealthAssessment, failures: readonly DriftHealthFailureReason[], scenario: DriftHealthScenario): SupervisionAlert {
  const source = {
    alert_id: id("DHA", "drift-health-alert-id", drift.drift_id),
    execution_id: drift.execution_id,
    mission_id: drift.mission_id,
    tenant_id: drift.tenant_id,
    alert_type: scenario === "ALERT_INCOMPLETE" ? "" : drift.severity === "NONE" ? "NO_ALERT" : `${drift.drift_category}_DRIFT_ALERT`,
    severity: drift.severity,
    detected_drift: freezeArray(scenario === "ALERT_INCOMPLETE" ? [] : failures),
    health_state: health.runtime_health,
    confidence_state: health.degradation_trend,
    governance_state: governanceStateFor(failures),
    recommended_action: drift.severity === "CRITICAL" ? "RECOMMEND_ESCALATION" : drift.severity === "NONE" ? "CONTINUE_MONITORING" : "INCREASE_SUPERVISION",
    evidence_reference: drift.evidence_reference,
    replay_reference: drift.replay_reference,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeSupervisionAlertHash(source) });
}

function evidenceHashSource(evidence: Omit<DriftHealthEvidence, "integrity_hash"> | DriftHealthEvidence) {
  return {
    evidence_id: evidence.evidence_id,
    drift_id: evidence.drift_id,
    assessment_id: evidence.assessment_id,
    alert_id: evidence.alert_id,
    execution_id: evidence.execution_id,
    mission_id: evidence.mission_id,
    tenant_id: evidence.tenant_id,
    supporting_observations: evidence.supporting_observations,
    severity_score: evidence.severity_score,
    trend_state: evidence.trend_state,
    correlation_factors: evidence.correlation_factors,
    truth_ledger_reference: evidence.truth_ledger_reference,
    replay_reference: evidence.replay_reference,
    lineage_reference: evidence.lineage_reference,
    timestamp: evidence.timestamp,
  };
}

export function computeDriftHealthEvidenceHash(evidence: Omit<DriftHealthEvidence, "integrity_hash"> | DriftHealthEvidence): string {
  return hashValue("drift-health-evidence", evidenceHashSource(evidence));
}

function buildEvidence(drift: DriftIntelligence, health: HealthAssessment, alert: SupervisionAlert, observationPackage: RuntimeObservationPackage, scenario: DriftHealthScenario): DriftHealthEvidence {
  const source = {
    evidence_id: id("DHE", "drift-health-evidence-id", drift.drift_id),
    drift_id: drift.drift_id,
    assessment_id: health.assessment_id,
    alert_id: alert.alert_id,
    execution_id: drift.execution_id,
    mission_id: drift.mission_id,
    tenant_id: drift.tenant_id,
    supporting_observations: freezeArray(scenario === "EVIDENCE_INCOMPLETE" ? [] : [observationPackage.observation.integrity_hash, observationPackage.runtime_evidence.integrity_hash]),
    severity_score: drift.impact_score,
    trend_state: health.degradation_trend,
    correlation_factors: freezeArray(scenario === "TREND_REPLAY_FAILED" ? [] : [drift.drift_category, health.runtime_health, alert.recommended_action]),
    truth_ledger_reference: scenario === "EVIDENCE_INCOMPLETE" ? "" : `truth-ledger:drift-health:${drift.drift_id}`,
    replay_reference: drift.replay_reference,
    lineage_reference: drift.lineage_reference,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeDriftHealthEvidenceHash(source) });
}

function validatePackage(pkgBase: Omit<DriftHealthPackage, "validation" | "replay" | "package_hash">, scenario: DriftHealthScenario): DriftHealthValidationResult {
  const failures: DriftHealthFailureReason[] = [...collectFailures(pkgBase.source_observation_package, scenario)];
  if (!pkgBase.drift_intelligence.supporting_observations.length) failures.push("EXECUTION_DRIFT_NOT_DETECTED");
  if (!pkgBase.drift_intelligence.evidence_reference) failures.push("DRIFT_EVIDENCE_INCOMPLETE");
  if (!pkgBase.drift_intelligence.replay_reference || !pkgBase.health_assessment.replay_reference || !pkgBase.supervision_alert.replay_reference || !pkgBase.drift_evidence.replay_reference) failures.push("REPLAY_RECONSTRUCTION_MISMATCH");
  if (!pkgBase.drift_intelligence.lineage_reference || !pkgBase.drift_evidence.lineage_reference) failures.push("DRIFT_EVIDENCE_INCOMPLETE");
  if (pkgBase.drift_intelligence.tenant_id !== pkgBase.source_observation_package.observation.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!pkgBase.supervision_alert.alert_type || !pkgBase.supervision_alert.detected_drift.length && pkgBase.drift_intelligence.severity !== "NONE") failures.push("SUPERVISION_ALERT_INCOMPLETE");
  if (!pkgBase.drift_evidence.supporting_observations.length || !pkgBase.drift_evidence.truth_ledger_reference) failures.push("DRIFT_EVIDENCE_INCOMPLETE");
  if (!pkgBase.drift_evidence.correlation_factors.length) failures.push("TREND_ANALYSIS_NOT_REPRODUCIBLE");
  if (!pkgBase.advisory_only || pkgBase.execution_modified || pkgBase.governance_modified || pkgBase.adaptive_behavior_triggered || pkgBase.hidden_analysis_used) failures.push("HIDDEN_ANALYTICAL_STATE_DETECTED");
  if (computeDriftIntelligenceHash(pkgBase.drift_intelligence) !== pkgBase.drift_intelligence.integrity_hash || computeHealthAssessmentHash(pkgBase.health_assessment) !== pkgBase.health_assessment.integrity_hash || computeSupervisionAlertHash(pkgBase.supervision_alert) !== pkgBase.supervision_alert.integrity_hash || computeDriftHealthEvidenceHash(pkgBase.drift_evidence) !== pkgBase.drift_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = unique(failures);
  const has = (failure: DriftHealthFailureReason) => uniqueFailures.includes(failure);
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("DHV", "drift-health-validation-id", source),
    package_id: pkgBase.package_id,
    validation_state,
    failures: uniqueFailures,
    baseline_established: pkgBase.source_observation_package.validation.validation_state === "PASS",
    drift_reproducible: !has("EXECUTION_DRIFT_NOT_DETECTED") && !has("SEVERITY_SCORING_NONDETERMINISTIC"),
    health_deterministic: !has("HEALTH_DEGRADATION_NOT_ASSESSED"),
    severity_reproducible: !has("SEVERITY_SCORING_NONDETERMINISTIC"),
    governance_correlation_valid: !has("GOVERNANCE_DRIFT_NOT_IDENTIFIED") && !has("AUTHORITY_DRIFT_NOT_RECOGNIZED") && !has("CONSTITUTIONAL_DRIFT_NOT_DETECTED"),
    confidence_trend_deterministic: !has("CONFIDENCE_DEGRADATION_NOT_MEASURED") && !has("TREND_ANALYSIS_NOT_REPRODUCIBLE"),
    evidence_complete: !has("DRIFT_EVIDENCE_INCOMPLETE"),
    replay_ready: !has("REPLAY_RECONSTRUCTION_MISMATCH"),
    lineage_preserved: !has("DRIFT_EVIDENCE_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    hidden_analysis_prohibited: !has("HIDDEN_ANALYTICAL_STATE_DETECTED"),
    ready_for_supervision_alerting: validation_state === "PASS",
    validation_hash: hashValue("drift-health-validation", source),
  });
}

function replayPackage(pkgBase: Omit<DriftHealthPackage, "replay" | "package_hash">, scenario: DriftHealthScenario): DriftHealthReplayResult {
  const source = {
    replay_id: id("DHR", "drift-health-replay-id", pkgBase.package_id),
    package_id: pkgBase.package_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_drift_hash: scenario === "REPLAY_MISMATCH" ? "mismatched-drift-replay" : pkgBase.drift_intelligence.integrity_hash,
    reconstructed_health_hash: pkgBase.health_assessment.integrity_hash,
    reconstructed_alert_hash: pkgBase.supervision_alert.integrity_hash,
    reconstructed_evidence_hash: pkgBase.drift_evidence.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
    failure_reason: pkgBase.validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("drift-health-replay", source) });
}

function packageHashSource(pkg: Omit<DriftHealthPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    observation_package_id: pkg.source_observation_package.package_id,
    drift_hash: pkg.drift_intelligence.integrity_hash,
    health_hash: pkg.health_assessment.integrity_hash,
    alert_hash: pkg.supervision_alert.integrity_hash,
    evidence_hash: pkg.drift_evidence.integrity_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    advisory_only: pkg.advisory_only,
  };
}

export function buildDriftHealthPackage(input: { scenario?: DriftHealthScenario; observationPackage?: RuntimeObservationPackage } = {}): DriftHealthPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_observation_package = input.observationPackage ?? buildRuntimeObservationPackage({ scenario: observationScenarioFor(scenario) });
  const failures = collectFailures(source_observation_package, scenario);
  const drift_intelligence = buildDrift(source_observation_package, failures, scenario);
  const health_assessment = buildHealth(source_observation_package, failures, drift_intelligence, scenario);
  const supervision_alert = buildAlert(drift_intelligence, health_assessment, failures, scenario);
  const drift_evidence = buildEvidence(drift_intelligence, health_assessment, supervision_alert, source_observation_package, scenario);
  const package_id = id("DHP", "drift-health-package-id", { observation: source_observation_package.package_id, scenario });
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_observation_package,
    analysis_state: failures.length ? severityFor(failures) === "CRITICAL" ? "FAILED" as DriftHealthState : "DRIFT_DETECTED" as DriftHealthState : "STABLE" as DriftHealthState,
    drift_intelligence,
    health_assessment,
    supervision_alert,
    drift_evidence,
    advisory_only: true as const,
    execution_modified: false as const,
    governance_modified: false as const,
    adaptive_behavior_triggered: false as const,
    hidden_analysis_used: false as const,
  };
  const validation = validatePackage(base, scenario);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation, scenario);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("drift-health-package", packageHashSource(full)) });
}

export function buildDriftHealthDashboardSurface(pkg = buildDriftHealthPackage()): DriftHealthDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    execution_id: pkg.drift_intelligence.execution_id,
    analysis_state: pkg.analysis_state,
    severity: pkg.drift_intelligence.severity,
    runtime_health: pkg.health_assessment.runtime_health,
    degradation_trend: pkg.health_assessment.degradation_trend,
    recommended_action: pkg.supervision_alert.recommended_action,
    validation_state: pkg.validation.validation_state,
    failures: pkg.validation.failures,
    replay_reference: pkg.drift_intelligence.replay_reference,
    lineage_reference: pkg.drift_intelligence.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getDriftHealthFramework(): DriftHealthFramework {
  const pkg = buildDriftHealthPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["advisory-only-analysis", "deterministic-detection", "reproducible-assessments", "explainable-health", "evidence-backed-degradation", "no-hidden-analysis", "tenant-isolated", "immutable-history"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["INITIALIZING", "BASELINE_ESTABLISHED", "MONITORING", "ANALYZING", "DRIFT_DETECTED", "HEALTH_DEGRADED", "CORRELATING", "ASSESSING", "ALERTING", "STABLE", "FAILED"] as const),
      severity_levels: freezeArray(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
      runtime_health_levels: freezeArray(["OPTIMAL", "HEALTHY", "STABLE", "DEGRADED", "HIGH_RISK", "CRITICAL"] as const),
    }),
    package: pkg,
    dashboard: buildDriftHealthDashboardSurface(pkg),
  });
}
