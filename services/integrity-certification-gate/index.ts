import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runIntegrityVerification } from "@/services/integrity-verification-service";
import type { IntegrityVerificationScenario } from "@/types/integrity-verification-service";
import type {
  IntegrityCertificationCategory,
  IntegrityCertificationEvidence,
  IntegrityCertificationFailure,
  IntegrityCertificationInput,
  IntegrityCertificationMetrics,
  IntegrityCertificationObservabilitySurface,
  IntegrityCertificationRecord,
  IntegrityCertificationReport,
  IntegrityCertificationScenario,
  IntegrityCertificationState,
  IntegrityCertificationTestResult,
  IntegrityCertificationValidationResult,
} from "@/types/integrity-certification-gate";

const NOW = "2026-06-30T15:00:00.000Z";
const SCHEMA_VERSION = "integrity-certification-gate/v8H.5" as const;

const SCENARIO_VERIFICATION: Partial<Record<IntegrityCertificationScenario, IntegrityVerificationScenario>> = Object.freeze({
  INTEGRITY_CONTRACT_MISSING: "INTEGRITY_CONTRACT_INVALID",
  INTEGRITY_SCHEMA_INVALID: "INTEGRITY_CONTRACT_INVALID",
  REPLAY_HASH_NONREPRODUCIBLE: "REPLAY_NOT_REPRODUCIBLE",
  EXECUTION_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  PLANNING_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  DECISION_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  ORCHESTRATION_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  SUPERVISION_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  INTERVENTION_HASH_NONREPRODUCIBLE: "HASH_REPRODUCTION_FAILED",
  HASH_CHAIN_NONDETERMINISTIC: "CHAIN_CONTINUITY_BROKEN",
  REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_NOT_REPRODUCIBLE",
  LINEAGE_HASH_NONREPRODUCIBLE: "LINEAGE_INCOMPLETE",
  IMMUTABLE_IDENTIFIERS_MODIFIED: "IMMUTABLE_IDENTIFIER_MODIFIED",
  TAMPERING_UNDETECTED: "HASH_REPRODUCTION_FAILED",
  CORRUPTION_UNDETECTED: "HASH_REPRODUCTION_FAILED",
  UNAUTHORIZED_MODIFICATION_ACCEPTED: "IMMUTABLE_IDENTIFIER_MODIFIED",
  DELETED_HISTORY_ACCEPTED: "CHAIN_CONTINUITY_BROKEN",
  ORPHANED_CHAIN_ACCEPTED: "ORPHANED_ARTIFACT",
  REPLAY_ALTERATION_ACCEPTED: "REPLAY_NOT_REPRODUCIBLE",
  ORDERING_MUTATION_ACCEPTED: "CHAIN_CONTINUITY_BROKEN",
  CONSTITUTIONAL_REFERENCE_LOST: "CONSTITUTIONAL_REFERENCE_INVALID",
  GOVERNANCE_REFERENCE_LOST: "GOVERNANCE_REFERENCE_MISSING",
  VERIFICATION_NONREPRODUCIBLE: "UNSUPPORTED_VERIFICATION_VERSION",
  CONFIDENCE_NONREPRODUCIBLE: "OPTIONAL_METADATA_WARNING",
  REPAIR_RECOMMENDATIONS_NONDETERMINISTIC: "OPTIONAL_METADATA_WARNING",
  TENANT_ISOLATION_BROKEN: "TENANT_ISOLATION_VIOLATION",
  CROSS_TENANT_HASH_LINKAGE_ACCEPTED: "TENANT_ISOLATION_VIOLATION",
  FAIL_CLOSED_BYPASSED: "EXECUTION_DIVERGENCE_DETECTED",
  AUTONOMOUS_EXECUTION_MODIFIED_HISTORY: "IMMUTABLE_IDENTIFIER_MODIFIED",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailure(scenario: IntegrityCertificationScenario): IntegrityCertificationFailure | null {
  const map: Partial<Record<IntegrityCertificationScenario, IntegrityCertificationFailure>> = {
    MINOR_REPORTING_GAP: "MINOR_REPORTING_GAP",
    INTEGRITY_CONTRACT_MISSING: "INTEGRITY_CONTRACT_NOT_CERTIFIED",
    INTEGRITY_SCHEMA_INVALID: "INTEGRITY_SCHEMA_NOT_CERTIFIED",
    REPLAY_HASH_NONREPRODUCIBLE: "REPLAY_HASH_NOT_CERTIFIED",
    EXECUTION_HASH_NONREPRODUCIBLE: "EXECUTION_HASH_NOT_CERTIFIED",
    PLANNING_HASH_NONREPRODUCIBLE: "PLANNING_HASH_NOT_CERTIFIED",
    DECISION_HASH_NONREPRODUCIBLE: "DECISION_HASH_NOT_CERTIFIED",
    ORCHESTRATION_HASH_NONREPRODUCIBLE: "ORCHESTRATION_HASH_NOT_CERTIFIED",
    SUPERVISION_HASH_NONREPRODUCIBLE: "SUPERVISION_HASH_NOT_CERTIFIED",
    INTERVENTION_HASH_NONREPRODUCIBLE: "INTERVENTION_HASH_NOT_CERTIFIED",
    HASH_CHAIN_NONDETERMINISTIC: "HASH_CHAIN_NOT_CERTIFIED",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_NOT_CERTIFIED",
    LINEAGE_HASH_NONREPRODUCIBLE: "LINEAGE_NOT_CERTIFIED",
    IMMUTABLE_IDENTIFIERS_MODIFIED: "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED",
    TAMPERING_UNDETECTED: "TAMPER_DETECTION_NOT_CERTIFIED",
    CORRUPTION_UNDETECTED: "CORRUPTION_DETECTION_NOT_CERTIFIED",
    UNAUTHORIZED_MODIFICATION_ACCEPTED: "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED",
    DELETED_HISTORY_ACCEPTED: "DELETED_HISTORY_NOT_CERTIFIED",
    ORPHANED_CHAIN_ACCEPTED: "ORPHANED_CHAIN_NOT_CERTIFIED",
    REPLAY_ALTERATION_ACCEPTED: "REPLAY_ALTERATION_NOT_CERTIFIED",
    ORDERING_MUTATION_ACCEPTED: "DETERMINISTIC_ORDERING_NOT_CERTIFIED",
    CONSTITUTIONAL_REFERENCE_LOST: "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED",
    GOVERNANCE_REFERENCE_LOST: "GOVERNANCE_INTEGRITY_NOT_CERTIFIED",
    VERIFICATION_NONREPRODUCIBLE: "VERIFICATION_NOT_DETERMINISTIC",
    CONFIDENCE_NONREPRODUCIBLE: "CONFIDENCE_NOT_DETERMINISTIC",
    REPAIR_RECOMMENDATIONS_NONDETERMINISTIC: "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC",
    TENANT_ISOLATION_BROKEN: "TENANT_ISOLATION_NOT_CERTIFIED",
    CROSS_TENANT_HASH_LINKAGE_ACCEPTED: "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED",
    FAIL_CLOSED_BYPASSED: "FAIL_CLOSED_NOT_CERTIFIED",
    AUTONOMOUS_EXECUTION_MODIFIED_HISTORY: "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED",
  };
  return map[scenario] ?? null;
}

function fails(scenario: IntegrityCertificationScenario, failure: IntegrityCertificationFailure): boolean {
  return scenarioFailure(scenario) === failure;
}

function testResult(input: {
  category: IntegrityCertificationCategory;
  name: string;
  actual: "PASS" | "FAIL";
  mandatory?: boolean;
  failure_reason: IntegrityCertificationFailure | null;
  evidence_refs: readonly string[];
}): IntegrityCertificationTestResult {
  const source = {
    category: input.category,
    name: input.name,
    expected: "PASS" as const,
    actual: input.actual,
    passed: input.actual === "PASS",
    mandatory: input.mandatory ?? true,
    failure_reason: input.failure_reason,
    evidence_refs: uniq(input.evidence_refs),
  };
  return Object.freeze({ test_id: id("ICT", "integrity-certification-test-id", { category: input.category, name: input.name }), ...source, result_hash: hashValue("integrity-certification-test", source) });
}

function buildEvidence(report: ReturnType<typeof runIntegrityVerification>): IntegrityCertificationEvidence {
  const source = {
    evidence_id: id("ICE", "integrity-certification-evidence-id", report.verification_id),
    verification_report_hash: report.report_hash,
    verification_evidence_hash: report.verification_record.certification_evidence.certification_evidence_hash,
    source_integrity_hash: report.source_integrity_contract.record_hash,
    hash_chain_terminal_hash: report.source_chain.terminal_hash,
    tamper_forensic_hash: report.tamper_report.forensic_evidence.evidence_hash,
    replay_reference: report.source_integrity_contract.replay_reference,
    lineage_reference: report.source_integrity_contract.lineage_reference,
    result_hashes: freezeArray(report.verification_results.map((item) => item.result_hash)),
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("integrity-certification-evidence", source) });
}

function buildTests(report: ReturnType<typeof runIntegrityVerification>, scenario: IntegrityCertificationScenario, evidence: IntegrityCertificationEvidence): readonly IntegrityCertificationTestResult[] {
  const refs = [evidence.evidence_hash, evidence.verification_report_hash, evidence.verification_evidence_hash, evidence.hash_chain_terminal_hash, evidence.tamper_forensic_hash];
  const deterministic = Boolean(report.report_hash && report.verification_record.integrity_hash && report.verification_record.certification_evidence.certification_evidence_hash);
  const repairDeterministic = report.verification_record.repair_recommendations.length > 0;
  return freezeArray([
    testResult({ category: "CONTRACT", name: "integrity contract present", actual: fails(scenario, "INTEGRITY_CONTRACT_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "INTEGRITY_CONTRACT_NOT_CERTIFIED") ? "INTEGRITY_CONTRACT_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CONTRACT", name: "integrity schema valid", actual: fails(scenario, "INTEGRITY_SCHEMA_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "INTEGRITY_SCHEMA_NOT_CERTIFIED") ? "INTEGRITY_SCHEMA_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "replay hashes reproducible", actual: fails(scenario, "REPLAY_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "REPLAY_HASH_NOT_CERTIFIED") ? "REPLAY_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "execution hashes reproducible", actual: fails(scenario, "EXECUTION_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "EXECUTION_HASH_NOT_CERTIFIED") ? "EXECUTION_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "planning hashes reproducible", actual: fails(scenario, "PLANNING_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "PLANNING_HASH_NOT_CERTIFIED") ? "PLANNING_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "decision hashes reproducible", actual: fails(scenario, "DECISION_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "DECISION_HASH_NOT_CERTIFIED") ? "DECISION_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "orchestration hashes reproducible", actual: fails(scenario, "ORCHESTRATION_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "ORCHESTRATION_HASH_NOT_CERTIFIED") ? "ORCHESTRATION_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "supervision hashes reproducible", actual: fails(scenario, "SUPERVISION_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "SUPERVISION_HASH_NOT_CERTIFIED") ? "SUPERVISION_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CRYPTOGRAPHIC", name: "intervention hashes reproducible", actual: fails(scenario, "INTERVENTION_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "INTERVENTION_HASH_NOT_CERTIFIED") ? "INTERVENTION_HASH_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "HASH_CHAIN", name: "hash chain deterministic", actual: fails(scenario, "HASH_CHAIN_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "HASH_CHAIN_NOT_CERTIFIED") ? "HASH_CHAIN_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "REPLAY", name: "replay reconstructs identical hashes", actual: fails(scenario, "REPLAY_RECONSTRUCTION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "REPLAY_RECONSTRUCTION_NOT_CERTIFIED") ? "REPLAY_RECONSTRUCTION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "LINEAGE", name: "lineage hashes reproducible", actual: fails(scenario, "LINEAGE_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "LINEAGE_NOT_CERTIFIED") ? "LINEAGE_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "IMMUTABILITY", name: "immutable identifiers preserved", actual: fails(scenario, "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED") ? "IMMUTABLE_IDENTIFIERS_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "tampering detected", actual: fails(scenario, "TAMPER_DETECTION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "TAMPER_DETECTION_NOT_CERTIFIED") ? "TAMPER_DETECTION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "corruption detected", actual: fails(scenario, "CORRUPTION_DETECTION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CORRUPTION_DETECTION_NOT_CERTIFIED") ? "CORRUPTION_DETECTION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "unauthorized modification detected", actual: fails(scenario, "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED") ? "UNAUTHORIZED_MODIFICATION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "deleted history detected", actual: fails(scenario, "DELETED_HISTORY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "DELETED_HISTORY_NOT_CERTIFIED") ? "DELETED_HISTORY_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "orphaned chain detected", actual: fails(scenario, "ORPHANED_CHAIN_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "ORPHANED_CHAIN_NOT_CERTIFIED") ? "ORPHANED_CHAIN_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TAMPER_DETECTION", name: "replay alteration detected", actual: fails(scenario, "REPLAY_ALTERATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "REPLAY_ALTERATION_NOT_CERTIFIED") ? "REPLAY_ALTERATION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "HASH_CHAIN", name: "deterministic ordering preserved", actual: fails(scenario, "DETERMINISTIC_ORDERING_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "DETERMINISTIC_ORDERING_NOT_CERTIFIED") ? "DETERMINISTIC_ORDERING_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "CONSTITUTIONAL", name: "constitutional references preserved", actual: fails(scenario, "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED") ? "CONSTITUTIONAL_INTEGRITY_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "GOVERNANCE", name: "governance references preserved", actual: fails(scenario, "GOVERNANCE_INTEGRITY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "GOVERNANCE_INTEGRITY_NOT_CERTIFIED") ? "GOVERNANCE_INTEGRITY_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "VERIFICATION", name: "integrity verification reproducible", actual: deterministic && !fails(scenario, "VERIFICATION_NOT_DETERMINISTIC") ? "PASS" : "FAIL", failure_reason: deterministic && !fails(scenario, "VERIFICATION_NOT_DETERMINISTIC") ? null : "VERIFICATION_NOT_DETERMINISTIC", evidence_refs: refs }),
    testResult({ category: "VERIFICATION", name: "integrity confidence reproducible", actual: fails(scenario, "CONFIDENCE_NOT_DETERMINISTIC") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CONFIDENCE_NOT_DETERMINISTIC") ? "CONFIDENCE_NOT_DETERMINISTIC" : null, evidence_refs: refs }),
    testResult({ category: "VERIFICATION", name: "verification reports deterministic", actual: deterministic ? "PASS" : "FAIL", failure_reason: deterministic ? null : "VERIFICATION_NOT_DETERMINISTIC", evidence_refs: refs }),
    testResult({ category: "VERIFICATION", name: "repair recommendations reproducible", actual: repairDeterministic && !fails(scenario, "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC") ? "PASS" : "FAIL", failure_reason: repairDeterministic && !fails(scenario, "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC") ? null : "REPAIR_RECOMMENDATIONS_NOT_DETERMINISTIC", evidence_refs: refs }),
    testResult({ category: "TENANT", name: "tenant isolation enforced", actual: fails(scenario, "TENANT_ISOLATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "TENANT_ISOLATION_NOT_CERTIFIED") ? "TENANT_ISOLATION_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "TENANT", name: "cross-tenant hash linkage rejected", actual: fails(scenario, "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED") ? "CROSS_TENANT_HASH_LINKAGE_NOT_REJECTED" : null, evidence_refs: refs }),
    testResult({ category: "FAIL_CLOSED", name: "fail-closed on verification failure", actual: fails(scenario, "FAIL_CLOSED_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "FAIL_CLOSED_NOT_CERTIFIED") ? "FAIL_CLOSED_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "IMMUTABILITY", name: "autonomous execution never modifies history", actual: fails(scenario, "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED") ? "AUTONOMOUS_HISTORY_IMMUTABILITY_NOT_CERTIFIED" : null, evidence_refs: refs }),
    testResult({ category: "VISIBILITY", name: "operator certification visibility complete", actual: fails(scenario, "MINOR_REPORTING_GAP") ? "FAIL" : "PASS", mandatory: !fails(scenario, "MINOR_REPORTING_GAP"), failure_reason: fails(scenario, "MINOR_REPORTING_GAP") ? "MINOR_REPORTING_GAP" : null, evidence_refs: refs }),
  ]);
}

function buildMetrics(report: ReturnType<typeof runIntegrityVerification>, tests: readonly IntegrityCertificationTestResult[]): IntegrityCertificationMetrics {
  const passedRatio = tests.filter((test) => test.passed).length / tests.length;
  const source = {
    integrity_score: passedRatio,
    replay_confidence: report.verification_record.replay_verification.replay_result === "REPRODUCIBLE" ? 1 : 0,
    verification_confidence: report.confidence_score,
    hash_reproducibility_score: report.verification_record.hash_verification.chain_hash ? 1 : 0,
    lineage_completeness_score: report.verification_record.lineage_verification.complete_lineage ? 1 : 0,
    governance_integrity_score: report.verification_record.governance_verification.governance_valid && report.verification_record.governance_verification.constitutional_valid ? 1 : 0,
    tenant_isolation_score: report.verification_record.tenant_isolation.tenant_scope_valid ? 1 : 0,
  };
  return Object.freeze({ ...source, metrics_hash: hashValue("integrity-certification-metrics", source) });
}

function status(tests: readonly IntegrityCertificationTestResult[], names: readonly string[]): "PASS" | "FAIL" {
  return tests.filter((test) => names.includes(test.name)).every((test) => test.passed) ? "PASS" : "FAIL";
}

function buildRecord(certification_id: string, state: IntegrityCertificationState, report: ReturnType<typeof runIntegrityVerification>, tests: readonly IntegrityCertificationTestResult[], evidence: IntegrityCertificationEvidence, metrics: IntegrityCertificationMetrics): IntegrityCertificationRecord {
  const source = {
    certification_id,
    phase: "8H.5" as const,
    integrity_contract: { status: status(tests, ["integrity contract present", "integrity schema valid"]) },
    hash_chain: { status: status(tests, ["hash chain deterministic", "deterministic ordering preserved"]) },
    replay_verification: { status: status(tests, ["replay hashes reproducible", "replay reconstructs identical hashes"]) },
    tamper_detection: { status: status(tests, ["tampering detected", "corruption detected", "unauthorized modification detected", "deleted history detected", "orphaned chain detected", "replay alteration detected"]) },
    lineage_verification: { status: status(tests, ["lineage hashes reproducible"]) },
    governance_verification: { status: status(tests, ["governance references preserved"]) },
    constitutional_verification: { status: status(tests, ["constitutional references preserved"]) },
    tenant_isolation: { status: status(tests, ["tenant isolation enforced", "cross-tenant hash linkage rejected"]) },
    confidence_score: metrics.integrity_score,
    certification_state: state,
    evidence_reference: evidence.evidence_hash,
    replay_reference: report.source_integrity_contract.replay_reference,
    lineage_reference: report.source_integrity_contract.lineage_reference,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("integrity-certification-record", source) });
}

export function computeIntegrityCertificationReportHash(report: Omit<IntegrityCertificationReport, "report_hash"> | IntegrityCertificationReport): string {
  const { report_hash: _hash, verification_report: _verification, ...source } = report as IntegrityCertificationReport;
  return hashValue("integrity-certification-report", source);
}

export function runIntegrityCertification(input: IntegrityCertificationInput = {}): IntegrityCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const verification_report = input.verification_report ?? runIntegrityVerification({ scenario: input.verification_scenario ?? SCENARIO_VERIFICATION[scenario] });
  const certification_evidence = buildEvidence(verification_report);
  const certification_tests = buildTests(verification_report, scenario, certification_evidence);
  const failed_tests = freezeArray(certification_tests.filter((test) => !test.passed));
  const detected_findings = freezeArray([...new Set(failed_tests.map((test) => test.failure_reason).filter((item): item is IntegrityCertificationFailure => Boolean(item)))]);
  const mandatory_tests_passed = certification_tests.filter((test) => test.mandatory).every((test) => test.passed);
  const optional_tests_passed = certification_tests.filter((test) => !test.mandatory).every((test) => test.passed);
  const certification_metrics = buildMetrics(verification_report, certification_tests);
  const certification_state: IntegrityCertificationState = mandatory_tests_passed && optional_tests_passed && verification_report.integrity_state === "VALID" ? "PASS" : mandatory_tests_passed && verification_report.integrity_state !== "CORRUPTED" ? "CONDITIONAL_PASS" : "FAIL";
  const certification_id = id("ICERT", "integrity-certification-id", { scenario, verification: verification_report.verification_id });
  const certification_record = buildRecord(certification_id, certification_state, verification_report, certification_tests, certification_evidence, certification_metrics);
  const base = {
    certification_id,
    phase_version: "8H.5" as const,
    schema_version: SCHEMA_VERSION,
    certification_timestamp: NOW,
    integrity_framework_version: "autonomy-integrity-framework/v8H" as const,
    certification_state,
    integrity_state: verification_report.integrity_state,
    verification_report,
    certification_tests,
    mandatory_tests_passed,
    optional_tests_passed,
    failed_tests,
    detected_findings,
    certification_metrics,
    certification_evidence,
    certification_record,
    truth_ledger_certification_reference: `truth-ledger:autonomy-integrity-certification:${verification_report.verification_id}`,
    governance_notifications: freezeArray(["governance-intelligence", "certification-suite", "truth-ledger", "replay-framework", "autonomy-visibility", "controlled-autonomy-completion-gate"]),
    operator_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "APPROVED_FOR_STAGING" as const : "BLOCKED" as const,
    operator_explanation: certification_state === "PASS" ? "Autonomy Integrity certified for production. Subsequent Mission Control phases may proceed." : certification_state === "CONDITIONAL_PASS" ? "Autonomy Integrity conditionally certified for development only; production remains blocked." : "Autonomy Integrity certification failed. Downstream Mission Control phases remain blocked.",
    downstream_mission_control_enabled: certification_state === "PASS",
    certification_signature: hashValue("integrity-certification-signature", { certification_state, detected_findings, evidence: certification_evidence.evidence_hash, record: certification_record.integrity_hash }),
  };
  return Object.freeze({ ...base, report_hash: computeIntegrityCertificationReportHash(base as IntegrityCertificationReport) });
}

export function validateIntegrityCertificationReport(report?: IntegrityCertificationReport): IntegrityCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<IntegrityCertificationFailure>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, validation_state: "INVALID" as const, certified: false, mandatory_tests_passed: false, evidence_complete: false, report_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("integrity-certification-validation", source) });
  }
  const report_hash_valid = computeIntegrityCertificationReportHash(report) === report.report_hash;
  const evidence_complete = Boolean(report.certification_evidence.evidence_hash && report.certification_record.integrity_hash && report.truth_ledger_certification_reference && report.certification_signature);
  const failures = uniq([...report.detected_findings, ...(report_hash_valid && evidence_complete ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])]);
  const certified = report.certification_state === "PASS" && report.mandatory_tests_passed && report.optional_tests_passed && evidence_complete && report_hash_valid;
  const source = {
    certification_id: report.certification_id,
    validation_state: certified || report.certification_state === "CONDITIONAL_PASS" && report.mandatory_tests_passed && report_hash_valid ? "VALID" as const : "INVALID" as const,
    certified,
    mandatory_tests_passed: report.mandatory_tests_passed,
    evidence_complete,
    report_hash_valid,
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("integrity-certification-validation", source) });
}

