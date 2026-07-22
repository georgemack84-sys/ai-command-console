import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { observeDecisionPackage, replayDecisionPackageObservability } from "@/services/decision-package-observability";
import type { DecisionPackageObservabilityResult } from "@/types/decision-package-observability";
import type {
  CertificationTestResult,
  CertificationValidationResult,
  ComplianceCertificationReport,
  DecisionPackageCertificationFailureReason,
  DecisionPackageCertificationGateFoundation,
  DecisionPackageCertificationGateInput,
  DecisionPackageCertificationGateResult,
  DecisionPackageCertificationLedgerEntry,
  DecisionPackageCertificationObservability,
  DecisionPackageCertificationOutcome,
  DecisionPackageCertificationRecord,
  DecisionPackageCertificationReplay,
  DecisionPackageCertificationState,
  DecisionPackageCertificationTestName,
  IntegrityCertificationReport,
  ProductionReadinessReport,
  ReplayCertificationReport,
} from "@/types/decision-package-certification-gate";

const GATE_VERSION = "decision-package-certification-gate/v1" as const;
const AUTHORIZED_COMPONENT = "decision-package-certification-gate";
const NOW = "2026-07-04T01:24:00.000Z";

export const DECISION_PACKAGE_CERTIFICATION_STATES: readonly DecisionPackageCertificationState[] = Object.freeze(["INITIALIZED", "TESTING", "VALIDATING", "VERIFIED", "PASS", "CONDITIONAL_PASS", "FAIL", "FAIL_CLOSED"]);

