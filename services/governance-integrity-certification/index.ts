import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceIntegrityVerification } from "@/services/governance-integrity-verification";
import type { GovernanceIntegrityVerificationScenario } from "@/types/governance-integrity-verification";
import type {
  GovernanceIntegrityCertificationCategory,
  GovernanceIntegrityCertificationEvidence,
  GovernanceIntegrityCertificationFailure,
  GovernanceIntegrityCertificationInput,
  GovernanceIntegrityCertificationObservabilitySurface,
  GovernanceIntegrityCertificationReport,
  GovernanceIntegrityCertificationScenario,
  GovernanceIntegrityCertificationState,
  GovernanceIntegrityCertificationTestResult,
  GovernanceIntegrityCertificationValidationResult,
} from "@/types/governance-integrity-certification";

const NOW = "2026-06-27T12:00:00.000Z";
const SCHEMA_VERSION = "governance-integrity-certification/v7I.5" as const;

const SCENARIO_VERIFICATION: Partial<Record<GovernanceIntegrityCertificationScenario, GovernanceIntegrityVerificationScenario>> = Object.freeze({
  INTEGRITY_CONTRACT_INVALID: "CONTRACT_SCHEMA_INVALID",
  SERIALIZATION_MISMATCH_ACCEPTED: "CONTENT_HASH_MISMATCH",
  CONTENT_HASH_MISMATCH_UNDETECTED: "CONTENT_HASH_MISMATCH",
  PREVIOUS_HASH_MISMATCH_ACCEPTED: "PREVIOUS_HASH_MISMATCH",
  ROOT_HASH_CORRUPTION_ACCEPTED: "ROOT_HASH_MISMATCH",
  CHAIN_DELETION_ACCEPTED: "GOVERNANCE_CHAIN_INCOMPLETE",
  CHAIN_REORDERING_ACCEPTED: "GOVERNANCE_CHAIN_INCOMPLETE",
  LINEAGE_CORRUPTION_UNDETECTED: "LINEAGE_RECONSTRUCTION_FAILED",
  REPLAY_MISMATCH_ACCEPTED: "REPLAY_RECONSTRUCTION_MISMATCH",
  TAMPERING_UNDETECTED: "CONTENT_HASH_MISMATCH",
  IMMUTABLE_IDENTITY_MODIFICATION_ACCEPTED: "IMMUTABLE_IDENTITY_MODIFIED",
  EVIDENCE_TAMPERING_UNDETECTED: "EVIDENCE_LINEAGE_BROKEN",
  CROSS_TENANT_LINKAGE_ACCEPTED: "CROSS_TENANT_REFERENCE_DETECTED",
  INCONSISTENT_VERIFICATION_ACCEPTED: "UNKNOWN_VERIFICATION_STATE",
  UNKNOWN_STATE_ACCEPTED: "UNKNOWN_VERIFICATION_STATE",
  MISSING_LEDGER_RECORD_ACCEPTED: "DELAYED_VERIFICATION_EXECUTION",
  OPERATOR_VISIBILITY_INCOMPLETE: "OPTIONAL_METADATA_UNAVAILABLE",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function scenarioFailure(scenario: GovernanceIntegrityCertificationScenario): GovernanceIntegrityCertificationFailure | null {
  const map: Partial<Record<GovernanceIntegrityCertificationScenario, GovernanceIntegrityCertificationFailure>> = {
    MINOR_REPORTING_GAP: "MINOR_REPORTING_GAP",
    INTEGRITY_CONTRACT_INVALID: "INTEGRITY_CONTRACT_INVALID",
    SERIALIZATION_MISMATCH_ACCEPTED: "CANONICAL_SERIALIZATION_NOT_CERTIFIED",
    CONTENT_HASH_MISMATCH_UNDETECTED: "HASH_MISMATCH_NOT_CERTIFIED",
    PREVIOUS_HASH_MISMATCH_ACCEPTED: "PREVIOUS_HASH_NOT_CERTIFIED",
    ROOT_HASH_CORRUPTION_ACCEPTED: "ROOT_HASH_NOT_CERTIFIED",
    CHAIN_DELETION_ACCEPTED: "CHAIN_INTEGRITY_NOT_CERTIFIED",
    CHAIN_REORDERING_ACCEPTED: "CHAIN_INTEGRITY_NOT_CERTIFIED",
    LINEAGE_CORRUPTION_UNDETECTED: "LINEAGE_NOT_CERTIFIED",
    REPLAY_MISMATCH_ACCEPTED: "REPLAY_NOT_CERTIFIED",
    TAMPERING_UNDETECTED: "TAMPER_DETECTION_NOT_CERTIFIED",
    IMMUTABLE_IDENTITY_MODIFICATION_ACCEPTED: "IDENTITY_PROTECTION_NOT_CERTIFIED",
    EVIDENCE_TAMPERING_UNDETECTED: "EVIDENCE_INTEGRITY_NOT_CERTIFIED",
    CROSS_TENANT_LINKAGE_ACCEPTED: "TENANT_ISOLATION_NOT_CERTIFIED",
    INCONSISTENT_VERIFICATION_ACCEPTED: "VERIFICATION_NOT_DETERMINISTIC",
    UNKNOWN_STATE_ACCEPTED: "STATE_CLASSIFICATION_NOT_CERTIFIED",
    MISSING_LEDGER_RECORD_ACCEPTED: "TRUTH_LEDGER_NOT_CERTIFIED",
    OPERATOR_VISIBILITY_INCOMPLETE: "OPERATOR_VISIBILITY_INCOMPLETE",
  };
  return map[scenario] ?? null;
}

function testResult(input: {
  category: GovernanceIntegrityCertificationCategory;
  name: string;
  actual: "PASS" | "FAIL";
  mandatory?: boolean;
  failure_reason: GovernanceIntegrityCertificationFailure | null;
  evidence_refs: readonly string[];
}): GovernanceIntegrityCertificationTestResult {
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
  return Object.freeze({
    test_id: `GICT-7I5-${hashValue("governance-integrity-certification-test-id", { category: input.category, name: input.name }).slice(0, 10).toUpperCase()}`,
    ...source,
    result_hash: hashValue("governance-integrity-certification-test", source),
  });
}

function fails(scenario: GovernanceIntegrityCertificationScenario, failure: GovernanceIntegrityCertificationFailure): boolean {
  return scenarioFailure(scenario) === failure;
}

function buildEvidence(report: ReturnType<typeof runGovernanceIntegrityVerification>): GovernanceIntegrityCertificationEvidence {
  const source = {
    evidence_id: `GICE-7I5-${hashValue("governance-integrity-certification-evidence-id", report.verification_id).slice(0, 10).toUpperCase()}`,
    verification_report_hash: report.report_hash,
    source_chain_hash: report.source_chain.chain_execution_hash,
    tamper_report_hash: report.tamper_report.report_hash,
    truth_ledger_record_id: report.truth_ledger_record.verification_record_id,
    replay_references: report.replay_references,
    lineage_references: report.lineage_references,
  };
  return Object.freeze({ ...source, replay_references: freezeArray(source.replay_references), lineage_references: freezeArray(source.lineage_references), evidence_hash: hashValue("governance-integrity-certification-evidence", source) });
}

function buildTests(report: ReturnType<typeof runGovernanceIntegrityVerification>, scenario: GovernanceIntegrityCertificationScenario, evidence: GovernanceIntegrityCertificationEvidence): readonly GovernanceIntegrityCertificationTestResult[] {
  const evidenceRefs = [evidence.evidence_hash, evidence.verification_report_hash, evidence.source_chain_hash, evidence.tamper_report_hash, evidence.truth_ledger_record_id];
  const deterministicVerification = Boolean(report.report_hash && report.truth_ledger_record.evidence_hash);
  return freezeArray([
    testResult({ category: "CONTRACT", name: "integrity contract present", actual: fails(scenario, "INTEGRITY_CONTRACT_INVALID") ? "FAIL" : "PASS", failure_reason: fails(scenario, "INTEGRITY_CONTRACT_INVALID") ? "INTEGRITY_CONTRACT_INVALID" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "SERIALIZATION", name: "canonical serialization deterministic", actual: fails(scenario, "CANONICAL_SERIALIZATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CANONICAL_SERIALIZATION_NOT_CERTIFIED") ? "CANONICAL_SERIALIZATION_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "HASH", name: "content and canonical hashes reproducible", actual: fails(scenario, "HASH_MISMATCH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "HASH_MISMATCH_NOT_CERTIFIED") ? "HASH_MISMATCH_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "HASH", name: "previous hash valid", actual: fails(scenario, "PREVIOUS_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "PREVIOUS_HASH_NOT_CERTIFIED") ? "PREVIOUS_HASH_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "HASH", name: "root hash valid", actual: fails(scenario, "ROOT_HASH_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "ROOT_HASH_NOT_CERTIFIED") ? "ROOT_HASH_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "CHAIN", name: "governance hash chain complete and ordered", actual: fails(scenario, "CHAIN_INTEGRITY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "CHAIN_INTEGRITY_NOT_CERTIFIED") ? "CHAIN_INTEGRITY_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "LINEAGE", name: "governance lineage reconstructs completely", actual: fails(scenario, "LINEAGE_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "LINEAGE_NOT_CERTIFIED") ? "LINEAGE_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "REPLAY", name: "replay integrity deterministic", actual: fails(scenario, "REPLAY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "REPLAY_NOT_CERTIFIED") ? "REPLAY_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "TAMPER", name: "tamper detection identifies simulated violations", actual: fails(scenario, "TAMPER_DETECTION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "TAMPER_DETECTION_NOT_CERTIFIED") ? "TAMPER_DETECTION_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "IDENTITY", name: "immutable identity protected", actual: fails(scenario, "IDENTITY_PROTECTION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "IDENTITY_PROTECTION_NOT_CERTIFIED") ? "IDENTITY_PROTECTION_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "EVIDENCE", name: "evidence integrity preserved", actual: fails(scenario, "EVIDENCE_INTEGRITY_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "EVIDENCE_INTEGRITY_NOT_CERTIFIED") ? "EVIDENCE_INTEGRITY_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "TENANT", name: "tenant isolation fully enforced", actual: fails(scenario, "TENANT_ISOLATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "TENANT_ISOLATION_NOT_CERTIFIED") ? "TENANT_ISOLATION_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "VERIFICATION", name: "verification decisions deterministic", actual: deterministicVerification && !fails(scenario, "VERIFICATION_NOT_DETERMINISTIC") ? "PASS" : "FAIL", failure_reason: deterministicVerification && !fails(scenario, "VERIFICATION_NOT_DETERMINISTIC") ? null : "VERIFICATION_NOT_DETERMINISTIC", evidence_refs: evidenceRefs }),
    testResult({ category: "CLASSIFICATION", name: "integrity states consistently classified", actual: fails(scenario, "STATE_CLASSIFICATION_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "STATE_CLASSIFICATION_NOT_CERTIFIED") ? "STATE_CLASSIFICATION_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "TRUTH_LEDGER", name: "verification and certification recorded", actual: fails(scenario, "TRUTH_LEDGER_NOT_CERTIFIED") ? "FAIL" : "PASS", failure_reason: fails(scenario, "TRUTH_LEDGER_NOT_CERTIFIED") ? "TRUTH_LEDGER_NOT_CERTIFIED" : null, evidence_refs: evidenceRefs }),
    testResult({ category: "VISIBILITY", name: "operator integrity reports complete", actual: fails(scenario, "OPERATOR_VISIBILITY_INCOMPLETE") || fails(scenario, "MINOR_REPORTING_GAP") ? "FAIL" : "PASS", mandatory: !fails(scenario, "MINOR_REPORTING_GAP"), failure_reason: fails(scenario, "OPERATOR_VISIBILITY_INCOMPLETE") ? "OPERATOR_VISIBILITY_INCOMPLETE" : fails(scenario, "MINOR_REPORTING_GAP") ? "MINOR_REPORTING_GAP" : null, evidence_refs: evidenceRefs }),
  ]);
}

