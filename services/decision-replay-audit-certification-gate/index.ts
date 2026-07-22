import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateReplayAnalyticsExplainability } from "@/services/decision-replay-analytics-explainability";
import type { ReplayAnalyticsExplainabilityResult } from "@/types/decision-replay-analytics-explainability";
import type {
  AuditCertificationValidator,
  IntegrityCertificationValidator,
  ReplayAuditCertificationArea,
  ReplayAuditCertificationEvidencePackage,
  ReplayAuditCertificationFailure,
  ReplayAuditCertificationFoundation,
  ReplayAuditCertificationInput,
  ReplayAuditCertificationLedgerEntry,
  ReplayAuditCertificationObservability,
  ReplayAuditCertificationOutcome,
  ReplayAuditCertificationRecord,
  ReplayAuditCertificationReplay,
  ReplayAuditCertificationReport,
  ReplayAuditCertificationResult,
  ReplayAuditCertificationState,
  ReplayAuditCertificationTest,
  ReplayAuditCertificationValidation,
  ReplayAuditConditionalGap,
  ReplayCertificationValidator,
} from "@/types/decision-replay-audit-certification-gate";

const CERTIFICATION_VERSION = "decision-replay-audit-certification-gate/v1" as const;
const CERTIFICATION_SCHEMA_VERSION = "decision-replay-audit-certification-schema/v1" as const;
const NOW = "2026-07-05T02:10:00.000Z";

export const REPLAY_AUDIT_CERTIFICATION_STATES: readonly ReplayAuditCertificationState[] = Object.freeze(["NOT_STARTED", "REPLAY_VALIDATION", "AUDIT_VALIDATION", "INTEGRITY_VALIDATION", "EVIDENCE_VALIDATION", "FINAL_CERTIFICATION", "PASS", "CONDITIONAL_PASS", "FAIL"]);

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

function unique(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))]);
}

function ctx(result: ReplayAnalyticsExplainabilityResult) {
  const ledger = result.ledger_result;
  const integrity = ledger.integrity_result;
  const audit = integrity.audit_result;
  const difference = audit.replay_difference_result;
  const replay = difference.replay_result;
  const trace = replay.trace_builder_result;
  const snapshot = trace.snapshot_capture;
  const contract = snapshot.replay_contract;
  return { ledger, integrity, audit, difference, replay, trace, snapshot, contract };
}

function testHash(record: Omit<ReplayAuditCertificationTest, "integrity_hash"> | ReplayAuditCertificationTest): string {
  return hashWithoutIntegrity(record);
}

export function computeReplayAuditCertificationTestHash(record: Omit<ReplayAuditCertificationTest, "integrity_hash"> | ReplayAuditCertificationTest): string {
  return testHash(record);
}

function addTest(
  tests: ReplayAuditCertificationTest[],
  area: ReplayAuditCertificationArea,
  name: string,
  condition: boolean,
  evidenceRef: string,
  severity: "CRITICAL" | "MAJOR" | "MINOR" = "CRITICAL",
): void {
  const actual: "PASS" | "FAIL" = condition ? "PASS" : "FAIL";
  const base: Omit<ReplayAuditCertificationTest, "integrity_hash"> = {
    test_id: `replay_audit_cert_${area.toLowerCase()}_${String(tests.length + 1).padStart(2, "0")}`,
    certification_area: area,
    test_name: name,
    expected: "PASS",
    actual,
    passed: actual === "PASS",
    severity,
    evidence_ref: evidenceRef,
  };
  tests.push(Object.freeze({ ...base, integrity_hash: testHash(base) }));
}

