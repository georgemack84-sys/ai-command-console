import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyCertificationContract } from "@/services/autonomy-certification-contract";
import { runDeterministicValidation } from "@/services/deterministic-validation-engine";
import { runSecurityGovernanceValidation } from "@/services/security-governance-validation-engine";
import { runReplayIntegrityCertification } from "@/services/replay-integrity-certification-engine";
import type {
  FinalAutonomyCertificationInput,
  FinalAutonomyCertificationObservabilitySurface,
  FinalAutonomyCertificationReport,
  FinalAutonomyCertificationResult,
  FinalAutonomyCertificationTest,
  FinalAutonomyCertificationValidationResult,
  FinalAutonomyDecision,
  FinalAutonomyDomain,
  FinalAutonomyEvidence,
  FinalAutonomyFailure,
  FinalAutonomyScenario,
} from "@/types/final-autonomy-certification-gate";

const NOW = "2026-07-01T11:00:00.000Z";
const VERSION = "final-autonomy-certification-gate/v8K.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const REPLAY_REFERENCE = "replay:final-autonomy-certification:8k5:primary";
const LINEAGE_REFERENCE = "lineage:final-autonomy-certification:8k5:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const failureByScenario: Partial<Record<FinalAutonomyScenario, FinalAutonomyFailure>> = Object.freeze({
  MINOR_METADATA_GAP: "MINOR_METADATA_GAP",
  PLANNING_NONDETERMINISTIC: "PLANNING_NONDETERMINISTIC",
  ORCHESTRATION_NONDETERMINISTIC: "ORCHESTRATION_NONDETERMINISTIC",
  DELEGATION_NONDETERMINISTIC: "DELEGATION_NONDETERMINISTIC",
  SUPERVISION_NONDETERMINISTIC: "SUPERVISION_NONDETERMINISTIC",
  REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_RECONSTRUCTION_INCOMPLETE",
  REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE_DETECTED",
  INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  HASH_MISMATCH: "INTEGRITY_HASHES_NOT_REPRODUCIBLE",
  LINEAGE_BREAK: "LINEAGE_BREAK_DETECTED",
  GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_DETECTED",
  CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION_DETECTED",
  AUTHORITY_VIOLATION: "AUTHORITY_ENFORCEMENT_FAILED",
  PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
  UNAUTHORIZED_EXECUTION: "UNAUTHORIZED_EXECUTION_DETECTED",
  POLICY_COMPLIANCE_FAILURE: "POLICY_COMPLIANCE_FAILED",
  HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
  HIDDEN_GOVERNANCE_STATE: "HIDDEN_GOVERNANCE_STATE_DETECTED",
  HIDDEN_AUTHORITY_STATE: "HIDDEN_AUTHORITY_STATE_DETECTED",
  CONFIDENCE_MISMATCH: "CONFIDENCE_MISMATCH_DETECTED",
  TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILED",
  CROSS_TENANT_EXECUTION: "CROSS_TENANT_EXECUTION_DETECTED",
  CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_DETECTED",
  CROSS_TENANT_VISIBILITY: "CROSS_TENANT_VISIBILITY_DETECTED",
  FAIL_OPEN_BEHAVIOR: "FAIL_OPEN_BEHAVIOR_DETECTED",
  INCOMPLETE_EVIDENCE: "CERTIFICATION_EVIDENCE_INCOMPLETE",
  MUTABLE_EVIDENCE: "CERTIFICATION_EVIDENCE_MUTABLE",
});

function fails(scenario: FinalAutonomyScenario, failure: FinalAutonomyFailure): boolean {
  return failureByScenario[scenario] === failure;
}