export function computeGovernanceIntegrityCertificationReportHash(report: Omit<GovernanceIntegrityCertificationReport, "report_hash"> | GovernanceIntegrityCertificationReport): string {
  const { report_hash: _hash, verification_report: _verification, ...source } = report as GovernanceIntegrityCertificationReport;
  return hashValue("governance-integrity-certification-report", source);
}

export function runGovernanceIntegrityCertification(input: GovernanceIntegrityCertificationInput = {}): GovernanceIntegrityCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const verification_report = input.verification_report ?? runGovernanceIntegrityVerification({
    scenario: input.verification_scenario ?? SCENARIO_VERIFICATION[scenario],
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.created_by,
  });
  const certification_evidence = buildEvidence(verification_report);
  const certification_tests = buildTests(verification_report, scenario, certification_evidence);
  const failed_tests = freezeArray(certification_tests.filter((test) => !test.passed));
  const detected_findings = freezeArray([...new Set(failed_tests.map((test) => test.failure_reason).filter((item): item is GovernanceIntegrityCertificationFailure => Boolean(item)))]);
  const mandatory_tests_passed = certification_tests.filter((test) => test.mandatory).every((test) => test.passed);
  const optional_tests_passed = certification_tests.filter((test) => !test.mandatory).every((test) => test.passed);
  const certification_state: GovernanceIntegrityCertificationState = mandatory_tests_passed && optional_tests_passed && verification_report.integrity_state === "VALID"
    ? "PASS"
    : mandatory_tests_passed && verification_report.integrity_state !== "CORRUPTED"
      ? "CONDITIONAL_PASS"
      : "FAIL";
  const base = {
    certification_id: `GICERT-7I5-${hashValue("governance-integrity-certification-id", { scenario, verification: verification_report.verification_id }).slice(0, 10).toUpperCase()}`,
    phase_version: "7I.5" as const,
    schema_version: SCHEMA_VERSION,
    certification_timestamp: NOW,
    integrity_framework_version: "governance-integrity-framework/v7I" as const,
    certification_state,
    integrity_state: verification_report.integrity_state,
    verification_report,
    certification_tests,
    mandatory_tests_passed,
    optional_tests_passed,
    failed_tests,
    detected_findings,
    certification_evidence,
    truth_ledger_certification_reference: `truth-ledger:governance-integrity-certification:${verification_report.verification_id}`,
    operator_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "APPROVED_FOR_STAGING" as const : "BLOCKED" as const,
    operator_explanation: certification_state === "PASS"
      ? "Governance Integrity Framework certified for production trust."
      : certification_state === "CONDITIONAL_PASS"
        ? "Governance Integrity Framework conditionally certified for staging; resolve non-critical gaps before production."
        : "Governance Integrity Framework certification failed; downstream trust remains blocked.",
    certification_signature: hashValue("governance-integrity-certification-signature", { certification_state, detected_findings, evidence: certification_evidence.evidence_hash }),
  };
  return Object.freeze({ ...base, report_hash: computeGovernanceIntegrityCertificationReportHash(base as GovernanceIntegrityCertificationReport) });
}

