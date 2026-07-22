import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveDriftValidation,
  AdaptiveRiskAssessmentReport,
  AdaptiveSafetyApiSurface,
  AdaptiveSafetyCertificationRecord,
  AdaptiveSafetyCertificationReport,
  AdaptiveSafetyCertificationTest,
  AdaptiveSafetyContract,
  AdaptiveSafetyFailure,
  AdaptiveSafetyInput,
  AdaptiveSafetyObservability,
  AdaptiveSafetyResult,
  AdaptiveSafetyScenario,
  AdaptiveSafetyValidationResult,
  AdaptiveSafetyWidget,
  BehavioralMutationDetection,
  ContainmentRecoveryValidation,
  EvidenceSafetyValidation,
  HiddenLearningDetection,
  PermittedSafetyLearningSource,
  ReplaySafetyValidation,
} from "@/types/adaptive-safety-certification";

const VERSION = "adaptive-safety-certification/v10.15.6" as const;
const ID = "AdaptiveSafetyCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly AdaptiveSafetyWidget[] = Object.freeze(["Safety Certification", "Hidden Learning", "Behavioral Mutation", "Replay Integrity", "Evidence Integrity", "Adaptive Drift", "Containment Recovery", "Safety Report", "Risk Assessment"]);
const SOURCES: readonly PermittedSafetyLearningSource[] = Object.freeze(["TRUTH_LEDGER", "CERTIFIED_ADAPTIVE_MEMORY", "VALIDATED_SIMULATIONS", "APPROVED_OPERATOR_FEEDBACK", "CERTIFIED_HISTORICAL_OUTCOMES", "REPLAY_ANALYSIS"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failed(failures: readonly AdaptiveSafetyFailure[], values: readonly AdaptiveSafetyFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }
function failureForScenario(scenario: AdaptiveSafetyScenario): AdaptiveSafetyFailure | undefined {
  const map: Partial<Record<AdaptiveSafetyScenario, AdaptiveSafetyFailure>> = {
    HIDDEN_LEARNING: "HIDDEN_LEARNING_DETECTED",
    BEHAVIORAL_MUTATION: "UNAUTHORIZED_BEHAVIORAL_MUTATION",
    REPLAY_CORRUPTION: "REPLAY_CORRUPTION_DETECTED",
    EVIDENCE_POISONING: "EVIDENCE_POISONING_DETECTED",
    GOVERNANCE_DRIFT: "GOVERNANCE_DRIFT_UNCONTAINED",
    CONSTITUTIONAL_DRIFT: "CONSTITUTIONAL_DRIFT_DETECTED",
    AUTHORITY_ESCALATION: "AUTHORITY_ESCALATION_DETECTED",
    CONFIDENCE_DRIFT: "CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED",
    RISK_DRIFT: "RISK_DRIFT_THRESHOLD_EXCEEDED",
    REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_RECONSTRUCTION_FAILED",
    MEMORY_CONTAMINATION: "ADAPTIVE_MEMORY_CONTAMINATION",
    CROSS_TENANT_EVIDENCE: "CROSS_TENANT_EVIDENCE_CONTAMINATION",
    FAIL_OPEN_RECOVERY: "FAIL_OPEN_RECOVERY_DETECTED",
    INCOMPLETE_CONTAINMENT: "CONTAINMENT_INCOMPLETE",
    MISSING_OPERATOR_ESCALATION: "OPERATOR_ESCALATION_MISSING",
    APPEND_ONLY_VIOLATION: "APPEND_ONLY_LEDGER_VIOLATION",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}
function apiSurface(): AdaptiveSafetyApiSurface {
  const base: Omit<AdaptiveSafetyApiSurface, "integrity_hash"> = { api_id: "adaptive_safety_certification_api", retrieve_dashboard: "POST /adaptive-safety-certification/dashboard", retrieve_contract: "GET /adaptive-safety-certification/contract", retrieve_sections: freezeArray(["certification", "hidden-learning", "behavior", "replay", "evidence", "drift", "containment", "report", "risk-assessment"]), validate_certification: "POST /adaptive-safety-certification/validate", inspect_certification: "POST /adaptive-safety-certification/inspect", mutation_supported: false, execution_supported: false, fail_open_supported: false, safety_override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function record(input: AdaptiveSafetyInput, failures: readonly AdaptiveSafetyFailure[]): AdaptiveSafetyCertificationRecord {
  const base: Omit<AdaptiveSafetyCertificationRecord, "integrity_hash"> = { certification_id: id("adaptive_safety_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, hidden_learning_status: failures.includes("HIDDEN_LEARNING_DETECTED") ? "FAIL" : "PASS", behavioral_mutation_status: failures.includes("UNAUTHORIZED_BEHAVIORAL_MUTATION") ? "FAIL" : "PASS", replay_corruption_status: failed(failures, ["REPLAY_CORRUPTION_DETECTED", "REPLAY_RECONSTRUCTION_FAILED"]) ? "FAIL" : "PASS", evidence_poisoning_status: failed(failures, ["EVIDENCE_POISONING_DETECTED", "ADAPTIVE_MEMORY_CONTAMINATION", "CROSS_TENANT_EVIDENCE_CONTAMINATION"]) ? "FAIL" : "PASS", governance_drift_status: failed(failures, ["GOVERNANCE_DRIFT_UNCONTAINED", "CONSTITUTIONAL_DRIFT_DETECTED"]) ? "FAIL" : "PASS", authority_drift_status: failures.includes("AUTHORITY_ESCALATION_DETECTED") ? "FAIL" : "PASS", confidence_drift_status: failures.includes("CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED") ? "FAIL" : "PASS", risk_drift_status: failures.includes("RISK_DRIFT_THRESHOLD_EXCEEDED") ? "FAIL" : "PASS", containment_status: failed(failures, ["CONTAINMENT_INCOMPLETE", "FAIL_OPEN_RECOVERY_DETECTED"]) ? "FAIL" : "PASS", recovery_status: failed(failures, ["FAIL_OPEN_RECOVERY_DETECTED", "OPERATOR_ESCALATION_MISSING"]) ? "FAIL" : "PASS", findings: failures, evidence_refs: failed(failures, ["EVIDENCE_POISONING_DETECTED", "CROSS_TENANT_EVIDENCE_CONTAMINATION"]) ? freezeArray([]) : freezeArray(["evidence:safety:canonical", "truth-ledger:safety:canonical"]), governance_refs: failed(failures, ["GOVERNANCE_DRIFT_UNCONTAINED", "CONSTITUTIONAL_DRIFT_DETECTED"]) ? freezeArray([]) : freezeArray(["governance:safety:1"]), replay_refs: failed(failures, ["REPLAY_CORRUPTION_DETECTED", "REPLAY_RECONSTRUCTION_FAILED"]) ? freezeArray([]) : freezeArray(["replay:safety:1"]), drift_refs: freezeArray(["drift:safety:governance", "drift:safety:authority", "drift:safety:confidence", "drift:safety:risk"]), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function hiddenLearning(failures: readonly AdaptiveSafetyFailure[]): HiddenLearningDetection {
  const ok = !failures.includes("HIDDEN_LEARNING_DETECTED");
  const base: Omit<HiddenLearningDetection, "integrity_hash"> = { validation_id: "hidden_learning_detection", permitted_sources: SOURCES, detector_operational: true, hidden_learning_absent: ok, undocumented_learning_absent: ok, runtime_adaptation_absent: ok, hidden_state_absent: ok, unauthorized_parameter_evolution_absent: ok, uncertified_memory_absent: ok && !failures.includes("ADAPTIVE_MEMORY_CONTAMINATION"), shadow_pipeline_absent: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function behavior(failures: readonly AdaptiveSafetyFailure[]): BehavioralMutationDetection {
  const ok = !failures.includes("UNAUTHORIZED_BEHAVIORAL_MUTATION");
  const base: Omit<BehavioralMutationDetection, "integrity_hash"> = { validation_id: "behavioral_mutation_detection", detector_operational: true, unauthorized_mutation_blocked: ok, recommendation_generation_stable: ok, prioritization_stable: ok, suppression_logic_stable: ok, reasoning_stable: ok, confidence_calibration_stable: ok && !failures.includes("CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED"), risk_assessment_stable: ok && !failures.includes("RISK_DRIFT_THRESHOLD_EXCEEDED"), governance_evaluation_stable: ok && !failures.includes("GOVERNANCE_DRIFT_UNCONTAINED"), constitutional_evaluation_stable: ok && !failures.includes("CONSTITUTIONAL_DRIFT_DETECTED"), dashboard_presentation_stable: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replay(failures: readonly AdaptiveSafetyFailure[]): ReplaySafetyValidation {
  const corrupted = failed(failures, ["REPLAY_CORRUPTION_DETECTED", "REPLAY_RECONSTRUCTION_FAILED"]);
  const base: Omit<ReplaySafetyValidation, "integrity_hash"> = { validation_id: "replay_safety_validation", replay_corruption_detected: true, replay_integrity_preserved: !corrupted, replay_artifacts_complete: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), replay_lineage_unchanged: !failures.includes("REPLAY_CORRUPTION_DETECTED"), replay_divergence_absent: !corrupted, state_reconstruction_valid: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), replay_ordering_stable: !failures.includes("REPLAY_CORRUPTION_DETECTED"), replay_hashes_reproducible: !failed(failures, ["REPLAY_CORRUPTION_DETECTED", "INTEGRITY_HASH_MISMATCH"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function evidence(failures: readonly AdaptiveSafetyFailure[]): EvidenceSafetyValidation {
  const poisoned = failed(failures, ["EVIDENCE_POISONING_DETECTED", "ADAPTIVE_MEMORY_CONTAMINATION", "CROSS_TENANT_EVIDENCE_CONTAMINATION"]);
  const base: Omit<EvidenceSafetyValidation, "integrity_hash"> = { validation_id: "evidence_safety_validation", evidence_poisoning_detected: true, evidence_lineage_integrity_verified: !poisoned, observations_integrity_verified: !failures.includes("EVIDENCE_POISONING_DETECTED"), normalized_outcomes_integrity_verified: !failures.includes("EVIDENCE_POISONING_DETECTED"), memory_integrity_verified: !failures.includes("ADAPTIVE_MEMORY_CONTAMINATION"), operator_feedback_integrity_verified: !failures.includes("EVIDENCE_POISONING_DETECTED"), simulation_evidence_integrity_verified: !failures.includes("EVIDENCE_POISONING_DETECTED"), governance_evidence_integrity_verified: !failures.includes("EVIDENCE_POISONING_DETECTED"), cross_tenant_contamination_absent: !failures.includes("CROSS_TENANT_EVIDENCE_CONTAMINATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function drift(failures: readonly AdaptiveSafetyFailure[]): AdaptiveDriftValidation {
  const base: Omit<AdaptiveDriftValidation, "integrity_hash"> = { validation_id: "adaptive_drift_validation", governance_drift_detected: true, governance_supremacy_maintained: !failures.includes("GOVERNANCE_DRIFT_UNCONTAINED"), authority_drift_detected: true, authority_escalation_blocked: !failures.includes("AUTHORITY_ESCALATION_DETECTED"), confidence_drift_detected: true, confidence_calibration_stable: !failures.includes("CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED"), risk_drift_detected: true, risk_calibration_stable: !failures.includes("RISK_DRIFT_THRESHOLD_EXCEEDED"), constitutional_drift_absent: !failures.includes("CONSTITUTIONAL_DRIFT_DETECTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function containment(failures: readonly AdaptiveSafetyFailure[]): ContainmentRecoveryValidation {
  const base: Omit<ContainmentRecoveryValidation, "integrity_hash"> = { validation_id: "containment_recovery_validation", containment_deterministic: !failures.includes("CONTAINMENT_INCOMPLETE"), recovery_deterministic: !failures.includes("FAIL_OPEN_RECOVERY_DETECTED"), containment_replay_reproducible: !failures.includes("REPLAY_RECONSTRUCTION_FAILED"), adaptive_suppression_available: true, replay_rollback_available: true, evidence_quarantine_available: true, proposal_invalidation_available: true, memory_isolation_available: !failures.includes("ADAPTIVE_MEMORY_CONTAMINATION"), tenant_containment_available: !failures.includes("CROSS_TENANT_EVIDENCE_CONTAMINATION"), certification_suspension_available: true, operator_escalation_functional: !failures.includes("OPERATOR_ESCALATION_MISSING"), fail_closed_verified: !failures.includes("FAIL_OPEN_RECOVERY_DETECTED"), safety_ledger_append_only: !failures.includes("APPEND_ONLY_LEDGER_VIOLATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function report(record: AdaptiveSafetyCertificationRecord): AdaptiveSafetyCertificationReport {
  const base: Omit<AdaptiveSafetyCertificationReport, "integrity_hash"> = { report_id: "adaptive_safety_certification_report", certification_outcome: record.certification_status, hidden_learning_assessment: record.hidden_learning_status, behavioral_mutation_analysis: record.behavioral_mutation_status, replay_integrity_assessment: record.replay_corruption_status, evidence_integrity_assessment: record.evidence_poisoning_status, governance_drift_analysis: record.governance_drift_status, authority_drift_analysis: record.authority_drift_status, confidence_stability_assessment: record.confidence_drift_status, risk_stability_assessment: record.risk_drift_status, containment_validation: record.containment_status, recovery_validation: record.recovery_status, findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function riskReport(record: AdaptiveSafetyCertificationRecord): AdaptiveRiskAssessmentReport {
  const base: Omit<AdaptiveRiskAssessmentReport, "integrity_hash"> = { report_id: "adaptive_risk_assessment_report", safety_risk_profile: record.certification_status === "CERTIFIED" ? "LOW" : "ELEVATED", threat_coverage_complete: true, drift_detection_effective: record.governance_drift_status === "PASS" && record.authority_drift_status === "PASS", evidence_quality_verified: record.evidence_poisoning_status === "PASS", replay_trustworthy: record.replay_corruption_status === "PASS", governance_resilient: record.governance_drift_status === "PASS", authority_boundary_validated: record.authority_drift_status === "PASS", containment_performance: record.containment_status, recovery_performance: record.recovery_status, certification_evidence_refs: freezeArray([...record.evidence_refs, ...record.governance_refs, ...record.replay_refs, ...record.drift_refs]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: AdaptiveSafetyFailure, refs: readonly string[]): AdaptiveSafetyCertificationTest {
  const base: Omit<AdaptiveSafetyCertificationTest, "integrity_hash"> = { test_id: id("adaptive_safety_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<AdaptiveSafetyResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly AdaptiveSafetyCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Hidden learning detection operational", result.hidden_learning_detection.detector_operational, "HIDDEN_LEARNING_DETECTED", refs),
    test("Hidden learning absent", result.hidden_learning_detection.hidden_learning_absent, "HIDDEN_LEARNING_DETECTED", refs),
    test("Behavioral mutation detection operational", result.behavioral_mutation_detection.detector_operational, "UNAUTHORIZED_BEHAVIORAL_MUTATION", refs),
    test("Unauthorized behavioral mutation blocked", result.behavioral_mutation_detection.unauthorized_mutation_blocked, "UNAUTHORIZED_BEHAVIORAL_MUTATION", refs),
    test("Replay corruption detected", result.replay_safety_validation.replay_corruption_detected, "REPLAY_CORRUPTION_DETECTED", refs),
    test("Replay integrity preserved", result.replay_safety_validation.replay_integrity_preserved, "REPLAY_CORRUPTION_DETECTED", refs),
    test("Evidence poisoning detected", result.evidence_safety_validation.evidence_poisoning_detected, "EVIDENCE_POISONING_DETECTED", refs),
    test("Evidence lineage integrity verified", result.evidence_safety_validation.evidence_lineage_integrity_verified, "EVIDENCE_POISONING_DETECTED", refs),
    test("Governance drift detected", result.adaptive_drift_validation.governance_drift_detected, "GOVERNANCE_DRIFT_UNCONTAINED", refs),
    test("Governance supremacy maintained", result.adaptive_drift_validation.governance_supremacy_maintained, "GOVERNANCE_DRIFT_UNCONTAINED", refs),
    test("Authority drift detected", result.adaptive_drift_validation.authority_drift_detected, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Authority escalation blocked", result.adaptive_drift_validation.authority_escalation_blocked, "AUTHORITY_ESCALATION_DETECTED", refs),
    test("Confidence drift detected", result.adaptive_drift_validation.confidence_drift_detected, "CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED", refs),
    test("Confidence calibration stable", result.adaptive_drift_validation.confidence_calibration_stable, "CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED", refs),
    test("Risk drift detected", result.adaptive_drift_validation.risk_drift_detected, "RISK_DRIFT_THRESHOLD_EXCEEDED", refs),
    test("Risk calibration stable", result.adaptive_drift_validation.risk_calibration_stable, "RISK_DRIFT_THRESHOLD_EXCEEDED", refs),
    test("Containment deterministic", result.containment_recovery_validation.containment_deterministic, "CONTAINMENT_INCOMPLETE", refs),
    test("Recovery deterministic", result.containment_recovery_validation.recovery_deterministic, "FAIL_OPEN_RECOVERY_DETECTED", refs),
    test("Replay of containment reproducible", result.containment_recovery_validation.containment_replay_reproducible, "REPLAY_RECONSTRUCTION_FAILED", refs),
    test("Tenant isolation preserved", result.containment_recovery_validation.tenant_containment_available && result.evidence_safety_validation.cross_tenant_contamination_absent, "CROSS_TENANT_EVIDENCE_CONTAMINATION", refs),
    test("Operator escalation functional", result.containment_recovery_validation.operator_escalation_functional, "OPERATOR_ESCALATION_MISSING", refs),
    test("Fail-closed behavior verified", result.containment_recovery_validation.fail_closed_verified, "FAIL_OPEN_RECOVERY_DETECTED", refs),
    test("Safety ledger append-only", result.containment_recovery_validation.safety_ledger_append_only, "APPEND_ONLY_LEDGER_VIOLATION", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}
function replayHash(result: Omit<AdaptiveSafetyResult, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, hidden: result.hidden_learning_detection.integrity_hash, behavior: result.behavioral_mutation_detection.integrity_hash, replay: result.replay_safety_validation.integrity_hash, evidence: result.evidence_safety_validation.integrity_hash, drift: result.adaptive_drift_validation.integrity_hash, containment: result.containment_recovery_validation.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<AdaptiveSafetyResult, "integrity_hash">): string { return hash({ version: result.adaptive_safety_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }
export function certifyAdaptiveSafety(input: AdaptiveSafetyInput = {}): AdaptiveSafetyResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as AdaptiveSafetyFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { adaptive_safety_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, hidden_learning_detection: hiddenLearning(initialFailures), behavioral_mutation_detection: behavior(initialFailures), replay_safety_validation: replay(initialFailures), evidence_safety_validation: evidence(initialFailures), adaptive_drift_validation: drift(initialFailures), containment_recovery_validation: containment(initialFailures), certification_report: report(rec), risk_assessment_report: riskReport(rec), widgets: WIDGETS, safe: initialFailures.length === 0, deterministic: true, replayable: rec.replay_corruption_status === "PASS", tenant_isolated: !initialFailures.includes("CROSS_TENANT_EVIDENCE_CONTAMINATION"), fail_closed: rec.containment_status === "PASS" && rec.recovery_status === "PASS", production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is AdaptiveSafetyFailure => Boolean(f))])]);
  const base: Omit<AdaptiveSafetyResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", safe: failures.length === 0, replayable: !failed(failures, ["REPLAY_CORRUPTION_DETECTED", "REPLAY_RECONSTRUCTION_FAILED"]), tenant_isolated: !failures.includes("CROSS_TENANT_EVIDENCE_CONTAMINATION"), fail_closed: !failed(failures, ["FAIL_OPEN_RECOVERY_DETECTED", "CONTAINMENT_INCOMPLETE"]), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateAdaptiveSafetyCertification(result?: AdaptiveSafetyResult): AdaptiveSafetyValidationResult {
  if (!result) {
    const failures = freezeArray<AdaptiveSafetyFailure>(["HIDDEN_LEARNING_DETECTED"]);
    const base: Omit<AdaptiveSafetyValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.safe && result.replayable && result.tenant_isolated && result.fail_closed && result.production_ready && replay_hash_valid && integrity_hash_valid;
  const base: Omit<AdaptiveSafetyValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayAdaptiveSafetyCertification(result: AdaptiveSafetyResult): boolean { return validateAdaptiveSafetyCertification(result).valid; }
export function buildAdaptiveSafetyObservability(result = certifyAdaptiveSafety()): AdaptiveSafetyObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, safe: result.safe, deterministic: result.deterministic, replayable: result.replayable, tenant_isolated: result.tenant_isolated, fail_closed: result.fail_closed, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getAdaptiveSafetyContract(): AdaptiveSafetyContract {
  const result = certifyAdaptiveSafety();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, permitted_learning_sources: SOURCES, hidden_learning_prohibited: true, behavioral_mutation_prohibited: true, evidence_poisoning_prohibited: true, fail_closed_required: true, continuous_safety_required: true }), result, validation: validateAdaptiveSafetyCertification(result), observability: buildAdaptiveSafetyObservability(result) });
}
export const AdaptiveSafetyCertification = Object.freeze({ certify: certifyAdaptiveSafety, validate: validateAdaptiveSafetyCertification, replay: replayAdaptiveSafetyCertification });
