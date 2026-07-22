import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateFailClosedEnforcement } from "@/services/fail-closed-enforcement-engine";
import { replayGovernanceDecisionLedger, writeGovernanceDecisionLedger } from "@/services/governance-decision-ledger";
import type { GovernanceDecisionLedgerResult } from "@/types/governance-decision-ledger";
import type {
  GovernanceCertificationReport,
  GovernanceDecisionCertificationCategory,
  GovernanceDecisionCertificationFailureReason,
  GovernanceDecisionCertificationGateFoundation,
  GovernanceDecisionCertificationGateInput,
  GovernanceDecisionCertificationGateResult,
  GovernanceDecisionCertificationObservability,
  GovernanceDecisionCertificationPackage,
  GovernanceDecisionCertificationReplay,
  GovernanceDecisionCertificationState,
  GovernanceDecisionCertificationTest,
  GovernanceDecisionCertificationTestName,
  GovernanceDecisionCertificationValidation,
} from "@/types/governance-constitutional-decision-certification-gate";

const GATE_VERSION = "governance-constitutional-decision-certification-gate/v1" as const;
const AUTHORIZED_COMPONENT = "governance-constitutional-decision-certification-gate";

export const GOVERNANCE_DECISION_CERTIFICATION_STATES: readonly GovernanceDecisionCertificationState[] = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL"]);
export const GOVERNANCE_DECISION_CERTIFICATION_CATEGORIES: readonly GovernanceDecisionCertificationCategory[] = Object.freeze([
  "Governance Validation",
  "Constitutional Validation",
  "Authority Validation",
  "Tenant Isolation Validation",
  "Certification & Replay Validation",
  "Integrity Validation",
  "Enforcement Validation",
  "Ledger Validation",
  "Production Readiness",
]);