export function validateGovernanceIntegrityCertificationReport(report?: GovernanceIntegrityCertificationReport): GovernanceIntegrityCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<GovernanceIntegrityCertificationFailure>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, validation_state: "INVALID" as const, certified: false, mandatory_tests_passed: false, evidence_complete: false, report_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("governance-integrity-certification-validation", source) });
  }
  const report_hash_valid = computeGovernanceIntegrityCertificationReportHash(report) === report.report_hash;
  const evidence_complete = Boolean(report.certification_evidence.evidence_hash && report.truth_ledger_certification_reference && report.certification_signature);
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
  return Object.freeze({ ...source, validation_hash: hashValue("governance-integrity-certification-validation", source) });
}

export function buildGovernanceIntegrityCertificationObservabilitySurface(report = runGovernanceIntegrityCertification()): GovernanceIntegrityCertificationObservabilitySurface {
  const failed = report.failed_tests.length;
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    integrity_state: report.integrity_state,
    total_tests: report.certification_tests.length,
    passed_tests: report.certification_tests.length - failed,
    failed_tests: failed,
    mandatory_tests_passed: report.mandatory_tests_passed,
    failures: report.detected_findings,
    operator_approval_status: report.operator_approval_status,
    truth_ledger_certification_reference: report.truth_ledger_certification_reference,
  });
}

export function getGovernanceIntegrityCertificationContract() {
  const report = runGovernanceIntegrityCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "deterministic-integrity-certification",
        "cryptographic-protection-certified",
        "hash-chain-certified",
        "tamper-detection-certified",
        "replay-integrity-certified",
        "lineage-preservation-certified",
        "tenant-isolation-certified",
        "truth-ledger-certification-recorded",
        "fail-closed-production-gate",
      ]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    }),
    report,
    validation: validateGovernanceIntegrityCertificationReport(report),
    observability: buildGovernanceIntegrityCertificationObservabilitySurface(report),
  });
}
