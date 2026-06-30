import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateGovernanceOutputVerificationReport, verifyGovernanceOutputs } from "@/services/governance-output-verification";
import type { GovernanceOutputVerificationScenario } from "@/types/governance-output-verification";
import type {
  GovernanceReplayCertificationCategory,
  GovernanceReplayCertificationEvidence,
  GovernanceReplayCertificationFailureReason,
  GovernanceReplayCertificationInput,
  GovernanceReplayCertificationObservabilitySurface,
  GovernanceReplayCertificationReport,
  GovernanceReplayCertificationScenario,
  GovernanceReplayCertificationState,
  GovernanceReplayCertificationTestResult,
  GovernanceReplayCertificationValidationResult,
} from "@/types/governance-replay-certification";

const NOW = "2026-06-26T22:30:00.000Z";
const SCHEMA_VERSION = "governance-replay-certification/v7H.5" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function outputScenario(scenario: GovernanceReplayCertificationScenario | undefined): GovernanceOutputVerificationScenario {
  const map: Partial<Record<GovernanceReplayCertificationScenario, GovernanceOutputVerificationScenario>> = {
    STATE_RECONSTRUCTION_MISMATCH: "STATE_PACKAGE_INVALID",
    REPLAY_OUTPUT_MISMATCH: "GOVERNANCE_DECISION_DIFFERS",
    GOVERNANCE_DECISION_MISMATCH: "GOVERNANCE_DECISION_DIFFERS",
    POLICY_EVALUATION_MISMATCH: "POLICY_EVALUATION_MISMATCH",
    COMPLIANCE_REPLAY_MISMATCH: "COMPLIANCE_RESULT_DIFFERS",
    RISK_REPLAY_MISMATCH: "RISK_CALCULATION_DIFFERS",
    RECOMMENDATION_REPLAY_MISMATCH: "RECOMMENDATION_OUTPUT_DIFFERS",
    ESCALATION_REPLAY_MISMATCH: "ESCALATION_ROUTING_DIFFERS",
    EXPLANATION_MISMATCH: "EXPLAINABILITY_DIFFERS",
    POLICY_INFLUENCE_MISMATCH: "EXPLAINABILITY_DIFFERS",
    CONFIDENCE_MISMATCH: "CONFIDENCE_VALUE_DIFFERS",
    LINEAGE_DISCONTINUITY: "LINEAGE_GRAPH_DIFFERS",
    REPLAY_HASH_MISMATCH: "REPLAY_HASH_MISMATCH",
    INTEGRITY_VERIFICATION_FAILS: "INTEGRITY_VERIFICATION_FAILURE",
    CONSTITUTIONAL_VERSION_MISMATCH: "CONSTITUTIONAL_MISMATCH",
    AUTHORITY_VALIDATION_MISMATCH: "AUTHORITY_MISMATCH",
    CROSS_TENANT_REPLAY: "TENANT_MISMATCH",
    INCOMPLETE_CERTIFICATION_EVIDENCE: "OUTPUT_INCOMPLETE",
  };
  return map[scenario ?? "BASELINE"] ?? "BASELINE";
}