const TEST_PLAN: readonly Readonly<{ name: GovernanceDecisionCertificationTestName; category: GovernanceDecisionCertificationCategory }>[] = Object.freeze([
  { name: "Governance contract valid", category: "Governance Validation" },
  { name: "Governance policy enforced", category: "Governance Validation" },
  { name: "Constitutional compliance verified", category: "Constitutional Validation" },
  { name: "Constitutional violations blocked", category: "Constitutional Validation" },
  { name: "Authority validation deterministic", category: "Authority Validation" },
  { name: "Unauthorized authority rejected", category: "Authority Validation" },
  { name: "Operator approval enforced", category: "Authority Validation" },
  { name: "Governance review enforced", category: "Governance Validation" },
  { name: "Certification requirements verified", category: "Certification & Replay Validation" },
  { name: "Replay availability verified", category: "Certification & Replay Validation" },
  { name: "Replay mismatch detected", category: "Certification & Replay Validation" },
  { name: "Immutable lineage verified", category: "Integrity Validation" },
  { name: "Integrity hashes verified", category: "Integrity Validation" },
  { name: "Tenant isolation enforced", category: "Tenant Isolation Validation" },
  { name: "Cross-tenant leakage blocked", category: "Tenant Isolation Validation" },
  { name: "Advisory-only behavior enforced", category: "Production Readiness" },
  { name: "Fail-closed rules deterministic", category: "Enforcement Validation" },
  { name: "Missing governance evidence fails closed", category: "Enforcement Validation" },
  { name: "Missing constitutional evidence fails closed", category: "Enforcement Validation" },
  { name: "Missing replay fails closed", category: "Enforcement Validation" },
  { name: "Missing certification fails closed", category: "Enforcement Validation" },
  { name: "Unknown validation state fails closed", category: "Enforcement Validation" },
  { name: "Hidden governance bypass rejected", category: "Enforcement Validation" },
  { name: "Hidden constitutional bypass rejected", category: "Enforcement Validation" },
  { name: "Replay deterministic", category: "Certification & Replay Validation" },
  { name: "Replay reproducible", category: "Certification & Replay Validation" },
  { name: "Ledger immutable", category: "Ledger Validation" },
  { name: "Evidence lineage reproducible", category: "Ledger Validation" },
  { name: "Audit trail complete", category: "Ledger Validation" },
  { name: "Certification replay successful", category: "Production Readiness" },
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function testHash(test: Omit<GovernanceDecisionCertificationTest, "integrity_hash"> | GovernanceDecisionCertificationTest): string {
  return hashWithoutIntegrity(test);
}

function passIf(condition: boolean): GovernanceDecisionCertificationState {
  return condition ? "PASS" : "FAIL";
}

function testCondition(name: GovernanceDecisionCertificationTestName, ledger: GovernanceDecisionLedgerResult): boolean {
  const enforcement = ledger.enforcement_result;
  const replay = replayGovernanceDecisionLedger(ledger);
  const failClosedProbe = evaluateFailClosedEnforcement({ replay_expected_hash: `${enforcement.replay_hash}_mismatch` });
  const constitutionalProbe = evaluateFailClosedEnforcement({
    constitutional_result: { ...enforcement.constitutional_result, constitutional_validation_status: "FAIL" as const },
  });
  const authorityProbe = evaluateFailClosedEnforcement({
    authority_result: { ...enforcement.authority_result, authority_resolution_status: "FAIL" as const },
  });
  const tenantProbe = evaluateFailClosedEnforcement({
    tenant_result: { ...enforcement.tenant_result, tenant_isolation_status: "FAIL" as const },
  });
  switch (name) {
    case "Governance contract valid": return enforcement.governance_validation.validation_state === "VALID";
    case "Governance policy enforced": return enforcement.governance_policy_result.policy_validation_status === "PASS";
    case "Constitutional compliance verified": return enforcement.constitutional_result.constitutional_validation_status === "PASS";
    case "Constitutional violations blocked": return constitutionalProbe.evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Authority validation deterministic": return enforcement.authority_result.deterministic;
    case "Unauthorized authority rejected": return authorityProbe.evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Operator approval enforced": return enforcement.evaluation_record.approval_requirements.length > 0 && enforcement.advisory_only;
    case "Governance review enforced": return ledger.governance_reviews.length > 0 && ledger.governance_reviews.every((review) => review.review_outcome !== "REJECTED");
    case "Certification requirements verified": return enforcement.certification_replay_result.certification_replay_status === "PASS";
    case "Replay availability verified": return enforcement.certification_replay_result.replay_report.reconstruction_status === "RECONSTRUCTED";
    case "Replay mismatch detected": return failClosedProbe.evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Immutable lineage verified": return enforcement.integrity_lineage_result.validation.checks.lineage_complete;
    case "Integrity hashes verified": return enforcement.integrity_lineage_result.validation.checks.hashes_reproducible;
    case "Tenant isolation enforced": return enforcement.tenant_result.tenant_isolation_status === "PASS";
    case "Cross-tenant leakage blocked": return tenantProbe.evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Advisory-only behavior enforced": return enforcement.advisory_only && ledger.advisory_only;
    case "Fail-closed rules deterministic": return failClosedProbe.failures.includes("REPLAY_DIVERGENCE");
    case "Missing governance evidence fails closed": return evaluateFailClosedEnforcement({ governance_decision: { ...enforcement.governance_decision, evidence_refs: [] } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Missing constitutional evidence fails closed": return evaluateFailClosedEnforcement({ constitutional_result: { ...enforcement.constitutional_result, evidence_report: { ...enforcement.constitutional_result.evidence_report, evidence_refs: [] } } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Missing replay fails closed": return evaluateFailClosedEnforcement({ certification_replay_result: { ...enforcement.certification_replay_result, replay_report: { ...enforcement.certification_replay_result.replay_report, reconstruction_status: "FAILED" as const } } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Missing certification fails closed": return evaluateFailClosedEnforcement({ certification_replay_result: { ...enforcement.certification_replay_result, certification_replay_status: "FAIL" as const } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Unknown validation state fails closed": return evaluateFailClosedEnforcement({ integrity_lineage_result: { ...enforcement.integrity_lineage_result, validation_outcome: "UNKNOWN" as const } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Hidden governance bypass rejected": return evaluateFailClosedEnforcement({ governance_policy_result: { ...enforcement.governance_policy_result, policy_validation_status: "FAIL" as const } }).evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Hidden constitutional bypass rejected": return constitutionalProbe.evaluation_record.enforcement_outcome === "FAIL_CLOSED";
    case "Replay deterministic": return enforcement.certification_replay_result.deterministic && enforcement.integrity_lineage_result.deterministic && ledger.deterministic;
    case "Replay reproducible": return replay.replay_valid;
    case "Ledger immutable": return ledger.validation.checks.append_only && ledger.validation.checks.integrity_hash_valid;
    case "Evidence lineage reproducible": return ledger.ledger_record.evidence_refs.length > 0 && ledger.ledger_record.lineage_refs.length > 0;
    case "Audit trail complete": return ledger.timeline.length >= 10 && ledger.archive.ledger_ref === ledger.ledger_record.ledger_id;
    case "Certification replay successful": return replay.replay_valid && ledger.ledger_status === "PASS";
  }
}

export function createGovernanceDecisionCertificationTests(ledger: GovernanceDecisionLedgerResult = writeGovernanceDecisionLedger()): readonly GovernanceDecisionCertificationTest[] {
  return Object.freeze(TEST_PLAN.map((item, index) => {
    const actual = passIf(testCondition(item.name, ledger));
    const base: Omit<GovernanceDecisionCertificationTest, "integrity_hash"> = {
      test_id: `phase_9_7_certification_test_${String(index + 1).padStart(2, "0")}`,
      test_name: item.name,
      category: item.category,
      expected: "PASS",
      actual,
      evidence_refs: ledger.ledger_record.evidence_refs,
      replay_refs: ledger.ledger_record.replay_refs,
      rationale: `${item.name} evaluated as ${actual}.`,
    };
    return Object.freeze({ ...base, integrity_hash: testHash(base) });
  }));
}

function packageHash(pkg: Omit<GovernanceDecisionCertificationPackage, "integrity_hash"> | GovernanceDecisionCertificationPackage): string {
  return hashWithoutIntegrity(pkg);
}

function certificationState(tests: readonly GovernanceDecisionCertificationTest[], failures: readonly GovernanceDecisionCertificationFailureReason[]): GovernanceDecisionCertificationState {
  if (failures.length > 0 || tests.some((test) => test.actual === "FAIL")) return "FAIL";
  if (tests.some((test) => test.actual === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

function buildPackage(ledger: GovernanceDecisionLedgerResult, tests: readonly GovernanceDecisionCertificationTest[], failures: readonly GovernanceDecisionCertificationFailureReason[]): GovernanceDecisionCertificationPackage {
  const state = certificationState(tests, failures);
  const base: Omit<GovernanceDecisionCertificationPackage, "integrity_hash"> = {
    certification_id: `phase_9_7_certification_${ledger.ledger_record.governance_decision_id}`,
    phase_id: "Mission Control Phase 9.7",
    certification_state: state,
    certification_tests: tests.map((test) => test.test_id),
    governance_results: ledger.ledger_record.validation_results,
    constitutional_results: ledger.ledger_record.constitutional_results,
    authority_results: ledger.ledger_record.authority_results,
    tenant_results: ledger.ledger_record.tenant_results,
    certification_results: ledger.ledger_record.certification_results,
    replay_results: ledger.ledger_record.replay_results,
    integrity_results: ledger.ledger_record.integrity_results,
    enforcement_results: [ledger.ledger_record.enforcement_outcome],
    ledger_results: [ledger.ledger_record.ledger_id, ledger.validation.validation_state],
    production_readiness: state === "PASS" ? "READY" : "NOT_READY",
    evidence_refs: ledger.ledger_record.evidence_refs,
    replay_refs: ledger.ledger_record.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

function reportHash(report: Omit<GovernanceCertificationReport, "integrity_hash"> | GovernanceCertificationReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(pkg: GovernanceDecisionCertificationPackage, tests: readonly GovernanceDecisionCertificationTest[]): GovernanceCertificationReport {
  const passed = tests.filter((test) => test.actual === "PASS").map((test) => test.test_name);
  const failed = tests.filter((test) => test.actual === "FAIL").map((test) => test.test_name);
  const base: Omit<GovernanceCertificationReport, "integrity_hash"> = {
    report_id: `final_certification_report_${pkg.certification_id}`,
    certification_outcome: pkg.certification_state,
    executed_test_suite: tests.map((test) => test.test_name),
    passed_tests: passed,
    failed_tests: failed,
    conditional_findings: tests.filter((test) => test.actual === "CONDITIONAL_PASS").map((test) => test.test_name),
    governance_summary: pkg.governance_results.join(";"),
    constitutional_summary: pkg.constitutional_results.join(";"),
    replay_validation: pkg.replay_results.join(";"),
    integrity_validation: pkg.integrity_results.join(";"),
    tenant_isolation_summary: pkg.tenant_results.join(";"),
    enforcement_summary: pkg.enforcement_results.join(";"),
    production_readiness: pkg.production_readiness,
    evidence_refs: pkg.evidence_refs,
    replay_ref: `replay_${pkg.certification_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function validationResult(failures: readonly GovernanceDecisionCertificationFailureReason[]): GovernanceDecisionCertificationValidation {
  const unique = Object.freeze([...new Set(failures)] as GovernanceDecisionCertificationFailureReason[]);
  const has = (failure: GovernanceDecisionCertificationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      governance_certified: !has("GOVERNANCE_POLICY_BYPASS"),
      constitutional_certified: !has("CONSTITUTIONAL_RULE_VIOLATION"),
      authority_certified: !has("UNAUTHORIZED_AUTHORITY_ESCALATION") && !has("OPERATOR_AUTHORITY_BYPASS"),
      tenant_certified: !has("CROSS_TENANT_DATA_LEAKAGE"),
      certification_replay_certified: !has("CERTIFICATION_REQUIREMENT_BYPASSED") && !has("REPLAY_UNAVAILABLE_BUT_ALLOWED") && !has("REPLAY_DIVERGENCE_IGNORED"),
      integrity_certified: !has("INTEGRITY_HASH_MISMATCH_IGNORED") && !has("IMMUTABLE_LINEAGE_BROKEN"),
      enforcement_certified: !has("FAIL_OPEN_BEHAVIOR_DETECTED") && !has("HIDDEN_EXECUTION_PERMITTED"),
      ledger_certified: !has("LEDGER_CERTIFICATION_INVALID") && !has("INCOMPLETE_AUDIT_EVIDENCE"),
      production_ready: unique.length === 0,
      advisory_only: !has("ADVISORY_ONLY_BEHAVIOR_VIOLATED"),
    }),
  });
}

function certificationFailures(input: {
  ledger: GovernanceDecisionLedgerResult;
  tests: readonly GovernanceDecisionCertificationTest[];
  authorized: boolean;
}): readonly GovernanceDecisionCertificationFailureReason[] {
  const failures: GovernanceDecisionCertificationFailureReason[] = [];
  const testFailed = (name: GovernanceDecisionCertificationTestName) => input.tests.some((test) => test.test_name === name && test.actual !== "PASS");
  if (!input.authorized) failures.push("UNAUTHORIZED_CERTIFICATION_GATE_ACCESS");
  if (input.ledger.ledger_status !== "PASS" || input.ledger.validation.validation_state !== "VALID") failures.push("LEDGER_CERTIFICATION_INVALID");
  if (testFailed("Governance policy enforced") || testFailed("Hidden governance bypass rejected")) failures.push("GOVERNANCE_POLICY_BYPASS");
  if (testFailed("Constitutional compliance verified") || testFailed("Constitutional violations blocked") || testFailed("Hidden constitutional bypass rejected")) failures.push("CONSTITUTIONAL_RULE_VIOLATION");
  if (testFailed("Unauthorized authority rejected")) failures.push("UNAUTHORIZED_AUTHORITY_ESCALATION");
  if (testFailed("Operator approval enforced")) failures.push("OPERATOR_AUTHORITY_BYPASS");
  if (testFailed("Governance review enforced")) failures.push("GOVERNANCE_REVIEW_BYPASS");
  if (testFailed("Cross-tenant leakage blocked") || testFailed("Tenant isolation enforced")) failures.push("CROSS_TENANT_DATA_LEAKAGE");
  if (testFailed("Missing governance evidence fails closed")) failures.push("MISSING_GOVERNANCE_EVIDENCE_ACCEPTED");
  if (testFailed("Missing constitutional evidence fails closed")) failures.push("MISSING_CONSTITUTIONAL_EVIDENCE_ACCEPTED");
  if (testFailed("Missing replay fails closed") || testFailed("Replay availability verified")) failures.push("REPLAY_UNAVAILABLE_BUT_ALLOWED");
  if (testFailed("Replay mismatch detected") || testFailed("Replay reproducible")) failures.push("REPLAY_DIVERGENCE_IGNORED");
  if (testFailed("Missing certification fails closed") || testFailed("Certification requirements verified")) failures.push("CERTIFICATION_REQUIREMENT_BYPASSED");
  if (testFailed("Integrity hashes verified")) failures.push("INTEGRITY_HASH_MISMATCH_IGNORED");
  if (testFailed("Immutable lineage verified") || testFailed("Evidence lineage reproducible")) failures.push("IMMUTABLE_LINEAGE_BROKEN");
  if (testFailed("Advisory-only behavior enforced")) failures.push("ADVISORY_ONLY_BEHAVIOR_VIOLATED");
  if (testFailed("Fail-closed rules deterministic") || testFailed("Unknown validation state fails closed")) failures.push("FAIL_OPEN_BEHAVIOR_DETECTED");
  if (testFailed("Governance contract valid") || testFailed("Authority validation deterministic") || testFailed("Replay deterministic")) failures.push("NONDETERMINISTIC_GOVERNANCE_EVALUATION");
  if (testFailed("Fail-closed rules deterministic")) failures.push("NONDETERMINISTIC_ENFORCEMENT_OUTCOME");
  if (testFailed("Audit trail complete") || testFailed("Ledger immutable")) failures.push("INCOMPLETE_AUDIT_EVIDENCE");
  if (input.tests.some((test) => testHash(test) !== test.integrity_hash)) failures.push("INTEGRITY_HASH_MISMATCH_IGNORED");
  return Object.freeze([...new Set(failures)] as GovernanceDecisionCertificationFailureReason[]);
}

function resultReplayHash(result: Omit<GovernanceDecisionCertificationGateResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_result: result.ledger_result,
    certification_tests: result.certification_tests,
    evidence_package: result.evidence_package,
    final_report: result.final_report,
    validation: result.validation,
    failures: result.failures,
  });
}

export function certifyGovernanceConstitutionalDecision(input: GovernanceDecisionCertificationGateInput = {}): GovernanceDecisionCertificationGateResult {
  const ledger_result = input.ledger_result ?? writeGovernanceDecisionLedger();
  const certification_tests = Object.freeze([...(input.certification_tests ?? createGovernanceDecisionCertificationTests(ledger_result))].sort((a, b) => a.test_id.localeCompare(b.test_id)));
  const failures = certificationFailures({
    ledger: ledger_result,
    tests: certification_tests,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = validationResult(failures);
  const evidence_package = buildPackage(ledger_result, certification_tests, validation.failures);
  const final_report = buildReport(evidence_package, certification_tests);
  const base: Omit<GovernanceDecisionCertificationGateResult, "integrity_hash" | "replay_hash"> = {
    gate_status: evidence_package.certification_state,
    fail_closed: validation.fail_closed,
    ledger_result,
    certification_tests,
    evidence_package,
    final_report,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayValidation = validationResult(["CERTIFICATION_REPLAY_FAILED"]);
    const replayPackage = buildPackage(ledger_result, certification_tests, replayValidation.failures);
    const replayReport = buildReport(replayPackage, certification_tests);
    const replayBase: Omit<GovernanceDecisionCertificationGateResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      gate_status: "FAIL",
      fail_closed: true,
      evidence_package: replayPackage,
      final_report: replayReport,
      validation: replayValidation,
      failures: replayValidation.failures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernanceDecisionCertification(result: GovernanceDecisionCertificationGateResult): GovernanceDecisionCertificationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.certification_tests.every((test) => testHash(test) === test.integrity_hash)
    && packageHash(result.evidence_package) === result.evidence_package.integrity_hash
    && reportHash(result.final_report) === result.final_report.integrity_hash;
  const failures: GovernanceDecisionCertificationFailureReason[] = replay_valid ? [] : ["CERTIFICATION_REPLAY_FAILED"];
  const base: Omit<GovernanceDecisionCertificationReplay, "integrity_hash"> = {
    replay_id: "replay_governance_constitutional_decision_certification_gate",
    replay_valid,
    certification_id: result.evidence_package.certification_id,
    certification_state: result.evidence_package.certification_state,
    ledger_ref: result.ledger_result.ledger_record.ledger_id,
    test_refs: result.certification_tests.map((test) => test.test_id),
    passed_tests: result.final_report.passed_tests,
    failed_tests: result.final_report.failed_tests,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildGovernanceDecisionCertificationObservability(result: GovernanceDecisionCertificationGateResult): GovernanceDecisionCertificationObservability {
  return Object.freeze({
    certification_start_events: 1,
    test_execution_events: result.certification_tests.length,
    replay_validation_events: result.certification_tests.filter((test) => test.category === "Certification & Replay Validation").length,
    governance_validation_events: result.certification_tests.filter((test) => test.category === "Governance Validation").length,
    constitutional_validation_events: result.certification_tests.filter((test) => test.category === "Constitutional Validation").length,
    integrity_verification_events: result.certification_tests.filter((test) => test.category === "Integrity Validation").length,
    enforcement_verification_events: result.certification_tests.filter((test) => test.category === "Enforcement Validation").length,
    certification_outcome_events: 1,
    certification_replay_events: replayGovernanceDecisionCertification(result).replay_valid ? 1 : 0,
    production_readiness_events: result.evidence_package.production_readiness === "READY" ? 1 : 0,
  });
}

export function getGovernanceDecisionCertificationGateFoundation(): GovernanceDecisionCertificationGateFoundation {
  const result = certifyGovernanceConstitutionalDecision();
  const replay = replayGovernanceDecisionCertification(result);
  return Object.freeze({
    gate_version: GATE_VERSION,
    certification_states: GOVERNANCE_DECISION_CERTIFICATION_STATES,
    certification_categories: GOVERNANCE_DECISION_CERTIFICATION_CATEGORIES,
    result,
    replay,
    observability: buildGovernanceDecisionCertificationObservability(result),
  });
}

export const GovernanceConstitutionalDecisionCertificationGate = Object.freeze({
  tests: createGovernanceDecisionCertificationTests,
  certify: certifyGovernanceConstitutionalDecision,
  replay: replayGovernanceDecisionCertification,
});