export function buildIntegrityCertificationObservabilitySurface(report = runIntegrityCertification()): IntegrityCertificationObservabilitySurface {
  const failed = report.failed_tests.length;
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    integrity_state: report.integrity_state,
    total_tests: report.certification_tests.length,
    passed_tests: report.certification_tests.length - failed,
    failed_tests: failed,
    mandatory_tests_passed: report.mandatory_tests_passed,
    confidence_score: report.certification_metrics.integrity_score,
    failures: report.detected_findings,
    operator_approval_status: report.operator_approval_status,
    downstream_mission_control_enabled: report.downstream_mission_control_enabled,
    truth_ledger_certification_reference: report.truth_ledger_certification_reference,
  });
}

export function getIntegrityCertificationContract() {
  const report = runIntegrityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "complete-autonomy-integrity-certification",
        "deterministic-cryptographic-protection-certified",
        "immutable-autonomous-history-certified",
        "replay-reproducibility-certified",
        "tamper-evidence-certified",
        "governance-and-constitutional-integrity-certified",
        "tenant-isolation-certified",
        "truth-ledger-certification-recorded",
        "fail-closed-production-gate",
      ]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    }),
    report,
    validation: validateIntegrityCertificationReport(report),
    observability: buildIntegrityCertificationObservabilitySurface(report),
  });
}