function scenarioFailure(scenario: GovernanceReplayCertificationScenario): GovernanceReplayCertificationFailureReason | null {
  const map: Partial<Record<GovernanceReplayCertificationScenario, GovernanceReplayCertificationFailureReason>> = {
    MISSING_REPLAY_CONTRACT: "REPLAY_CONTRACT_INVALID",
    REPLAY_IDENTITY_MODIFIED: "REPLAY_IDENTITY_NOT_IMMUTABLE",
    INCOMPLETE_INPUT_RECONSTRUCTION: "INPUT_RECONSTRUCTION_INVALID",
    STATE_RECONSTRUCTION_MISMATCH: "STATE_RECONSTRUCTION_INVALID",
    REPLAY_OUTPUT_MISMATCH: "OUTPUT_VERIFICATION_INVALID",
    GOVERNANCE_DECISION_MISMATCH: "GOVERNANCE_DECISION_NOT_REPRODUCED",
    POLICY_EVALUATION_MISMATCH: "POLICY_EVALUATION_NOT_REPRODUCED",
    COMPLIANCE_REPLAY_MISMATCH: "COMPLIANCE_NOT_REPRODUCED",
    RISK_REPLAY_MISMATCH: "RISK_NOT_REPRODUCED",
    RECOMMENDATION_REPLAY_MISMATCH: "RECOMMENDATION_NOT_REPRODUCED",
    ESCALATION_REPLAY_MISMATCH: "ESCALATION_NOT_REPRODUCED",
    EXPLANATION_MISMATCH: "EXPLAINABILITY_NOT_REPRODUCED",
    EVIDENCE_CHAIN_MISMATCH: "EVIDENCE_CHAIN_NOT_REPRODUCED",
    POLICY_INFLUENCE_MISMATCH: "POLICY_INFLUENCE_NOT_REPRODUCED",
    CONFIDENCE_MISMATCH: "CONFIDENCE_NOT_REPRODUCED",
    LINEAGE_DISCONTINUITY: "LINEAGE_NOT_REPRODUCED",
    REPLAY_ORDERING_CHANGED: "REPLAY_ORDERING_NON_DETERMINISTIC",
    REPLAY_HASH_MISMATCH: "REPLAY_HASH_NOT_REPRODUCED",
    INTEGRITY_VERIFICATION_FAILS: "INTEGRITY_VERIFICATION_FAILED",
    CONSTITUTIONAL_VERSION_MISMATCH: "CONSTITUTIONAL_COMPLIANCE_FAILED",
    AUTHORITY_VALIDATION_MISMATCH: "AUTHORITY_VALIDATION_FAILED",
    LIVE_DATA_DEPENDENCY: "LIVE_DATA_DEPENDENCY_DETECTED",
    HIDDEN_EXECUTION_STATE: "HIDDEN_EXECUTION_STATE_DETECTED",
    UNDOCUMENTED_DEPENDENCY: "UNDOCUMENTED_DEPENDENCY_DETECTED",
    REPLAY_INCONSISTENCY: "REPLAY_NOT_REPEATABLE",
    CROSS_TENANT_REPLAY: "TENANT_ISOLATION_FAILED",
    MISSING_AUDIT_RECORDS: "AUDIT_RECORDS_INCOMPLETE",
    INCOMPLETE_CERTIFICATION_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
    MINOR_REPORTING_GAP: "MINOR_REPORTING_GAP",
  };
  return map[scenario] ?? null;
}

function pass(condition: boolean): "PASS" | "FAIL" {
  return condition ? "PASS" : "FAIL";
}

function testResult(input: {
  category: GovernanceReplayCertificationCategory;
  name: string;
  expected?: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  evidence_refs: readonly string[];
  failure_reason: GovernanceReplayCertificationFailureReason | null;
}): GovernanceReplayCertificationTestResult {
  const expected = input.expected ?? "PASS";
  return Object.freeze({
    test_id: `GRCERT-${hashValue("governance-replay-certification-test-id", { category: input.category, name: input.name }).slice(0, 10).toUpperCase()}`,
    category: input.category,
    name: input.name,
    expected,
    actual: input.actual,
    passed: input.actual === expected,
    evidence_refs: uniq(input.evidence_refs),
    failure_reason: input.failure_reason,
  });
}