const CERTIFICATION_TESTS: readonly DecisionPackageCertificationTestName[] = Object.freeze([
  "Package contract valid",
  "Package generation deterministic",
  "Recommendation explained",
  "Alternatives included",
  "Rejected options justified",
  "Evidence summary complete",
  "Risk summary complete",
  "Confidence summary complete",
  "Forecast included",
  "Governance status visible",
  "Constitutional status visible",
  "Authority requirements included",
  "Approval path generated",
  "Operator actions defined",
  "Rollback guidance available",
  "Replay references attached",
  "Lineage references complete",
  "Integrity hash reproducible",
  "Package ledger immutable",
  "Replay reproduces identical package",
  "Tenant isolation enforced",
  "Advisory-only behavior verified",
  "Fail-closed behavior enforced",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function testHash(record: Omit<CertificationTestResult, "integrity_hash"> | CertificationTestResult): string {
  return hashWithoutIntegrity(record);
}

export function computeCertificationTestResultHash(record: Omit<CertificationTestResult, "integrity_hash"> | CertificationTestResult): string {
  return testHash(record);
}

function recordHash(record: Omit<DecisionPackageCertificationRecord, "integrity_hash"> | DecisionPackageCertificationRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeDecisionPackageCertificationRecordHash(record: Omit<DecisionPackageCertificationRecord, "integrity_hash"> | DecisionPackageCertificationRecord): string {
  return recordHash(record);
}

function readinessHash(record: Omit<ProductionReadinessReport, "integrity_hash"> | ProductionReadinessReport): string {
  return hashWithoutIntegrity(record);
}

export function computeProductionReadinessReportHash(record: Omit<ProductionReadinessReport, "integrity_hash"> | ProductionReadinessReport): string {
  return readinessHash(record);
}

function complianceHash(record: Omit<ComplianceCertificationReport, "integrity_hash"> | ComplianceCertificationReport): string {
  return hashWithoutIntegrity(record);
}

function replayReportHash(record: Omit<ReplayCertificationReport, "integrity_hash"> | ReplayCertificationReport): string {
  return hashWithoutIntegrity(record);
}

function integrityReportHash(record: Omit<IntegrityCertificationReport, "integrity_hash"> | IntegrityCertificationReport): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<CertificationValidationResult, "integrity_hash"> | CertificationValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<DecisionPackageCertificationLedgerEntry, "ledger_integrity_hash"> | DecisionPackageCertificationLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function pkg(obs: DecisionPackageObservabilityResult) {
  return obs.ledger_result.reference_result.workflow_result.compliance_result.forecast_result.evidence_result.package_build_result.package;
}

function testPassed(name: DecisionPackageCertificationTestName, obs: DecisionPackageObservabilityResult): boolean {
  const packageRecord = pkg(obs);
  const ledger = obs.ledger_result;
  const reference = ledger.reference_result;
  const workflow = reference.workflow_result;
  switch (name) {
    case "Package contract valid": return ledger.validation.schema_valid && obs.completeness_metrics.completeness_score === 1;
    case "Package generation deterministic": return obs.deterministic && ledger.deterministic;
    case "Recommendation explained": return packageRecord.rationale.length > 0 && obs.explainability_metrics.rationale_present;
    case "Alternatives included": return packageRecord.alternative_options.length > 0 && obs.explainability_metrics.alternatives_present;
    case "Rejected options justified": return packageRecord.rejected_options.length > 0;
    case "Evidence summary complete": return packageRecord.evidence_summary.length > 0 && obs.record.evidence_coverage_score === 1;
    case "Risk summary complete": return packageRecord.risk_summary.length > 0;
    case "Confidence summary complete": return packageRecord.confidence_summary.length > 0;
    case "Forecast included": return packageRecord.forecast_summary.length > 0;
    case "Governance status visible": return workflow.compliance_result.summary.governance_status.length > 0 && obs.operator_visibility_report.governance_visible;
    case "Constitutional status visible": return workflow.compliance_result.summary.constitutional_status.length > 0 && obs.operator_visibility_report.constitutional_visible;
    case "Authority requirements included": return workflow.compliance_result.summary.authority_requirements.length > 0;
    case "Approval path generated": return workflow.approval_path.approval_sequence.length > 0 && obs.operator_visibility_report.approval_path_visible;
    case "Operator actions defined": return workflow.action_records.length > 0 && obs.operator_visibility_report.operator_actions_visible;
    case "Rollback guidance available": return reference.rollback_plan.rollback_summary.length > 0;
    case "Replay references attached": return reference.replay_reference.decision_replay.length > 0 && obs.record.replay_availability;
    case "Lineage references complete": return reference.lineage_reference.evidence_lineage.length > 0 && ledger.validation.lineage_valid;
    case "Integrity hash reproducible": return obs.validation.integrity_verified && ledger.validation.integrity_valid;
    case "Package ledger immutable": return ledger.immutable_ledger_entries.every((entry) => entry.append_only && !entry.deleted) && ledger.immutable_package.immutable_status === "IMMUTABLE";
    case "Replay reproduces identical package": return replayDecisionPackageObservability(obs).replay_valid;
    case "Tenant isolation enforced": return obs.record.tenant_id === ledger.ledger_record.tenant_id && ledger.validation.tenant_valid;
    case "Advisory-only behavior verified": return obs.advisory_only && ledger.advisory_only && reference.advisory_only;
    case "Fail-closed behavior enforced": return !obs.fail_closed && !ledger.fail_closed && !reference.fail_closed;
  }
}

export function createDecisionPackageCertificationTests(obs: DecisionPackageObservabilityResult = observeDecisionPackage()): readonly CertificationTestResult[] {
  return Object.freeze(CERTIFICATION_TESTS.map((test_name, index) => {
    const actual_result: DecisionPackageCertificationOutcome = testPassed(test_name, obs) ? "PASS" : "FAIL";
    const base: Omit<CertificationTestResult, "integrity_hash"> = {
      test_id: `decision_package_certification_test_${String(index + 1).padStart(2, "0")}`,
      package_id: obs.record.package_id,
      test_name,
      expected_result: "PASS",
      actual_result,
      evidence_reference: obs.record.observability_id,
      validation_status: actual_result === "PASS" ? "VALID" : "REJECTED",
    };
    return Object.freeze({ ...base, integrity_hash: testHash(base) });
  }));
}

function failuresFromTests(tests: readonly CertificationTestResult[], obs: DecisionPackageObservabilityResult, authorized: boolean): readonly DecisionPackageCertificationFailureReason[] {
  const failures: DecisionPackageCertificationFailureReason[] = [];
  const failed = (name: DecisionPackageCertificationTestName) => tests.some((test) => test.test_name === name && test.actual_result !== "PASS");
  if (!authorized) failures.push("UNAUTHORIZED_CERTIFICATION_GATE_ACCESS");
  if (obs.observability_status !== "PASS") failures.push("OBSERVABILITY_INCOMPLETE");
  if (failed("Package generation deterministic")) failures.push("PACKAGE_GENERATION_NONDETERMINISTIC");
  if (failed("Package contract valid")) failures.push("REQUIRED_PACKAGE_SECTIONS_MISSING");
  if (failed("Recommendation explained")) failures.push("RECOMMENDATION_RATIONALE_MISSING");
  if (failed("Alternatives included")) failures.push("ALTERNATIVES_OMITTED");
  if (failed("Rejected options justified")) failures.push("REJECTED_OPTIONS_OMITTED");
  if (failed("Evidence summary complete")) failures.push("EVIDENCE_SUMMARY_INCOMPLETE");
  if (failed("Risk summary complete")) failures.push("RISK_SUMMARY_MISSING");
  if (failed("Confidence summary complete")) failures.push("CONFIDENCE_SUMMARY_MISSING");
  if (failed("Forecast included")) failures.push("FORECAST_ABSENT");
  if (failed("Governance status visible")) failures.push("GOVERNANCE_SUMMARY_ABSENT");
  if (failed("Constitutional status visible")) failures.push("CONSTITUTIONAL_SUMMARY_ABSENT");
  if (failed("Authority requirements included")) failures.push("AUTHORITY_REQUIREMENTS_MISSING");
  if (failed("Approval path generated")) failures.push("APPROVAL_PATH_INCOMPLETE");
  if (failed("Rollback guidance available")) failures.push("ROLLBACK_GUIDANCE_MISSING");
  if (failed("Replay references attached")) failures.push("REPLAY_REFERENCES_MISSING");
  if (failed("Lineage references complete")) failures.push("LINEAGE_INCOMPLETE");
  if (failed("Integrity hash reproducible")) failures.push("INTEGRITY_HASH_UNREPRODUCIBLE");
  if (failed("Package ledger immutable")) failures.push("LEDGER_IMMUTABILITY_VIOLATED");
  if (failed("Replay reproduces identical package")) failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (failed("Tenant isolation enforced")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (failed("Advisory-only behavior verified")) failures.push("ADVISORY_ONLY_GUARANTEE_VIOLATED");
  if (failed("Fail-closed behavior enforced")) failures.push("UNAUTHORIZED_EXECUTION_BEHAVIOR");
  if (tests.some((test) => testHash(test) !== test.integrity_hash)) failures.push("INTEGRITY_HASH_UNREPRODUCIBLE");
  return Object.freeze([...new Set(failures)] as DecisionPackageCertificationFailureReason[]);
}

function outcome(failures: readonly DecisionPackageCertificationFailureReason[]): DecisionPackageCertificationOutcome {
  if (failures.length === 0) return "PASS";
  const blocking = failures.some((failure) => !["OBSERVABILITY_INCOMPLETE"].includes(failure));
  return blocking ? "FAIL" : "CONDITIONAL_PASS";
}

export function createComplianceCertificationReport(obs: DecisionPackageObservabilityResult = observeDecisionPackage(), failures: readonly DecisionPackageCertificationFailureReason[] = []): ComplianceCertificationReport {
  const base: Omit<ComplianceCertificationReport, "integrity_hash"> = {
    report_id: `compliance_certification_${obs.record.package_id}`,
    package_id: obs.record.package_id,
    governance_compliance: failures.includes("GOVERNANCE_SUMMARY_ABSENT") ? "FAIL" : "PASS",
    constitutional_compliance: failures.includes("CONSTITUTIONAL_SUMMARY_ABSENT") ? "FAIL" : "PASS",
    authority_compliance: failures.includes("AUTHORITY_REQUIREMENTS_MISSING") || failures.includes("APPROVAL_PATH_INCOMPLETE") ? "FAIL" : "PASS",
    tenant_isolation: failures.includes("TENANT_ISOLATION_VIOLATED") ? "FAIL" : "PASS",
    findings: failures.filter((failure) => failure.includes("GOVERNANCE") || failure.includes("CONSTITUTIONAL") || failure.includes("AUTHORITY") || failure.includes("TENANT")),
  };
  return Object.freeze({ ...base, integrity_hash: complianceHash(base) });
}

export function createReplayCertificationReport(obs: DecisionPackageObservabilityResult = observeDecisionPackage(), failures: readonly DecisionPackageCertificationFailureReason[] = []): ReplayCertificationReport {
  const replayValid = replayDecisionPackageObservability(obs).replay_valid && !failures.includes("REPLAY_RECONSTRUCTION_FAILED");
  const base: Omit<ReplayCertificationReport, "integrity_hash"> = {
    report_id: `replay_certification_${obs.record.package_id}`,
    package_id: obs.record.package_id,
    replay_available: !failures.includes("REPLAY_REFERENCES_MISSING"),
    replay_deterministic: !failures.includes("PACKAGE_GENERATION_NONDETERMINISTIC"),
    replay_reproducible: replayValid,
    replay_lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    replay_integrity_verified: !failures.includes("INTEGRITY_HASH_UNREPRODUCIBLE"),
  };
  return Object.freeze({ ...base, integrity_hash: replayReportHash(base) });
}

export function createIntegrityCertificationReport(obs: DecisionPackageObservabilityResult = observeDecisionPackage(), failures: readonly DecisionPackageCertificationFailureReason[] = []): IntegrityCertificationReport {
  const ok = !failures.includes("INTEGRITY_HASH_UNREPRODUCIBLE");
  const base: Omit<IntegrityCertificationReport, "integrity_hash"> = {
    report_id: `integrity_certification_${obs.record.package_id}`,
    package_id: obs.record.package_id,
    package_integrity: ok,
    metadata_integrity: ok,
    replay_integrity: ok,
    lineage_integrity: ok && !failures.includes("LINEAGE_INCOMPLETE"),
    ledger_integrity: ok && !failures.includes("LEDGER_IMMUTABILITY_VIOLATED"),
  };
  return Object.freeze({ ...base, integrity_hash: integrityReportHash(base) });
}

export function createProductionReadinessReport(obs: DecisionPackageObservabilityResult = observeDecisionPackage(), failures: readonly DecisionPackageCertificationFailureReason[] = []): ProductionReadinessReport {
  const state = outcome(failures);
  const base: Omit<ProductionReadinessReport, "integrity_hash"> = {
    report_id: `production_readiness_${obs.record.package_id}`,
    package_id: obs.record.package_id,
    readiness_status: state === "PASS" ? "READY" : "BLOCKED",
    certification_summary: state === "PASS" ? "Decision package generation is certified for production operator presentation." : `Certification blocked by ${failures.length} finding(s).`,
    unresolved_findings: failures,
    deployment_recommendation: state === "PASS" ? "ALLOW_OPERATOR_PRESENTATION" : "BLOCK_OPERATOR_PRESENTATION",
  };
  return Object.freeze({ ...base, integrity_hash: readinessHash(base) });
}

function createCertificationRecord(obs: DecisionPackageObservabilityResult, state: DecisionPackageCertificationOutcome): DecisionPackageCertificationRecord {
  const base: Omit<DecisionPackageCertificationRecord, "integrity_hash"> = {
    certification_id: `decision_package_certification_${obs.record.package_id}`,
    package_id: obs.record.package_id,
    orchestration_id: obs.record.orchestration_id,
    mission_id: obs.record.mission_id,
    tenant_id: obs.record.tenant_id,
    certification_state: state,
    certification_timestamp: NOW,
    replay_validation: obs.record.replay_availability ? "PASS" : "FAIL",
    integrity_validation: obs.validation.integrity_verified ? "PASS" : "FAIL",
    governance_validation: obs.record.governance_visibility_score === 1 ? "PASS" : "FAIL",
    constitutional_validation: obs.operator_visibility_report.constitutional_visible ? "PASS" : "FAIL",
    production_readiness: state === "PASS" ? "READY" : "BLOCKED",
    replay_ref: obs.record.replay_ref,
    lineage_ref: obs.record.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildValidation(packageId: string, state: DecisionPackageCertificationOutcome, failures: readonly DecisionPackageCertificationFailureReason[]): CertificationValidationResult {
  const has = (failure: DecisionPackageCertificationFailureReason) => failures.includes(failure);
  const base: Omit<CertificationValidationResult, "integrity_hash"> = {
    validation_id: `decision_package_certification_validation_${packageId}`,
    package_id: packageId,
    deterministic_verified: !has("PACKAGE_GENERATION_NONDETERMINISTIC"),
    replay_verified: !has("REPLAY_REFERENCES_MISSING") && !has("REPLAY_RECONSTRUCTION_FAILED") && !has("REPLAY_DIVERGENCE"),
    governance_verified: !has("GOVERNANCE_SUMMARY_ABSENT"),
    constitutional_verified: !has("CONSTITUTIONAL_SUMMARY_ABSENT"),
    integrity_verified: !has("INTEGRITY_HASH_UNREPRODUCIBLE"),
    certification_status: state,
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(record: DecisionPackageCertificationRecord): readonly DecisionPackageCertificationLedgerEntry[] {
  const base: Omit<DecisionPackageCertificationLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `decision_package_certification_ledger_${record.certification_id}`,
    certification_id: record.certification_id,
    package_id: record.package_id,
    certification_timestamp: record.certification_timestamp,
    certification_outcome: record.certification_state,
    replay_validation: record.replay_validation,
    integrity_validation: record.integrity_validation,
    governance_validation: record.governance_validation,
    constitutional_validation: record.constitutional_validation,
    production_readiness: record.production_readiness,
    replay_ref: record.replay_ref,
    lineage_ref: record.lineage_ref,
    integrity_hash: record.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function gateFailures(input: {
  obs: DecisionPackageObservabilityResult;
  tests: readonly CertificationTestResult[];
  record: DecisionPackageCertificationRecord;
  readiness: ProductionReadinessReport;
  compliance: ComplianceCertificationReport;
  replay: ReplayCertificationReport;
  integrity: IntegrityCertificationReport;
  authorized: boolean;
}): readonly DecisionPackageCertificationFailureReason[] {
  const failures = [...failuresFromTests(input.tests, input.obs, input.authorized)];
  if (input.record.tenant_id !== input.obs.record.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (!input.record.advisory_only || !input.obs.advisory_only) failures.push("ADVISORY_ONLY_GUARANTEE_VIOLATED");
  if (input.readiness.readiness_status !== "READY" && input.record.certification_state === "PASS") failures.push("UNAUTHORIZED_EXECUTION_BEHAVIOR");
  if (input.compliance.governance_compliance !== "PASS") failures.push("GOVERNANCE_SUMMARY_ABSENT");
  if (input.compliance.constitutional_compliance !== "PASS") failures.push("CONSTITUTIONAL_SUMMARY_ABSENT");
  if (!input.replay.replay_reproducible) failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (!input.integrity.package_integrity || !input.integrity.ledger_integrity) failures.push("INTEGRITY_HASH_UNREPRODUCIBLE");
  if (
    recordHash(input.record) !== input.record.integrity_hash
    || readinessHash(input.readiness) !== input.readiness.integrity_hash
    || complianceHash(input.compliance) !== input.compliance.integrity_hash
    || replayReportHash(input.replay) !== input.replay.integrity_hash
    || integrityReportHash(input.integrity) !== input.integrity.integrity_hash
  ) failures.push("INTEGRITY_HASH_UNREPRODUCIBLE");
  return Object.freeze([...new Set(failures)] as DecisionPackageCertificationFailureReason[]);
}

function resultReplayHash(result: Omit<DecisionPackageCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    observability_result: result.observability_result,
    certification_record: result.certification_record,
    certification_tests: result.certification_tests,
    validation: result.validation,
    production_readiness: result.production_readiness,
    compliance_report: result.compliance_report,
    replay_report: result.replay_report,
    integrity_report: result.integrity_report,
    certification_ledger: result.certification_ledger,
    failures: result.failures,
  });
}

export function certifyDecisionPackage(input: DecisionPackageCertificationGateInput = {}): DecisionPackageCertificationGateResult {
  const observability_result = input.observability_result ?? observeDecisionPackage();
  const certification_tests = input.certification_tests ?? createDecisionPackageCertificationTests(observability_result);
  const initialFailures = failuresFromTests(certification_tests, observability_result, !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT);
  const initialState = outcome(initialFailures);
  const production_readiness = input.production_readiness ?? createProductionReadinessReport(observability_result, initialFailures);
  const compliance_report = input.compliance_report ?? createComplianceCertificationReport(observability_result, initialFailures);
  const replay_report = input.replay_report ?? createReplayCertificationReport(observability_result, initialFailures);
  const integrity_report = input.integrity_report ?? createIntegrityCertificationReport(observability_result, initialFailures);
  const certification_record = input.certification_record ?? createCertificationRecord(observability_result, initialState);
  const failures = gateFailures({
    obs: observability_result,
    tests: certification_tests,
    record: certification_record,
    readiness: production_readiness,
    compliance: compliance_report,
    replay: replay_report,
    integrity: integrity_report,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const state = outcome(failures);
  const finalRecord = certification_record.certification_state === state ? certification_record : createCertificationRecord(observability_result, state);
  const validation = buildValidation(finalRecord.package_id, state, failures);
  const ledger = writeLedger(finalRecord);
  const ledgerFailures: readonly DecisionPackageCertificationFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_HASH_UNREPRODUCIBLE"];
  const finalFailures = Object.freeze([...new Set([...failures, ...ledgerFailures])] as DecisionPackageCertificationFailureReason[]);
  const finalState = outcome(finalFailures);
  const finalValidation = finalFailures.length === failures.length && finalState === state ? validation : buildValidation(finalRecord.package_id, finalState, finalFailures);
  const base: Omit<DecisionPackageCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    gate_status: finalState,
    fail_closed: finalState !== "PASS",
    observability_result,
    certification_record: finalRecord.certification_state === finalState ? finalRecord : createCertificationRecord(observability_result, finalState),
    certification_tests,
    validation: finalValidation,
    production_readiness: finalState === initialState ? production_readiness : createProductionReadinessReport(observability_result, finalFailures),
    compliance_report,
    replay_report,
    integrity_report,
    certification_ledger: ledger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly DecisionPackageCertificationFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(finalRecord.package_id, "FAIL", replayFailures);
    const replayBase: Omit<DecisionPackageCertificationGateResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      gate_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      certification_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionPackageCertification(result: DecisionPackageCertificationGateResult): DecisionPackageCertificationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && replayDecisionPackageObservability(result.observability_result).replay_valid
    && recordHash(result.certification_record) === result.certification_record.integrity_hash
    && result.certification_tests.every((test) => testHash(test) === test.integrity_hash)
    && validationHash(result.validation) === result.validation.integrity_hash
    && readinessHash(result.production_readiness) === result.production_readiness.integrity_hash
    && complianceHash(result.compliance_report) === result.compliance_report.integrity_hash
    && replayReportHash(result.replay_report) === result.replay_report.integrity_hash
    && integrityReportHash(result.integrity_report) === result.integrity_report.integrity_hash
    && result.certification_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: DecisionPackageCertificationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<DecisionPackageCertificationReplay, "integrity_hash"> = {
    replay_id: "replay_decision_package_certification",
    replay_valid,
    certification_id: result.certification_record.certification_id,
    package_id: result.certification_record.package_id,
    certification_outcome: result.gate_status,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildDecisionPackageCertificationObservability(result: DecisionPackageCertificationGateResult): DecisionPackageCertificationObservability {
  return Object.freeze({
    certification_success_rate: result.gate_status === "PASS" ? 1 : 0,
    certification_failures: result.failures.length,
    replay_reproducibility: replayDecisionPackageCertification(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_verified ? 1 : 0,
    package_completeness: result.observability_result.record.completeness_score,
    explainability_score: result.observability_result.record.explainability_score,
    governance_compliance: result.compliance_report.governance_compliance === "PASS" ? 1 : 0,
    constitutional_compliance: result.compliance_report.constitutional_compliance === "PASS" ? 1 : 0,
    production_readiness: result.production_readiness.readiness_status === "READY" ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getDecisionPackageCertificationGateFoundation(): DecisionPackageCertificationGateFoundation {
  const result = certifyDecisionPackage();
  const replay = replayDecisionPackageCertification(result);
  return Object.freeze({
    gate_version: GATE_VERSION,
    certification_states: DECISION_PACKAGE_CERTIFICATION_STATES,
    result,
    replay,
    observability: buildDecisionPackageCertificationObservability(result),
  });
}

export const DecisionPackageCertificationGate = Object.freeze({
  certify: certifyDecisionPackage,
  replay: replayDecisionPackageCertification,
});