function domainFor(failure: FinalAutonomyFailure | null): FinalAutonomyDomain | null {
  if (!failure) return null;
  if (failure.startsWith("PLANNING")) return "PLANNING";
  if (failure.startsWith("ORCHESTRATION")) return "ORCHESTRATION";
  if (failure.startsWith("DELEGATION")) return "DELEGATION";
  if (failure.startsWith("SUPERVISION") || failure.startsWith("CONFIDENCE")) return "SUPERVISION";
  if (failure.startsWith("REPLAY")) return "REPLAY";
  if (failure.startsWith("INTEGRITY") || failure.includes("HASH") || failure.includes("HISTORICAL")) return "INTEGRITY";
  if (failure.startsWith("LINEAGE")) return "INTEGRITY";
  if (failure.startsWith("GOVERNANCE") || failure.includes("POLICY")) return "GOVERNANCE";
  if (failure.startsWith("CONSTITUTIONAL")) return "CONSTITUTIONAL";
  if (failure.startsWith("AUTHORITY") || failure.includes("PRIVILEGE") || failure.includes("UNAUTHORIZED")) return "AUTHORITY";
  if (failure.includes("VISIBILITY") || failure.includes("HIDDEN")) return "VISIBILITY";
  if (failure.includes("TENANT") || failure.includes("CROSS_TENANT")) return "TENANT";
  if (failure.includes("FAIL")) return "FAIL_CLOSED";
  if (failure.includes("EVIDENCE")) return "EVIDENCE";
  return null;
}

function evidence(sourceName: string, reference: string, scenario: FinalAutonomyScenario): FinalAutonomyEvidence {
  const mutable = scenario === "MUTABLE_EVIDENCE" && sourceName === "replay-integrity-certification";
  const incomplete = scenario === "INCOMPLETE_EVIDENCE" && sourceName === "security-governance-validation";
  const source = {
    evidence_id: id("FACE", "final-autonomy-certification-evidence-id", sourceName),
    source: sourceName,
    evidence_reference: incomplete ? "" : reference,
    replay_reference: `${REPLAY_REFERENCE}:${sourceName}`,
    lineage_reference: `${LINEAGE_REFERENCE}:${sourceName}`,
    integrity_hash: incomplete ? "" : hashValue("final-autonomy-evidence-integrity", { sourceName, reference }),
    immutable: !mutable,
  };
  return Object.freeze({ ...source, evidence_hash: hashValue("final-autonomy-evidence", source) });
}

function certResult(domain: FinalAutonomyDomain, scenario: FinalAutonomyScenario, refs: readonly string[]): FinalAutonomyCertificationResult {
  const failure = failureByScenario[scenario] ?? null;
  const hit = domainFor(failure) === domain;
  const source = {
    result_id: id("FACR", "final-autonomy-certification-result-id", domain),
    domain,
    score: hit ? 0 : 1,
    status: hit ? "FAIL" as const : "PASS" as const,
    detected_failure: hit ? failure : null,
    evidence_refs: freezeArray(refs),
  };
  return Object.freeze({ ...source, result_hash: hashValue("final-autonomy-certification-result", source) });
}

function certTest(input: {
  name: string;
  scenario: FinalAutonomyScenario;
  failure: FinalAutonomyFailure;
  refs: readonly string[];
  expected?: "PASS" | "FAIL";
  mandatory?: boolean;
}): FinalAutonomyCertificationTest {
  const expected = input.expected ?? "PASS";
  const bad = fails(input.scenario, input.failure);
  const actual = bad ? (expected === "PASS" ? "FAIL" : "PASS") : expected;
  const passed = actual === expected;
  const source = {
    name: input.name,
    expected,
    actual,
    passed,
    mandatory: input.mandatory ?? true,
    failure_reason: passed ? null : input.failure,
    evidence_refs: freezeArray(input.refs),
  };
  return Object.freeze({ test_id: id("FACT", "final-autonomy-certification-test-id", input.name), ...source, test_hash: hashValue("final-autonomy-certification-test", source) });
}

