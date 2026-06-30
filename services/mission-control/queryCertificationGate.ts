import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  TruthQueryCertificationGate,
  TruthQueryCertificationGateInput,
  TruthQueryCertificationReport,
  TruthQueryCertificationScope,
  TruthQueryCertificationState,
  TruthQueryCertificationTestOutcome,
  TruthQueryCertificationTestResult,
  TruthQueryCertificationTestResultState,
} from "./types";

export const QUERY_CERTIFICATION_SCOPE: readonly TruthQueryCertificationScope[] = Object.freeze([
  "QUERY_CONTRACT",
  "SEARCH_ENGINE",
  "HISTORICAL_RECONSTRUCTION",
  "CROSS_LEDGER_CORRELATION",
  "AUTHORITY_ENFORCEMENT",
  "GOVERNANCE_ENFORCEMENT",
  "INTEGRITY_ENFORCEMENT",
  "REPLAY_COMPATIBILITY",
  "REDACTION_SAFETY",
  "AUDITABILITY",
  "DETERMINISM",
  "FAIL_CLOSED_BEHAVIOR",
]);

const BLOCKING_FAILURE_PATTERNS: readonly RegExp[] = Object.freeze([
  /bypass(?:es|ed)? query contract/i,
  /query contract bypass/i,
  /cross-tenant|tenant leak|tenant leakage/i,
  /unauthorized query succeeds|unauthorized .* succeeds|authority bypass/i,
  /governance bypass/i,
  /restricted .* raw|raw restricted|protected field leak|restricted data leaks raw/i,
  /corrupted .* trusted|trusted corrupted/i,
  /future evidence|future .* past knowledge/i,
  /candidate .* verified|candidate .* truth/i,
  /mutat(?:e|es|ed|ion)/i,
  /nondeterministic|non-deterministic|unordered result/i,
  /audit .* missing|required audit record missing/i,
  /replay .* missing|required replay metadata missing/i,
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))]);
}

function freezeTests(tests: readonly TruthQueryCertificationTestResult[] = []): readonly TruthQueryCertificationTestResult[] {
  return Object.freeze(tests.map((test) => Object.freeze({
    ...test,
    evidence_refs: Object.freeze([...test.evidence_refs]),
    replay_refs: Object.freeze([...test.replay_refs]),
    integrity_refs: Object.freeze([...test.integrity_refs]),
    governance_refs: Object.freeze([...test.governance_refs]),
  })));
}

function allTests(gate: Omit<TruthQueryCertificationGate, "certification_hash">): readonly TruthQueryCertificationTestResult[] {
  return Object.freeze([
    ...gate.query_contract_tests,
    ...gate.search_tests,
    ...gate.historical_reconstruction_tests,
    ...gate.cross_ledger_correlation_tests,
    ...gate.authority_tests,
    ...gate.governance_tests,
    ...gate.integrity_tests,
    ...gate.replay_tests,
    ...gate.redaction_tests,
    ...gate.audit_tests,
    ...gate.determinism_tests,
    ...gate.fail_closed_tests,
  ]);
}

function failureMessage(test: TruthQueryCertificationTestResult): string {
  return test.failure_reason ?? `${test.category}: ${test.test_name}`;
}

function isBlockingFailure(test: TruthQueryCertificationTestResult): boolean {
  if (test.result_state === "BLOCKING") return true;
  const message = `${test.test_name} ${test.failure_reason ?? ""}`;
  return BLOCKING_FAILURE_PATTERNS.some((pattern) => pattern.test(message));
}

function finalState(tests: readonly TruthQueryCertificationTestResult[]): TruthQueryCertificationState {
  if (tests.some((test) => test.actual !== test.expected || test.result_state === "FAILED" || isBlockingFailure(test))) {
    return "FAIL";
  }
  if (tests.some((test) => test.result_state === "CONDITIONAL")) return "CONDITIONAL_PASS";
  return "PASS";
}