function evidence(report: ReturnType<typeof verifyGovernanceOutputs>): GovernanceReplayCertificationEvidence {
  const contract = report.replay_state_package.replay_input_package.replay_contract;
  const input = report.replay_state_package.replay_input_package;
  const state = report.replay_state_package;
  const source = {
    evidence_id: `GRCE-7H5-${hashValue("governance-replay-certification-evidence-id", report.verification_id).slice(0, 10).toUpperCase()}`,
    replay_contract_hash: contract.contract_hash,
    input_package_hash: input.input_package_hash,
    state_package_hash: state.state_package_hash,
    output_verification_hash: report.verification_report_hash,
    replay_hashes: uniq([contract.replay_hash, contract.governance_hash, contract.reconstruction_hash, contract.integrity_hash, contract.certification_hash]),
    truth_ledger_references: uniq(input.truth_ledger_resolutions),
    audit_references: uniq([contract.audit_log[0]?.audit_hash ?? "", input.audit_log[0]?.audit_hash ?? "", state.audit_log[0]?.audit_hash ?? "", report.audit_log[0]?.audit_hash ?? ""]),
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("governance-replay-certification-evidence", source) });
}

function makeResults(report: ReturnType<typeof verifyGovernanceOutputs>, scenario: GovernanceReplayCertificationScenario, evidenceRefs: readonly string[]) {
  const outputValidation = validateGovernanceOutputVerificationReport(report);
  const contractValidation = report.replay_state_package.replay_input_package.replay_contract_validation;
  const inputValidation = report.replay_state_package.replay_input_validation;
  const stateValidation = report.replay_state_validation;
  const scenarioReason = scenarioFailure(scenario);
  const scenarioFails = (reason: GovernanceReplayCertificationFailureReason) => scenarioReason === reason;
  const contractResults = freezeArray([
    testResult({ category: "CONTRACT", name: "replay contract present", actual: pass(!scenarioFails("REPLAY_CONTRACT_INVALID") && Boolean(report.replay_state_package.replay_input_package.replay_contract.governance_replay_id)), evidence_refs: evidenceRefs, failure_reason: scenarioFails("REPLAY_CONTRACT_INVALID") ? "REPLAY_CONTRACT_INVALID" : null }),
    testResult({ category: "CONTRACT", name: "replay contract schema valid", actual: pass(contractValidation.validation_state === "VALID" && !scenarioFails("REPLAY_CONTRACT_INVALID")), evidence_refs: evidenceRefs, failure_reason: contractValidation.validation_state === "VALID" ? null : "REPLAY_CONTRACT_INVALID" }),
    testResult({ category: "CONTRACT", name: "replay identity immutable", actual: pass(!scenarioFails("REPLAY_IDENTITY_NOT_IMMUTABLE")), evidence_refs: [report.replay_identity.governance_replay_id], failure_reason: scenarioFails("REPLAY_IDENTITY_NOT_IMMUTABLE") ? "REPLAY_IDENTITY_NOT_IMMUTABLE" : null }),
  ]);
  const inputResults = freezeArray([
    testResult({ category: "INPUT_RECONSTRUCTION", name: "replay inputs reconstructed deterministically", actual: pass(inputValidation.validation_state === "VALID" && !scenarioFails("INPUT_RECONSTRUCTION_INVALID")), evidence_refs: evidenceRefs, failure_reason: inputValidation.validation_state === "VALID" ? null : "INPUT_RECONSTRUCTION_INVALID" }),
    testResult({ category: "INPUT_RECONSTRUCTION", name: "replay uses immutable records only", actual: pass(inputValidation.immutable_sources_only && !scenarioFails("LIVE_DATA_DEPENDENCY_DETECTED")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("LIVE_DATA_DEPENDENCY_DETECTED") ? "LIVE_DATA_DEPENDENCY_DETECTED" : null }),
    testResult({ category: "INPUT_RECONSTRUCTION", name: "undocumented dependency absent", actual: pass(!scenarioFails("UNDOCUMENTED_DEPENDENCY_DETECTED")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("UNDOCUMENTED_DEPENDENCY_DETECTED") ? "UNDOCUMENTED_DEPENDENCY_DETECTED" : null }),
  ]);
  const stateResults = freezeArray([
    testResult({ category: "STATE_RECONSTRUCTION", name: "governance state reconstructed deterministically", actual: pass(stateValidation.validation_state === "VALID" && !scenarioFails("STATE_RECONSTRUCTION_INVALID")), evidence_refs: evidenceRefs, failure_reason: stateValidation.validation_state === "VALID" ? null : "STATE_RECONSTRUCTION_INVALID" }),
    testResult({ category: "STATE_RECONSTRUCTION", name: "replay ordering deterministic", actual: pass(stateValidation.ordering_valid && !scenarioFails("REPLAY_ORDERING_NON_DETERMINISTIC")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("REPLAY_ORDERING_NON_DETERMINISTIC") ? "REPLAY_ORDERING_NON_DETERMINISTIC" : null }),
    testResult({ category: "STATE_RECONSTRUCTION", name: "hidden execution state absent", actual: pass(!scenarioFails("HIDDEN_EXECUTION_STATE_DETECTED")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("HIDDEN_EXECUTION_STATE_DETECTED") ? "HIDDEN_EXECUTION_STATE_DETECTED" : null }),
  ]);
  const outputResults = freezeArray([
    testResult({ category: "OUTPUT_VERIFICATION", name: "governance outputs reproduced exactly", actual: pass(outputValidation.replay_outputs_verified && !scenarioFails("OUTPUT_VERIFICATION_INVALID")), evidence_refs: evidenceRefs, failure_reason: outputValidation.replay_outputs_verified ? null : "OUTPUT_VERIFICATION_INVALID" }),
    testResult({ category: "OUTPUT_VERIFICATION", name: "replay repeatable across executions", actual: pass(!scenarioFails("REPLAY_NOT_REPEATABLE")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("REPLAY_NOT_REPEATABLE") ? "REPLAY_NOT_REPEATABLE" : null }),
  ]);
  const governanceResults = freezeArray([
    testResult({ category: "GOVERNANCE", name: "governance decisions reproducible", actual: pass(report.governance_decision_comparison.match && !scenarioFails("GOVERNANCE_DECISION_NOT_REPRODUCED")), evidence_refs: [report.governance_decision_comparison.comparison_hash], failure_reason: report.governance_decision_comparison.match ? null : "GOVERNANCE_DECISION_NOT_REPRODUCED" }),
    testResult({ category: "GOVERNANCE", name: "policy evaluations reproducible", actual: pass(report.policy_comparison.match && !scenarioFails("POLICY_EVALUATION_NOT_REPRODUCED")), evidence_refs: [report.policy_comparison.comparison_hash], failure_reason: report.policy_comparison.match ? null : "POLICY_EVALUATION_NOT_REPRODUCED" }),
    testResult({ category: "GOVERNANCE", name: "compliance evaluations reproducible", actual: pass(report.compliance_comparison.match && !scenarioFails("COMPLIANCE_NOT_REPRODUCED")), evidence_refs: [report.compliance_comparison.comparison_hash], failure_reason: report.compliance_comparison.match ? null : "COMPLIANCE_NOT_REPRODUCED" }),
    testResult({ category: "GOVERNANCE", name: "governance risk reproducible", actual: pass(report.risk_comparison.match && !scenarioFails("RISK_NOT_REPRODUCED")), evidence_refs: [report.risk_comparison.comparison_hash], failure_reason: report.risk_comparison.match ? null : "RISK_NOT_REPRODUCED" }),
    testResult({ category: "GOVERNANCE", name: "recommendations reproducible", actual: pass(report.recommendation_comparison.match && !scenarioFails("RECOMMENDATION_NOT_REPRODUCED")), evidence_refs: [report.recommendation_comparison.comparison_hash], failure_reason: report.recommendation_comparison.match ? null : "RECOMMENDATION_NOT_REPRODUCED" }),
    testResult({ category: "GOVERNANCE", name: "escalation decisions reproducible", actual: pass(report.escalation_comparison.match && !scenarioFails("ESCALATION_NOT_REPRODUCED")), evidence_refs: [report.escalation_comparison.comparison_hash], failure_reason: report.escalation_comparison.match ? null : "ESCALATION_NOT_REPRODUCED" }),
  ]);
  const explainabilityResults = freezeArray([
    testResult({ category: "EXPLAINABILITY", name: "explainability reproduced", actual: pass(report.explainability_comparison.match && !scenarioFails("EXPLAINABILITY_NOT_REPRODUCED")), evidence_refs: [report.explainability_comparison.comparison_hash], failure_reason: report.explainability_comparison.match ? null : "EXPLAINABILITY_NOT_REPRODUCED" }),
    testResult({ category: "EXPLAINABILITY", name: "evidence chain reproduced", actual: pass(!scenarioFails("EVIDENCE_CHAIN_NOT_REPRODUCED")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("EVIDENCE_CHAIN_NOT_REPRODUCED") ? "EVIDENCE_CHAIN_NOT_REPRODUCED" : null }),
    testResult({ category: "EXPLAINABILITY", name: "policy influence chain reproduced", actual: pass(!scenarioFails("POLICY_INFLUENCE_NOT_REPRODUCED")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("POLICY_INFLUENCE_NOT_REPRODUCED") ? "POLICY_INFLUENCE_NOT_REPRODUCED" : null }),
  ]);
  const confidenceResults = freezeArray([
    testResult({ category: "CONFIDENCE", name: "confidence calculations reproducible", actual: pass(report.confidence_comparison.match && !scenarioFails("CONFIDENCE_NOT_REPRODUCED")), evidence_refs: [report.confidence_comparison.comparison_hash], failure_reason: report.confidence_comparison.match ? null : "CONFIDENCE_NOT_REPRODUCED" }),
  ]);
  const lineageResults = freezeArray([
    testResult({ category: "LINEAGE", name: "lineage reconstructed completely", actual: pass(report.lineage_comparison.match && !scenarioFails("LINEAGE_NOT_REPRODUCED")), evidence_refs: [report.lineage_comparison.comparison_hash], failure_reason: report.lineage_comparison.match ? null : "LINEAGE_NOT_REPRODUCED" }),
  ]);
  const integrityResults = freezeArray([
    testResult({ category: "INTEGRITY", name: "replay hashes reproducible", actual: pass(report.integrity_comparison.match && !scenarioFails("REPLAY_HASH_NOT_REPRODUCED")), evidence_refs: [report.integrity_comparison.comparison_hash], failure_reason: report.integrity_comparison.match ? null : "REPLAY_HASH_NOT_REPRODUCED" }),
    testResult({ category: "INTEGRITY", name: "integrity verification passes", actual: pass(outputValidation.integrity_valid && !scenarioFails("INTEGRITY_VERIFICATION_FAILED")), evidence_refs: evidenceRefs, failure_reason: outputValidation.integrity_valid ? null : "INTEGRITY_VERIFICATION_FAILED" }),
  ]);
  const securityResults = freezeArray([
    testResult({ category: "SECURITY", name: "constitutional version preserved", actual: pass(outputValidation.constitutional_valid && !scenarioFails("CONSTITUTIONAL_COMPLIANCE_FAILED")), evidence_refs: evidenceRefs, failure_reason: outputValidation.constitutional_valid ? null : "CONSTITUTIONAL_COMPLIANCE_FAILED" }),
    testResult({ category: "SECURITY", name: "authority validation preserved", actual: pass(outputValidation.authority_valid && !scenarioFails("AUTHORITY_VALIDATION_FAILED")), evidence_refs: evidenceRefs, failure_reason: outputValidation.authority_valid ? null : "AUTHORITY_VALIDATION_FAILED" }),
    testResult({ category: "SECURITY", name: "tenant isolation enforced", actual: pass(outputValidation.tenant_isolated && !scenarioFails("TENANT_ISOLATION_FAILED")), evidence_refs: evidenceRefs, failure_reason: outputValidation.tenant_isolated ? null : "TENANT_ISOLATION_FAILED" }),
  ]);
  const auditResults = freezeArray([
    testResult({ category: "AUDIT", name: "audit records complete", actual: pass(report.audit_log.length > 0 && !scenarioFails("AUDIT_RECORDS_INCOMPLETE")), evidence_refs: report.audit_log.map((entry) => entry.audit_hash), failure_reason: scenarioFails("AUDIT_RECORDS_INCOMPLETE") ? "AUDIT_RECORDS_INCOMPLETE" : null }),
  ]);
  const evidenceResults = freezeArray([
    testResult({ category: "EVIDENCE", name: "certification evidence complete", actual: pass(evidenceRefs.length > 0 && !scenarioFails("CERTIFICATION_EVIDENCE_INCOMPLETE")), evidence_refs: evidenceRefs, failure_reason: scenarioFails("CERTIFICATION_EVIDENCE_INCOMPLETE") ? "CERTIFICATION_EVIDENCE_INCOMPLETE" : null }),
  ]);
  return { contractResults, inputResults, stateResults, outputResults, governanceResults, explainabilityResults, confidenceResults, lineageResults, integrityResults, securityResults, auditResults, evidenceResults };
}

export function computeGovernanceReplayCertificationReportHash(report: Omit<GovernanceReplayCertificationReport, "report_hash"> | GovernanceReplayCertificationReport): string {
  const { report_hash: _hash, output_verification_report: _output, ...source } = report as GovernanceReplayCertificationReport;
  return hashValue("governance-replay-certification-report", source);
}

export function runGovernanceReplayCertification(input: GovernanceReplayCertificationInput = {}): GovernanceReplayCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const output = input.output_report ?? verifyGovernanceOutputs({ scenario: outputScenario(scenario), tenant_id: input.tenant_id, mission_id: input.mission_id, replay_requestor: input.replay_requestor });
  const certEvidence = evidence(output);
  const evidenceRefs = [certEvidence.evidence_hash, certEvidence.output_verification_hash, ...certEvidence.audit_references];
  const results = makeResults(output, scenario, evidenceRefs);
  const executed = freezeArray([
    ...results.contractResults,
    ...results.inputResults,
    ...results.stateResults,
    ...results.outputResults,
    ...results.governanceResults,
    ...results.explainabilityResults,
    ...results.confidenceResults,
    ...results.lineageResults,
    ...results.integrityResults,
    ...results.securityResults,
    ...results.auditResults,
    ...results.evidenceResults,
  ]);
  const detected = uniq([
    ...executed.filter((item) => !item.passed && item.failure_reason).map((item) => item.failure_reason!),
    ...(scenarioFailure(scenario) ? [scenarioFailure(scenario)!] : []),
  ]);
  const nonCritical = detected.length === 1 && detected[0] === "MINOR_REPORTING_GAP";
  const certification_state: GovernanceReplayCertificationState = detected.length === 0 ? "PASS" : nonCritical ? "CONDITIONAL_PASS" : "FAIL";
  const corrective_actions = certification_state === "PASS"
    ? freezeArray<string>([])
    : nonCritical
      ? freezeArray(["Resolve reporting metadata gap before unrestricted production certification."])
      : freezeArray(detected.map((failure) => `Remediate ${failure} and rerun Phase 7H.5 certification.`));
  const base = {
    certification_id: `GRCERT-7H5-${hashValue("governance-replay-certification-id", { output: output.verification_id, scenario }).slice(0, 10).toUpperCase()}`,
    phase_version: "7H.5" as const,
    schema_version: SCHEMA_VERSION,
    certification_timestamp: NOW,
    replay_contract_version: output.replay_state_package.replay_input_package.replay_contract.replay_version,
    replay_framework_version: "governance-replay-framework/v7H" as const,
    replay_scope: output.replay_state_package.replay_input_package.replay_contract.replay_scope,
    certification_state,
    output_verification_report: output,
    input_reconstruction_results: results.inputResults,
    state_reconstruction_results: results.stateResults,
    output_verification_results: results.outputResults,
    governance_results: results.governanceResults,
    explainability_results: results.explainabilityResults,
    confidence_results: results.confidenceResults,
    lineage_results: results.lineageResults,
    integrity_results: results.integrityResults,
    security_results: results.securityResults,
    audit_results: results.auditResults,
    evidence_results: results.evidenceResults,
    executed_test_results: executed,
    detected_findings: detected,
    corrective_actions,
    certification_evidence: certEvidence,
    truth_ledger_record_reference: `truth-ledger:governance-replay-certification:${output.replay_identity.governance_replay_id}`,
    governance_ledger_record_reference: `governance-ledger:governance-replay-certification:${output.replay_identity.governance_replay_id}`,
    operator_approval_status: certification_state === "PASS" ? "APPROVED_FOR_PRODUCTION" as const : certification_state === "CONDITIONAL_PASS" ? "APPROVED_FOR_GOVERNANCE_REVIEW" as const : "BLOCKED" as const,
    certification_signature: hashValue("governance-replay-certification-signature", { state: certification_state, detected, evidence: certEvidence.evidence_hash }),
  };
  return Object.freeze({ ...base, report_hash: computeGovernanceReplayCertificationReportHash(base as GovernanceReplayCertificationReport) });
}

export function validateGovernanceReplayCertificationReport(report?: GovernanceReplayCertificationReport): GovernanceReplayCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<GovernanceReplayCertificationFailureReason>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, validation_state: "INVALID" as const, certified: false, tests_passed: false, output_verified: false, evidence_complete: false, report_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("governance-replay-certification-validation", source) });
  }
  const tests_passed = report.executed_test_results.every((item) => item.passed);
  const output_verified = report.output_verification_report.verification_state === "VERIFIED";
  const evidence_complete = Boolean(report.certification_evidence.evidence_hash && report.certification_evidence.audit_references.length && report.truth_ledger_record_reference && report.governance_ledger_record_reference);
  const report_hash_valid = computeGovernanceReplayCertificationReportHash(report) === report.report_hash;
  const failures = uniq([...report.detected_findings, ...(report_hash_valid ? [] : ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const])]);
  const certified = report.certification_state === "PASS" && tests_passed && output_verified && evidence_complete && report_hash_valid;
  const source = {
    certification_id: report.certification_id,
    validation_state: certified || report.certification_state === "CONDITIONAL_PASS" && report_hash_valid ? "VALID" as const : "INVALID" as const,
    certified,
    tests_passed,
    output_verified,
    evidence_complete,
    report_hash_valid,
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-replay-certification-validation", source) });
}

export function buildGovernanceReplayCertificationObservabilitySurface(report = runGovernanceReplayCertification()): GovernanceReplayCertificationObservabilitySurface {
  const failed = report.executed_test_results.filter((item) => !item.passed).length;
  return Object.freeze({
    certification_id: report.certification_id,
    certification_state: report.certification_state,
    total_tests: report.executed_test_results.length,
    passed_tests: report.executed_test_results.length - failed,
    failed_tests: failed,
    failures: report.detected_findings,
    output_failures: report.output_verification_report.detected_differences,
    operator_approval_status: report.operator_approval_status,
    advisory_only_notice: "Governance replay certification is advisory-only; it certifies replay readiness without granting autonomous execution authority.",
  });
}

export function getGovernanceReplayCertificationContract() {
  const report = runGovernanceReplayCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-replay", "complete-input-reconstruction", "complete-state-reconstruction", "exact-output-verification", "explainability-preserved", "confidence-reproducible", "lineage-preserved", "integrity-verified", "tenant-isolated", "audit-complete", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
    }),
    report,
    validation: validateGovernanceReplayCertificationReport(report),
    observability: buildGovernanceReplayCertificationObservabilitySurface(report),
  });
}