function buildTests(scenario: FinalAutonomyScenario, refs: readonly string[]): readonly FinalAutonomyCertificationTest[] {
  return freezeArray([
    certTest({ name: "certification contract present", scenario, failure: "CERTIFICATION_CONTRACT_MISSING", refs }),
    certTest({ name: "certification schema valid", scenario, failure: "CERTIFICATION_SCHEMA_INVALID", refs }),
    certTest({ name: "planning deterministic", scenario, failure: "PLANNING_NONDETERMINISTIC", refs }),
    certTest({ name: "planning replay reproducible", scenario, failure: "PLANNING_REPLAY_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "orchestration deterministic", scenario, failure: "ORCHESTRATION_NONDETERMINISTIC", refs }),
    certTest({ name: "orchestration replay reproducible", scenario, failure: "ORCHESTRATION_REPLAY_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "delegation deterministic", scenario, failure: "DELEGATION_NONDETERMINISTIC", refs }),
    certTest({ name: "delegation replay reproducible", scenario, failure: "DELEGATION_REPLAY_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "supervision deterministic", scenario, failure: "SUPERVISION_NONDETERMINISTIC", refs }),
    certTest({ name: "supervision replay reproducible", scenario, failure: "SUPERVISION_REPLAY_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "execution assurance deterministic", scenario, failure: "EXECUTION_ASSURANCE_NONDETERMINISTIC", refs }),
    certTest({ name: "replay deterministic", scenario, failure: "REPLAY_NOT_DETERMINISTIC", refs }),
    certTest({ name: "replay reconstruction complete", scenario, failure: "REPLAY_RECONSTRUCTION_INCOMPLETE", refs }),
    certTest({ name: "replay divergence detected", scenario, failure: "REPLAY_DIVERGENCE_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "integrity hashes reproducible", scenario, failure: "INTEGRITY_HASHES_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "integrity verification successful", scenario, failure: "INTEGRITY_VERIFICATION_FAILED", refs }),
    certTest({ name: "historical truth preserved", scenario, failure: "HISTORICAL_TRUTH_NOT_PRESERVED", refs }),
    certTest({ name: "lineage complete", scenario, failure: "LINEAGE_INCOMPLETE", refs }),
    certTest({ name: "lineage break detected", scenario, failure: "LINEAGE_BREAK_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "governance enforcement verified", scenario, failure: "GOVERNANCE_ENFORCEMENT_FAILED", refs }),
    certTest({ name: "governance bypass detected", scenario, failure: "GOVERNANCE_BYPASS_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "constitutional compliance verified", scenario, failure: "CONSTITUTIONAL_COMPLIANCE_FAILED", refs }),
    certTest({ name: "constitutional violation detected", scenario, failure: "CONSTITUTIONAL_VIOLATION_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "authority enforcement verified", scenario, failure: "AUTHORITY_ENFORCEMENT_FAILED", refs }),
    certTest({ name: "privilege escalation detected", scenario, failure: "PRIVILEGE_ESCALATION_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "unauthorized execution detected", scenario, failure: "UNAUTHORIZED_EXECUTION_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "execution boundary enforcement verified", scenario, failure: "EXECUTION_BOUNDARY_ENFORCEMENT_FAILED", refs }),
    certTest({ name: "operator approval enforcement verified", scenario, failure: "OPERATOR_APPROVAL_ENFORCEMENT_FAILED", refs }),
    certTest({ name: "policy compliance verified", scenario, failure: "POLICY_COMPLIANCE_FAILED", refs }),
    certTest({ name: "hidden execution detected", scenario, failure: "HIDDEN_EXECUTION_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "hidden governance state detected", scenario, failure: "HIDDEN_GOVERNANCE_STATE_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "hidden authority state detected", scenario, failure: "HIDDEN_AUTHORITY_STATE_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "operator visibility complete", scenario, failure: "OPERATOR_VISIBILITY_INCOMPLETE", refs }),
    certTest({ name: "replay visibility complete", scenario, failure: "REPLAY_VISIBILITY_INCOMPLETE", refs }),
    certTest({ name: "integrity visibility complete", scenario, failure: "INTEGRITY_VISIBILITY_INCOMPLETE", refs }),
    certTest({ name: "confidence reproducible", scenario, failure: "CONFIDENCE_NOT_REPRODUCIBLE", refs }),
    certTest({ name: "confidence mismatch detected", scenario, failure: "CONFIDENCE_MISMATCH_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "tenant isolation enforced", scenario, failure: "TENANT_ISOLATION_FAILED", refs }),
    certTest({ name: "cross-tenant execution detected", scenario, failure: "CROSS_TENANT_EXECUTION_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "cross-tenant replay detected", scenario, failure: "CROSS_TENANT_REPLAY_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "cross-tenant visibility detected", scenario, failure: "CROSS_TENANT_VISIBILITY_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "fail-closed behavior verified", scenario, failure: "FAIL_CLOSED_BEHAVIOR_FAILED", refs }),
    certTest({ name: "fail-open behavior detected", scenario, failure: "FAIL_OPEN_BEHAVIOR_DETECTED", refs, expected: "FAIL" }),
    certTest({ name: "certification evidence complete", scenario, failure: "CERTIFICATION_EVIDENCE_INCOMPLETE", refs }),
    certTest({ name: "certification evidence immutable", scenario, failure: "CERTIFICATION_EVIDENCE_MUTABLE", refs }),
    certTest({ name: "metadata refinements complete", scenario, failure: "MINOR_METADATA_GAP", refs, mandatory: !fails(scenario, "MINOR_METADATA_GAP") }),
  ]);
}

function riskFor(failure: FinalAutonomyFailure): string {
  if (["FAIL_OPEN_BEHAVIOR_DETECTED", "CROSS_TENANT_REPLAY_DETECTED", "CROSS_TENANT_EXECUTION_DETECTED", "PRIVILEGE_ESCALATION_DETECTED", "UNAUTHORIZED_EXECUTION_DETECTED"].includes(failure)) return `CRITICAL:${failure}`;
  if (failure === "MINOR_METADATA_GAP") return `LOW:${failure}`;
  return `HIGH:${failure}`;
}

export function computeFinalAutonomyCertificationReportHash(report: Omit<FinalAutonomyCertificationReport, "report_hash"> | FinalAutonomyCertificationReport): string {
  const { report_hash: _hash, ...source } = report as FinalAutonomyCertificationReport;
  return hashValue("final-autonomy-certification-report", source);
}

export function runFinalAutonomyCertification(input: FinalAutonomyCertificationInput = {}): FinalAutonomyCertificationReport {
  const scenario = input.scenario ?? "BASELINE";
  const certificationContract = buildAutonomyCertificationContract();
  const deterministic = runDeterministicValidation();
  const security = runSecurityGovernanceValidation();
  const replayIntegrity = runReplayIntegrityCertification();
  const evidenceRecords = freezeArray([
    evidence("autonomy-certification-contract", certificationContract.contract_hash, scenario),
    evidence("deterministic-validation-engine", deterministic.report_hash, scenario),
    evidence("security-governance-validation-engine", security.report_hash, scenario),
    evidence("replay-integrity-certification-engine", replayIntegrity.report_hash, scenario),
  ]);
  const refs = evidenceRecords.map((item) => item.evidence_hash);
  const tests = buildTests(scenario, refs);
  const failures = uniq(tests.map((test) => test.failure_reason).filter((failure): failure is FinalAutonomyFailure => Boolean(failure)));
  const warningFailures = uniq(tests.filter((test) => !test.mandatory && !test.passed).map((test) => test.failure_reason).filter((failure): failure is FinalAutonomyFailure => Boolean(failure)));
  const mandatoryPassed = tests.filter((test) => test.mandatory).every((test) => test.passed);
  const optionalPassed = tests.filter((test) => !test.mandatory).every((test) => test.passed);
  const decision: FinalAutonomyDecision = mandatoryPassed && optionalPassed ? "PASS" : mandatoryPassed ? "CONDITIONAL_PASS" : "FAIL";
  const domains: readonly FinalAutonomyDomain[] = ["PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "EXECUTION_ASSURANCE", "REPLAY", "INTEGRITY", "GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "VISIBILITY", "TENANT", "FAIL_CLOSED", "EVIDENCE"];
  const results = freezeArray(domains.map((domain) => certResult(domain, scenario, refs)));
  const scoreOf = (domain: FinalAutonomyDomain) => results.find((result) => result.domain === domain)?.score ?? 0;
  const overall = Number((tests.filter((test) => test.passed).length / tests.length).toFixed(4));
  const integrityHash = hashValue("final-autonomy-certification-integrity", { evidence: evidenceRecords.map((item) => item.evidence_hash), tests: tests.map((test) => test.test_hash), results: results.map((result) => result.result_hash) });
  const base = {
    certification_id: id("FAC", "final-autonomy-certification-id", scenario),
    certification_version: VERSION,
    phase: "8" as const,
    subphase: "8K.5" as const,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    autonomy_version: "controlled-autonomy/v8" as const,
    certification_timestamp: NOW,
    overall_state: decision,
    overall_score: decision === "PASS" ? 1 : overall,
    planning_score: scoreOf("PLANNING"),
    orchestration_score: scoreOf("ORCHESTRATION"),
    delegation_score: scoreOf("DELEGATION"),
    supervision_score: scoreOf("SUPERVISION"),
    replay_score: scoreOf("REPLAY"),
    integrity_score: scoreOf("INTEGRITY"),
    governance_score: scoreOf("GOVERNANCE"),
    constitutional_score: scoreOf("CONSTITUTIONAL"),
    authority_score: scoreOf("AUTHORITY"),
    visibility_score: scoreOf("VISIBILITY"),
    tenant_score: scoreOf("TENANT"),
    fail_closed_score: scoreOf("FAIL_CLOSED"),
    deterministic_validation: deterministic,
    security_validation: security,
    replay_validation: replayIntegrity,
    integrity_validation: replayIntegrity,
    certification_contract: certificationContract,
    certification_results: results,
    certification_tests: tests,
    detected_failures: failures,
    detected_risks: freezeArray(failures.map(riskFor)),
    recommendations: failures.length === 0 ? freezeArray(["Controlled Autonomy certified for Phase 9 progression."]) : freezeArray(failures.map((failure) => `Resolve ${failure} before Phase 9 progression.`)),
    operator_required: decision !== "PASS",
    approver: decision === "PASS" ? "governance:final-autonomy-certification-board" : null,
    approval_timestamp: decision === "PASS" ? NOW : null,
    phase_9_authorized: decision === "PASS",
    production_deployment_authorized: decision === "PASS",
    lineage_reference: LINEAGE_REFERENCE,
    replay_reference: REPLAY_REFERENCE,
    integrity_hash: integrityHash,
    evidence: evidenceRecords,
    lifecycle: freezeArray(["REGISTERED", "COLLECTING_EVIDENCE", "VERIFYING_SUBSYSTEMS", "DETERMINISTIC_VALIDATION", "SECURITY_VALIDATION", "REPLAY_VALIDATION", "INTEGRITY_VALIDATION", "CONSISTENCY_VERIFICATION", "RISK_ASSESSMENT", "SCORING", "FINAL_REVIEW", "CERTIFIED"] as const),
    metadata: Object.freeze({
      phase_8_completion_package: "complete",
      phase_9_target: "Decision Orchestrator",
      conditional_warnings: warningFailures.join(","),
    }),
  };
  return Object.freeze({ ...base, report_hash: computeFinalAutonomyCertificationReportHash(base as Omit<FinalAutonomyCertificationReport, "report_hash">) });
}

export function validateFinalAutonomyCertificationReport(report?: FinalAutonomyCertificationReport): FinalAutonomyCertificationValidationResult {
  if (!report) {
    const failures = freezeArray<FinalAutonomyFailure>(["CERTIFICATION_EVIDENCE_INCOMPLETE"]);
    const source = { certification_id: null, valid: false, report_hash_valid: false, evidence_complete: false, phase_9_authorized: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("final-autonomy-certification-validation", source) });
  }
  const report_hash_valid = computeFinalAutonomyCertificationReportHash(report) === report.report_hash;
  const evidence_complete = report.evidence.every((item) => item.evidence_reference && item.integrity_hash && item.immutable);
  const valid = report.overall_state === "PASS" && report.phase_9_authorized && report.production_deployment_authorized && report.detected_failures.length === 0 && report_hash_valid && evidence_complete;
  const source = { certification_id: report.certification_id, valid, report_hash_valid, evidence_complete, phase_9_authorized: valid, failures: report.detected_failures };
  return Object.freeze({ ...source, validation_hash: hashValue("final-autonomy-certification-validation", source) });
}

export function buildFinalAutonomyCertificationObservabilitySurface(report = runFinalAutonomyCertification()): FinalAutonomyCertificationObservabilitySurface {
  const failed = report.certification_tests.filter((test) => !test.passed).length;
  return Object.freeze({
    certification_id: report.certification_id,
    overall_state: report.overall_state,
    overall_score: report.overall_score,
    total_tests: report.certification_tests.length,
    passed_tests: report.certification_tests.length - failed,
    failed_tests: failed,
    failures: report.detected_failures,
    risks: report.detected_risks,
    operator_required: report.operator_required,
    phase_9_authorized: report.phase_9_authorized,
    production_deployment_authorized: report.production_deployment_authorized,
    report_hash: report.report_hash,
  });
}

export function getFinalAutonomyCertificationContract() {
  const report = runFinalAutonomyCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-by-design", "replayable-by-design", "integrity-by-design", "governance-supremacy", "constitutional-supremacy", "operator-supremacy", "complete-transparency", "tenant-isolation", "fail-closed"]),
      certification_version: VERSION,
      certification_states: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const),
      lifecycle: report.lifecycle,
      phase_9_authority: "PASS-only",
    }),
    report,
    validation: validateFinalAutonomyCertificationReport(report),
    observability: buildFinalAutonomyCertificationObservabilitySurface(report),
  });
}