export function createQueryCertificationTestResult(input: Readonly<{
  test_id: string;
  test_name: string;
  category: TruthQueryCertificationScope;
  expected: TruthQueryCertificationTestOutcome;
  actual: TruthQueryCertificationTestOutcome;
  result_state?: TruthQueryCertificationTestResultState;
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  integrity_refs?: readonly string[];
  governance_refs?: readonly string[];
  failure_reason?: string;
  remediation_hint?: string;
  executed_at: string;
}>): TruthQueryCertificationTestResult {
  const resultState = input.result_state
    ?? (input.actual === input.expected ? "PASSED" : "FAILED");
  return Object.freeze({
    test_id: input.test_id,
    test_name: input.test_name,
    category: input.category,
    expected: input.expected,
    actual: input.actual,
    result_state: resultState,
    evidence_refs: Object.freeze([...(input.evidence_refs ?? [])]),
    replay_refs: Object.freeze([...(input.replay_refs ?? [])]),
    integrity_refs: Object.freeze([...(input.integrity_refs ?? [])]),
    governance_refs: Object.freeze([...(input.governance_refs ?? [])]),
    failure_reason: input.failure_reason,
    remediation_hint: input.remediation_hint,
    executed_at: input.executed_at,
  });
}

export function certifyTruthLedgerQueryLayer(input: TruthQueryCertificationGateInput): TruthQueryCertificationGate {
  const scope = Object.freeze([...(input.certification_scope ?? QUERY_CERTIFICATION_SCOPE)]);
  const gateWithoutOutcome = {
    certification_id: input.certification_id,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    certification_scope: scope,
    query_contract_tests: freezeTests(input.query_contract_tests),
    search_tests: freezeTests(input.search_tests),
    historical_reconstruction_tests: freezeTests(input.historical_reconstruction_tests),
    cross_ledger_correlation_tests: freezeTests(input.cross_ledger_correlation_tests),
    authority_tests: freezeTests(input.authority_tests),
    governance_tests: freezeTests(input.governance_tests),
    integrity_tests: freezeTests(input.integrity_tests),
    replay_tests: freezeTests(input.replay_tests),
    redaction_tests: freezeTests(input.redaction_tests),
    audit_tests: freezeTests(input.audit_tests),
    determinism_tests: freezeTests(input.determinism_tests),
    fail_closed_tests: freezeTests(input.fail_closed_tests),
    query_hash: input.query_hash,
    replay_ref: input.replay_ref,
    certified_at: input.certified_at,
  };
  const tests = allTests({
    ...gateWithoutOutcome,
    final_state: "PASS",
    blocking_failures: Object.freeze([]),
    conditional_findings: Object.freeze([]),
  });
  const state = finalState(tests);
  const blockingFailures = unique(tests
    .filter((test) => test.actual !== test.expected || test.result_state === "FAILED" || isBlockingFailure(test))
    .map(failureMessage));
  const conditionalFindings = unique(tests
    .filter((test) => test.result_state === "CONDITIONAL")
    .map((test) => test.failure_reason ?? `${test.category}: ${test.test_name}`));

  const gateForHash = {
    ...gateWithoutOutcome,
    final_state: state,
    blocking_failures: blockingFailures,
    conditional_findings: conditionalFindings,
  };

  return Object.freeze({
    ...gateForHash,
    certification_hash: hashValue("mission-control-query-certification-gate-hash", gateForHash),
  });
}

export function toTruthQueryCertificationReport(gate: TruthQueryCertificationGate): TruthQueryCertificationReport {
  const tests = allTests(gate);
  return Object.freeze({
    certification_id: gate.certification_id,
    certification_state: gate.final_state,
    passed_tests: tests.filter((test) => test.actual === test.expected && test.result_state === "PASSED").length,
    failed_tests: tests.filter((test) => test.actual !== test.expected || test.result_state === "FAILED" || test.result_state === "BLOCKING").length,
    blocking_failures: gate.blocking_failures,
    conditional_findings: gate.conditional_findings,
    certified_components: gate.final_state === "FAIL" ? Object.freeze([]) : gate.certification_scope,
    evidence_refs: unique(tests.flatMap((test) => [...test.evidence_refs])),
    replay_refs: unique([...tests.flatMap((test) => [...test.replay_refs]), gate.replay_ref ?? ""]),
    integrity_refs: unique(tests.flatMap((test) => [...test.integrity_refs])),
    governance_refs: unique(tests.flatMap((test) => [...test.governance_refs])),
    certification_hash: gate.certification_hash,
    replay_ref: gate.replay_ref,
    generated_at: gate.certified_at,
  });
}