export function createReplayAuditCertificationTests(result: ReplayAnalyticsExplainabilityResult = generateReplayAnalyticsExplainability()): readonly ReplayAuditCertificationTest[] {
  const c = ctx(result);
  const tests: ReplayAuditCertificationTest[] = [];
  addTest(tests, "REPLAY_CONTRACT", "Replay contract valid", c.contract.validation_status === "VALID" && c.contract.replay_state === "READY_FOR_REPLAY", c.contract.replay_id);
  addTest(tests, "SNAPSHOT_CAPTURE", "Replay snapshots complete", c.snapshot.validation.coverage_complete && c.snapshot.coverage_report.replay_ready, c.snapshot.coverage_report.orchestration_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Input reconstruction deterministic", c.replay.validation.input_match, c.replay.validation.validation_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Context reconstruction deterministic", c.replay.validation.context_match, c.replay.validation.validation_id);
  addTest(tests, "TRACE_BUILDER", "Dependency graph reconstructed", c.replay.validation.graph_match && c.trace.validation.dependency_consistency_valid, c.trace.trace_record.trace_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Priority replay identical", c.replay.validation.priority_match, c.replay.validation.validation_id);
  addTest(tests, "DIFFERENCE_DETECTOR", "Conflict replay identical", c.replay.validation.conflict_match, c.difference.diff_result.replay_diff_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Governance replay identical", c.replay.validation.governance_match, c.replay.execution_record.replay_execution_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Decision package replay identical", c.replay.validation.package_match, c.replay.execution_record.replay_execution_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Operator workflow replay identical", c.replay.validation.operator_workflow_match, c.replay.execution_record.replay_execution_id);
  addTest(tests, "DETERMINISTIC_REPLAY", "Final decision replay identical", c.replay.validation.final_decision_match, c.replay.report.replay_report_id);
  addTest(tests, "DIFFERENCE_DETECTOR", "Replay divergence detection operational", c.difference.diff_result.diff_status === "PASS" && c.difference.drift_report.certification_disposition === "CERTIFICATION_READY", c.difference.diff_result.replay_diff_id);
  addTest(tests, "DIFFERENCE_DETECTOR", "Divergence classification deterministic", c.difference.deterministic && c.difference.diff_result.critical_difference_count === 0, c.difference.dashboard.dashboard_id);
  addTest(tests, "INTEGRITY_ENGINE", "Integrity hashes reproducible", c.integrity.certification_ready && c.integrity.failures.length === 0, c.integrity.verification_record.verification_id);
  addTest(tests, "INTEGRITY_ENGINE", "Tampering detection operational", c.integrity.report.tamper_summary.length > 0 && c.integrity.report.integrity_outcome === "VERIFIED", c.integrity.report.report_id);
  addTest(tests, "IMMUTABLE_LEDGER", "Immutable ledger append-only", c.ledger.append_only && c.ledger.records.length === 8 && c.ledger.failures.length === 0, c.ledger.records[0]?.ledger_record_id ?? c.ledger.integrity_hash);
  addTest(tests, "AUDIT_ENGINE", "Audit report complete", c.audit.validation.report_complete && c.audit.validation.certification_ready, c.audit.audit_record.audit_id);
  addTest(tests, "AUDIT_ENGINE", "Evidence traceability verified", c.audit.validation.evidence_traceable && result.validation.evidence_traceable, c.audit.validation.validation_id);
  addTest(tests, "AUDIT_ENGINE", "Constitutional compliance preserved", c.audit.compliance_summary.constitutional_status === "COMPLIANT", c.audit.compliance_summary.compliance_id);
  addTest(tests, "AUDIT_ENGINE", "Governance enforcement preserved", c.audit.compliance_summary.governance_status === "COMPLIANT", c.audit.compliance_summary.compliance_id);
  addTest(tests, "CROSS_SYSTEM", "Tenant isolation maintained", result.validation.tenant_ownership_valid && c.trace.validation.tenant_ownership_valid, result.validation.validation_id);
  addTest(tests, "TRACE_BUILDER", "Replay lineage complete", c.trace.validation.lineage_complete && c.ledger.commits.every((commit) => commit.lineage_verified), c.trace.validation.validation_id);
  addTest(tests, "CROSS_SYSTEM", "Certification evidence complete", c.audit.certification_evidence.certification_ready && result.certification_ready, c.audit.certification_evidence.evidence_package_id);
  addTest(tests, "CROSS_SYSTEM", "Replay reproducibility verified", result.deterministic && result.analytics_record.replay_success_rate.replay_match_percentage === 100, result.analytics_record.analytics_id);
  addTest(tests, "CROSS_SYSTEM", "Fail-closed behavior enforced", result.validation.validation_status === "VALID" && result.advisory_only && !result.mutates_replay_evidence, result.validation.validation_id);
  return freezeArray(tests);
}

function allTestsPass(tests: readonly ReplayAuditCertificationTest[]): boolean {
  return tests.length > 0 && tests.every((test) => test.passed);
}

export function createReplayCertificationValidator(result: ReplayAnalyticsExplainabilityResult): ReplayCertificationValidator {
  const c = ctx(result);
  const base: Omit<ReplayCertificationValidator, "integrity_hash"> = {
    validator_id: `replay_certification_validator_${c.contract.replay_id}`,
    replay_contract_valid: c.contract.validation_status === "VALID" && c.contract.replay_state === "READY_FOR_REPLAY",
    replay_deterministic: c.replay.deterministic,
    replay_outputs_identical: c.replay.validation.overall_match_status === "MATCH" && !c.replay.validation.divergence_detected,
    replay_reproducible: result.deterministic && result.analytics_record.replay_success_rate.replay_match_percentage === 100,
    snapshot_complete: c.snapshot.validation.coverage_complete,
    trace_complete: c.trace.validation.validation_status === "VALID" && c.trace.trace_record.trace_events.length > 0,
    replay_lineage_complete: c.trace.validation.lineage_complete && c.ledger.failures.every((failure) => failure !== "LINEAGE_BROKEN"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function createAuditCertificationValidator(result: ReplayAnalyticsExplainabilityResult): AuditCertificationValidator {
  const c = ctx(result);
  const base: Omit<AuditCertificationValidator, "integrity_hash"> = {
    validator_id: `audit_certification_validator_${c.audit.audit_record.audit_id}`,
    audit_complete: c.audit.validation.report_complete && c.audit.validation.certification_ready,
    evidence_traceable: c.audit.validation.evidence_traceable && result.validation.evidence_traceable,
    governance_documented: c.audit.validation.governance_documented,
    constitutional_documented: c.audit.validation.constitutional_documented,
    replay_documented: c.audit.validation.replay_verified,
    integrity_documented: c.audit.validation.integrity_verified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function createIntegrityCertificationValidator(result: ReplayAnalyticsExplainabilityResult): IntegrityCertificationValidator {
  const c = ctx(result);
  const base: Omit<IntegrityCertificationValidator, "integrity_hash"> = {
    validator_id: `integrity_certification_validator_${c.integrity.verification_record.verification_id}`,
    integrity_verified: c.integrity.certification_ready && result.validation.integrity_refs_present,
    hashes_reproducible: c.integrity.failures.length === 0 && c.ledger.failures.every((failure) => failure !== "HASH_MISMATCH"),
    ledger_consistent: c.ledger.certification_ready && c.ledger.append_only && c.ledger.read_only_queries,
    tamper_detection_operational: c.integrity.report.tamper_summary.length > 0,
    artifact_integrity_preserved: c.integrity.report.integrity_outcome === "VERIFIED" && !c.integrity.mutates_artifacts,
    tenant_isolation_valid: result.validation.tenant_ownership_valid,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function createReplayAuditCertificationEvidencePackage(result: ReplayAnalyticsExplainabilityResult): ReplayAuditCertificationEvidencePackage {
  const c = ctx(result);
  const certificationId = `replay_audit_certification_${c.contract.orchestration_id}`;
  const base: Omit<ReplayAuditCertificationEvidencePackage, "integrity_hash"> = {
    package_id: `replay_audit_certification_evidence_${c.contract.orchestration_id}`,
    certification_id: certificationId,
    replay_refs: unique(c.ledger.records.flatMap((record) => record.replay_refs)),
    snapshot_refs: freezeArray(c.snapshot.snapshots.map((snapshot) => snapshot.snapshot_id)),
    trace_refs: freezeArray([c.trace.trace_record.trace_id, ...c.trace.trace_record.trace_events.map((event) => event.event_id)]),
    audit_refs: unique(c.ledger.records.flatMap((record) => record.audit_refs)),
    integrity_refs: unique(c.ledger.records.flatMap((record) => record.integrity_refs)),
    governance_refs: unique(c.ledger.records.flatMap((record) => record.governance_refs)),
    constitutional_refs: unique(c.ledger.records.flatMap((record) => record.constitutional_refs)),
    operator_refs: c.audit.certification_evidence.operator_refs,
    lineage_refs: unique([...c.snapshot.lineage_chain, ...c.trace.trace_record.lineage_refs.map((ref) => ref.ref_id), ...c.ledger.records.flatMap((record) => record.parent_record_refs)]),
    analytics_refs: freezeArray([result.analytics_record.analytics_id, result.dashboard.dashboard_id, ...result.explanations.map((explanation) => explanation.explanation_id)]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function outcomeFor(failures: readonly ReplayAuditCertificationFailure[], conditionalGaps: readonly ReplayAuditConditionalGap[], forceUnknown: boolean): ReplayAuditCertificationOutcome {
  if (forceUnknown) return "UNKNOWN" as ReplayAuditCertificationOutcome;
  if (failures.length > 0) return "FAIL";
  if (conditionalGaps.length > 0) return "CONDITIONAL_PASS";
  return "PASS";
}

export function createReplayAuditCertificationReport(
  result: ReplayAnalyticsExplainabilityResult,
  tests: readonly ReplayAuditCertificationTest[],
  outcome: ReplayAuditCertificationOutcome,
): ReplayAuditCertificationReport {
  const c = ctx(result);
  const certificationId = `replay_audit_certification_${c.contract.orchestration_id}`;
  const base: Omit<ReplayAuditCertificationReport, "integrity_hash"> = {
    report_id: `replay_audit_certification_report_${c.contract.orchestration_id}`,
    certification_id: certificationId,
    replay_summary: `${c.contract.replay_id} replay status ${c.replay.validation.overall_match_status}.`,
    audit_summary: `${c.audit.audit_record.audit_id} validation ${c.audit.validation.validation_status}.`,
    integrity_summary: `${c.integrity.verification_record.verification_id} outcome ${c.integrity.report.integrity_outcome}.`,
    governance_summary: c.audit.compliance_summary.governance_status,
    constitutional_summary: c.audit.compliance_summary.constitutional_status,
    operator_summary: `${c.audit.certification_evidence.operator_refs.length} operator evidence refs preserved.`,
    evidence_summary: `${tests.filter((test) => test.passed).length}/${tests.length} certification tests passed.`,
    test_results: freezeArray(tests.map((test) => `${test.test_id}:${test.actual}`)),
    certification_outcome: outcome,
    phase_advancement_allowed: outcome === "PASS",
    certification_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function createReplayAuditCertificationRecord(
  result: ReplayAnalyticsExplainabilityResult,
  tests: readonly ReplayAuditCertificationTest[],
  replayValidator: ReplayCertificationValidator,
  auditValidator: AuditCertificationValidator,
  integrityValidator: IntegrityCertificationValidator,
  evidence: ReplayAuditCertificationEvidencePackage,
  report: ReplayAuditCertificationReport,
  outcome: ReplayAuditCertificationOutcome,
  conditionalGaps: readonly ReplayAuditConditionalGap[],
): ReplayAuditCertificationRecord {
  const c = ctx(result);
  const base: Omit<ReplayAuditCertificationRecord, "integrity_hash"> = {
    certification_id: evidence.certification_id,
    mission_id: c.contract.mission_id,
    orchestration_id: c.contract.orchestration_id,
    tenant_id: c.contract.tenant_id,
    certification_version: CERTIFICATION_VERSION,
    schema_version: CERTIFICATION_SCHEMA_VERSION,
    replay_validation_ref: replayValidator.validator_id,
    audit_validation_ref: auditValidator.validator_id,
    integrity_validation_ref: integrityValidator.validator_id,
    certification_tests: freezeArray(tests.map((test) => test.test_id)),
    passed_tests: tests.filter((test) => test.passed).length,
    failed_tests: tests.filter((test) => !test.passed).length,
    certification_outcome: outcome,
    evidence_package_ref: evidence.package_id,
    certification_report_ref: report.report_id,
    lineage_refs: evidence.lineage_refs,
    conditional_gaps: freezeArray(conditionalGaps),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function packageComplete(evidence: ReplayAuditCertificationEvidencePackage): boolean {
  return Boolean(
    evidence.replay_refs.length
      && evidence.snapshot_refs.length
      && evidence.trace_refs.length
      && evidence.audit_refs.length
      && evidence.integrity_refs.length
      && evidence.governance_refs.length
      && evidence.constitutional_refs.length
      && evidence.operator_refs.length
      && evidence.lineage_refs.length
      && evidence.analytics_refs.length,
  );
}

function collectFailures(input: {
  analytics: ReplayAnalyticsExplainabilityResult;
  tests: readonly ReplayAuditCertificationTest[];
  replay: ReplayCertificationValidator;
  audit: AuditCertificationValidator;
  integrity: IntegrityCertificationValidator;
  evidence: ReplayAuditCertificationEvidencePackage;
  report: ReplayAuditCertificationReport;
  record: ReplayAuditCertificationRecord;
  ledger: readonly ReplayAuditCertificationLedgerEntry[];
}): readonly ReplayAuditCertificationFailure[] {
  const failures: ReplayAuditCertificationFailure[] = [];
  const c = ctx(input.analytics);
  if (!input.replay.replay_contract_valid) failures.push("REPLAY_CONTRACT_INVALID");
  if (!input.replay.replay_deterministic || !input.analytics.deterministic) failures.push("REPLAY_NONDETERMINISTIC");
  if (!input.replay.replay_outputs_identical) failures.push("REPLAY_MISMATCH");
  if (!input.replay.snapshot_complete) failures.push("SNAPSHOT_MISSING");
  if (!input.replay.trace_complete) failures.push("TRACE_MISSING");
  if (!input.audit.audit_complete) failures.push("AUDIT_INCOMPLETE");
  if (!input.integrity.integrity_verified || !input.integrity.hashes_reproducible) failures.push("INTEGRITY_MISMATCH");
  if (!input.audit.governance_documented || c.audit.compliance_summary.governance_status !== "COMPLIANT") failures.push("GOVERNANCE_VIOLATION");
  if (!input.audit.constitutional_documented || c.audit.compliance_summary.constitutional_status !== "COMPLIANT") failures.push("CONSTITUTIONAL_VIOLATION");
  if (!input.evidence.operator_refs.length) failures.push("OPERATOR_INCONSISTENCY");
  if (!input.integrity.ledger_consistent || c.ledger.failures.length > 0) failures.push("IMMUTABLE_LEDGER_MUTATION");
  if (!input.audit.evidence_traceable || !packageComplete(input.evidence)) failures.push("EVIDENCE_INCOMPLETE");
  if (!input.replay.replay_lineage_complete) failures.push("REPLAY_LINEAGE_BROKEN");
  if (!packageComplete(input.evidence) || input.record.evidence_package_ref !== input.evidence.package_id) failures.push("CERTIFICATION_EVIDENCE_INCOMPLETE");
  if (input.record.certification_version !== CERTIFICATION_VERSION || input.record.schema_version !== CERTIFICATION_SCHEMA_VERSION || input.analytics.analytics_engine_version !== "decision-replay-analytics-explainability/v1") failures.push("UNSUPPORTED_VERSION");
  if (!input.integrity.tenant_isolation_valid) failures.push("TENANT_BOUNDARY_VIOLATION");
  if (!["PASS", "CONDITIONAL_PASS", "FAIL"].includes(input.record.certification_outcome) || !["PASS", "CONDITIONAL_PASS", "FAIL"].includes(input.report.certification_outcome)) failures.push("UNKNOWN_CERTIFICATION_OUTCOME");
  if (input.analytics.validation.validation_status === "BLOCKED" && input.analytics.certification_ready) failures.push("FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED");
  if (!allTestsPass(input.tests)) failures.push("CERTIFICATION_TEST_FAILURE");
  if (
    input.tests.some((test) => testHash(test) !== test.integrity_hash)
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.audit) !== input.audit.integrity_hash
    || hashWithoutIntegrity(input.integrity) !== input.integrity.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || hashWithoutIntegrity(input.report) !== input.report.integrity_hash
    || hashWithoutIntegrity(input.record) !== input.record.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("CERTIFICATION_HASH_MISMATCH");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("IMMUTABLE_LEDGER_MUTATION");
  return freezeArray([...new Set(failures)]);
}

function createCertificationLedger(record: ReplayAuditCertificationRecord, evidence: ReplayAuditCertificationEvidencePackage, report: ReplayAuditCertificationReport): readonly ReplayAuditCertificationLedgerEntry[] {
  const base: Omit<ReplayAuditCertificationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `replay_audit_certification_ledger_${record.certification_id}`,
    certification_id: record.certification_id,
    sequence: 1,
    certification_record_hash: record.integrity_hash,
    evidence_package_hash: evidence.integrity_hash,
    certification_report_hash: report.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function createValidation(
  record: ReplayAuditCertificationRecord,
  failures: readonly ReplayAuditCertificationFailure[],
  conditionalGaps: readonly ReplayAuditConditionalGap[],
): ReplayAuditCertificationValidation {
  const has = (failure: ReplayAuditCertificationFailure) => failures.includes(failure);
  const validationStatus = failures.length > 0 ? "REJECTED" : conditionalGaps.length > 0 ? "CONDITIONAL" : "VALID";
  const base: Omit<ReplayAuditCertificationValidation, "integrity_hash"> = {
    validation_id: `replay_audit_certification_validation_${record.certification_id}`,
    certification_id: record.certification_id,
    validation_status: validationStatus,
    replay_certified: !has("REPLAY_CONTRACT_INVALID") && !has("REPLAY_NONDETERMINISTIC") && !has("REPLAY_MISMATCH"),
    audit_certified: !has("AUDIT_INCOMPLETE") && !has("EVIDENCE_INCOMPLETE"),
    integrity_certified: !has("INTEGRITY_MISMATCH") && !has("CERTIFICATION_HASH_MISMATCH"),
    governance_preserved: !has("GOVERNANCE_VIOLATION"),
    constitutional_preserved: !has("CONSTITUTIONAL_VIOLATION"),
    operator_traceable: !has("OPERATOR_INCONSISTENCY"),
    evidence_complete: !has("EVIDENCE_INCOMPLETE") && !has("CERTIFICATION_EVIDENCE_INCOMPLETE"),
    immutable_evidence_preserved: !has("IMMUTABLE_LEDGER_MUTATION"),
    tenant_isolation_valid: !has("TENANT_BOUNDARY_VIOLATION"),
    fail_closed_enforced: !has("FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"),
    phase_advancement_allowed: validationStatus === "VALID",
    failures,
    conditional_gaps: freezeArray(conditionalGaps),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ReplayAuditCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    analytics_result: result.analytics_result,
    certification_tests: result.certification_tests,
    replay_validator: result.replay_validator,
    audit_validator: result.audit_validator,
    integrity_validator: result.integrity_validator,
    evidence_package: result.evidence_package,
    certification_report: result.certification_report,
    certification_record: result.certification_record,
    certification_ledger: result.certification_ledger,
    validation: result.validation,
    failures: result.failures,
    conditional_gaps: result.conditional_gaps,
  });
}

export function runReplayAuditCertificationGate(input: ReplayAuditCertificationInput = {}): ReplayAuditCertificationResult {
  const analytics_result = input.analytics_result ?? generateReplayAnalyticsExplainability();
  const certification_tests = input.certification_tests ?? createReplayAuditCertificationTests(analytics_result);
  const replay_validator = input.replay_validator ?? createReplayCertificationValidator(analytics_result);
  const audit_validator = input.audit_validator ?? createAuditCertificationValidator(analytics_result);
  const integrity_validator = input.integrity_validator ?? createIntegrityCertificationValidator(analytics_result);
  const conditional_gaps = freezeArray(input.conditional_gaps ?? []);
  const preFailures: readonly ReplayAuditCertificationFailure[] = allTestsPass(certification_tests) && analytics_result.certification_ready ? [] : ["CERTIFICATION_TEST_FAILURE"];
  const outcome = outcomeFor(preFailures, conditional_gaps, input.force_unknown_outcome === true);
  const evidence_package = input.evidence_package ?? createReplayAuditCertificationEvidencePackage(analytics_result);
  const certification_report = input.certification_report ?? createReplayAuditCertificationReport(analytics_result, certification_tests, outcome);
  const certification_record = input.certification_record ?? createReplayAuditCertificationRecord(analytics_result, certification_tests, replay_validator, audit_validator, integrity_validator, evidence_package, certification_report, outcome, conditional_gaps);
  const certification_ledger = input.certification_ledger ?? createCertificationLedger(certification_record, evidence_package, certification_report);
  const failures = collectFailures({
    analytics: analytics_result,
    tests: certification_tests,
    replay: replay_validator,
    audit: audit_validator,
    integrity: integrity_validator,
    evidence: evidence_package,
    report: certification_report,
    record: certification_record,
    ledger: certification_ledger,
  });
  const finalStatus = input.force_unknown_outcome === true ? "FAIL" : outcomeFor(failures, conditional_gaps, false);
  const validation = createValidation(certification_record, failures, conditional_gaps);
  const base: Omit<ReplayAuditCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_status: finalStatus,
    fail_closed: finalStatus !== "PASS",
    analytics_result,
    certification_tests,
    replay_validator,
    audit_validator,
    integrity_validator,
    evidence_package,
    certification_report,
    certification_record,
    certification_ledger,
    validation,
    failures: validation.failures,
    conditional_gaps,
    deterministic: true,
    advisory_only: true,
    mutates_replay_or_audit_evidence: false,
    phase_advancement_allowed: finalStatus === "PASS",
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly ReplayAuditCertificationFailure[] = freezeArray(["CERTIFICATION_REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(certification_record, replayFailures, []);
    const replayBase: Omit<ReplayAuditCertificationResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      certification_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      failures: replayFailures,
      conditional_gaps: [],
      phase_advancement_allowed: false,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayReplayAuditCertification(result: ReplayAuditCertificationResult): ReplayAuditCertificationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.certification_tests.every((test) => testHash(test) === test.integrity_hash)
    && hashWithoutIntegrity(result.replay_validator) === result.replay_validator.integrity_hash
    && hashWithoutIntegrity(result.audit_validator) === result.audit_validator.integrity_hash
    && hashWithoutIntegrity(result.integrity_validator) === result.integrity_validator.integrity_hash
    && hashWithoutIntegrity(result.evidence_package) === result.evidence_package.integrity_hash
    && hashWithoutIntegrity(result.certification_report) === result.certification_report.integrity_hash
    && hashWithoutIntegrity(result.certification_record) === result.certification_record.integrity_hash
    && result.certification_ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.validation) === result.validation.integrity_hash;
  const failures: ReplayAuditCertificationFailure[] = replay_valid ? [] : ["CERTIFICATION_REPLAY_DIVERGENCE"];
  const base: Omit<ReplayAuditCertificationReplay, "integrity_hash"> = {
    replay_id: "replay_decision_replay_audit_certification_gate",
    replay_valid,
    certification_id: result.certification_record.certification_id,
    certification_status: result.certification_status,
    certified_test_ids: freezeArray(result.certification_tests.filter((test) => test.passed).map((test) => test.test_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: freezeArray(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildReplayAuditCertificationObservability(result: ReplayAuditCertificationResult): ReplayAuditCertificationObservability {
  return Object.freeze({
    certification_runs: 1,
    certification_tests_executed: result.certification_tests.length,
    certification_tests_passed: result.certification_tests.filter((test) => test.passed).length,
    certification_tests_failed: result.certification_tests.filter((test) => !test.passed).length,
    phase_advancement_approvals: result.phase_advancement_allowed ? 1 : 0,
    conditional_passes: result.certification_status === "CONDITIONAL_PASS" ? 1 : 0,
    replay_reproducibility: replayReplayAuditCertification(result).replay_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getReplayAuditCertificationFoundation(): ReplayAuditCertificationFoundation {
  const result = runReplayAuditCertificationGate();
  const replay = replayReplayAuditCertification(result);
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    certification_states: REPLAY_AUDIT_CERTIFICATION_STATES,
    result,
    replay,
    observability: buildReplayAuditCertificationObservability(result),
  });
}

export const ReplayAuditCertificationGate = Object.freeze({
  run: runReplayAuditCertificationGate,
  replay: replayReplayAuditCertification,
});
