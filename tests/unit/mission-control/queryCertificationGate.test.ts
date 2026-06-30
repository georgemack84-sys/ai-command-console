import { describe, expect, it } from "vitest";
import {
  certifyTruthLedgerQueryLayer,
  createQueryCertificationTestResult,
  QUERY_CERTIFICATION_SCOPE,
  toTruthQueryCertificationReport,
} from "@/services/mission-control";
import type {
  TruthQueryCertificationGateInput,
  TruthQueryCertificationScope,
  TruthQueryCertificationTestResult,
} from "@/services/mission-control";

const NOW = "2026-06-24T14:00:00.000Z";

function pass(category: TruthQueryCertificationScope, test_id = category): TruthQueryCertificationTestResult {
  return createQueryCertificationTestResult({
    test_id,
    test_name: `${category} certified`,
    category,
    expected: "PASS",
    actual: "PASS",
    evidence_refs: [`evidence_${test_id}`],
    replay_refs: [`replay_${test_id}`],
    integrity_refs: [`integrity_${test_id}`],
    governance_refs: [`governance_${test_id}`],
    executed_at: NOW,
  });
}

function fail(
  category: TruthQueryCertificationScope,
  failure_reason: string,
  result_state: "FAILED" | "BLOCKING" | "CONDITIONAL" = "BLOCKING",
): TruthQueryCertificationTestResult {
  return createQueryCertificationTestResult({
    test_id: `fail_${category.toLowerCase()}`,
    test_name: failure_reason,
    category,
    expected: "PASS",
    actual: result_state === "CONDITIONAL" ? "PASS" : "FAIL",
    result_state,
    evidence_refs: [`evidence_fail_${category}`],
    replay_refs: [`replay_fail_${category}`],
    integrity_refs: [`integrity_fail_${category}`],
    governance_refs: [`governance_fail_${category}`],
    failure_reason,
    remediation_hint: "Repair the protected query path and rerun certification.",
    executed_at: NOW,
  });
}

function baseInput(overrides: Partial<TruthQueryCertificationGateInput> = {}): TruthQueryCertificationGateInput {
  return {
    certification_id: "cert_6j5_000001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_query_layer",
    certification_scope: QUERY_CERTIFICATION_SCOPE,
    query_contract_tests: [pass("QUERY_CONTRACT", "query_contract")],
    search_tests: [pass("SEARCH_ENGINE", "search")],
    historical_reconstruction_tests: [pass("HISTORICAL_RECONSTRUCTION", "history")],
    cross_ledger_correlation_tests: [pass("CROSS_LEDGER_CORRELATION", "correlation")],
    authority_tests: [pass("AUTHORITY_ENFORCEMENT", "authority")],
    governance_tests: [pass("GOVERNANCE_ENFORCEMENT", "governance")],
    integrity_tests: [pass("INTEGRITY_ENFORCEMENT", "integrity")],
    replay_tests: [pass("REPLAY_COMPATIBILITY", "replay")],
    redaction_tests: [pass("REDACTION_SAFETY", "redaction")],
    audit_tests: [pass("AUDITABILITY", "audit")],
    determinism_tests: [pass("DETERMINISM", "determinism")],
    fail_closed_tests: [pass("FAIL_CLOSED_BEHAVIOR", "fail_closed")],
    query_hash: "query_hash_6j5",
    replay_ref: "replay_cert_6j5_000001",
    certified_at: NOW,
    ...overrides,
  };
}

describe("Mission Control Phase 6J.5 Query Certification Gate", () => {
  it("certifies a fully passing query layer", () => {
    const gate = certifyTruthLedgerQueryLayer(baseInput());
    expect(gate.final_state).toBe("PASS");
    expect(gate.blocking_failures).toEqual([]);
    expect(gate.certification_scope).toEqual(QUERY_CERTIFICATION_SCOPE);
  });

  it("preserves query contract certification tests", () => {
    const gate = certifyTruthLedgerQueryLayer(baseInput());
    expect(gate.query_contract_tests[0].category).toBe("QUERY_CONTRACT");
    expect(gate.query_contract_tests[0].result_state).toBe("PASSED");
  });

  it("preserves search certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).search_tests[0].category).toBe("SEARCH_ENGINE");
  });

  it("preserves historical reconstruction certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).historical_reconstruction_tests[0].category).toBe("HISTORICAL_RECONSTRUCTION");
  });

  it("preserves cross-ledger correlation certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).cross_ledger_correlation_tests[0].category).toBe("CROSS_LEDGER_CORRELATION");
  });

  it("preserves authority certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).authority_tests[0].category).toBe("AUTHORITY_ENFORCEMENT");
  });

  it("preserves governance certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).governance_tests[0].category).toBe("GOVERNANCE_ENFORCEMENT");
  });

  it("preserves integrity certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).integrity_tests[0].category).toBe("INTEGRITY_ENFORCEMENT");
  });

  it("preserves replay certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).replay_tests[0].category).toBe("REPLAY_COMPATIBILITY");
  });

  it("preserves redaction certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).redaction_tests[0].category).toBe("REDACTION_SAFETY");
  });

  it("preserves audit certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).audit_tests[0].category).toBe("AUDITABILITY");
  });

  it("preserves determinism certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).determinism_tests[0].category).toBe("DETERMINISM");
  });

  it("preserves fail-closed certification tests", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).fail_closed_tests[0].category).toBe("FAIL_CLOSED_BEHAVIOR");
  });

  it("blocking test forces FAIL", () => {
    const gate = certifyTruthLedgerQueryLayer(baseInput({
      authority_tests: [fail("AUTHORITY_ENFORCEMENT", "unauthorized query succeeds")],
    }));
    expect(gate.final_state).toBe("FAIL");
    expect(gate.blocking_failures).toContain("unauthorized query succeeds");
  });

  it("non-critical warning yields CONDITIONAL_PASS", () => {
    const warning = fail("SEARCH_ENGINE", "optional index acceleration unavailable but source ledger fallback works", "CONDITIONAL");
    const gate = certifyTruthLedgerQueryLayer(baseInput({ search_tests: [warning] }));
    expect(gate.final_state).toBe("CONDITIONAL_PASS");
    expect(gate.conditional_findings).toContain(warning.failure_reason);
  });

  it("actual mismatch fails even when result state is mislabeled as passed", () => {
    const mismatch = createQueryCertificationTestResult({
      test_id: "mismatch",
      test_name: "expected search protection did not hold",
      category: "SEARCH_ENGINE",
      expected: "PASS",
      actual: "FAIL",
      result_state: "PASSED",
      executed_at: NOW,
    });
    expect(certifyTruthLedgerQueryLayer(baseInput({ search_tests: [mismatch] })).final_state).toBe("FAIL");
  });

  it.each([
    ["query bypasses Query Contract", "QUERY_CONTRACT"],
    ["cross-tenant data leak", "AUTHORITY_ENFORCEMENT"],
    ["unauthorized query succeeds", "AUTHORITY_ENFORCEMENT"],
    ["governance bypass succeeds", "GOVERNANCE_ENFORCEMENT"],
    ["restricted data leaks raw", "REDACTION_SAFETY"],
    ["corrupted record returned as trusted", "INTEGRITY_ENFORCEMENT"],
    ["historical query uses future evidence as past knowledge", "HISTORICAL_RECONSTRUCTION"],
    ["candidate correlation certified as verified truth", "CROSS_LEDGER_CORRELATION"],
    ["query mutates ledger state", "FAIL_CLOSED_BEHAVIOR"],
    ["query result is nondeterministic", "DETERMINISM"],
    ["required audit record missing", "AUDITABILITY"],
    ["required replay metadata missing", "REPLAY_COMPATIBILITY"],
  ] as const)("fails closed for blocker: %s", (reason, category) => {
    const test = fail(category, reason, "CONDITIONAL");
    const overrides: Partial<TruthQueryCertificationGateInput> = {};
    if (category === "QUERY_CONTRACT") overrides.query_contract_tests = [test];
    if (category === "AUTHORITY_ENFORCEMENT") overrides.authority_tests = [test];
    if (category === "GOVERNANCE_ENFORCEMENT") overrides.governance_tests = [test];
    if (category === "REDACTION_SAFETY") overrides.redaction_tests = [test];
    if (category === "INTEGRITY_ENFORCEMENT") overrides.integrity_tests = [test];
    if (category === "HISTORICAL_RECONSTRUCTION") overrides.historical_reconstruction_tests = [test];
    if (category === "CROSS_LEDGER_CORRELATION") overrides.cross_ledger_correlation_tests = [test];
    if (category === "FAIL_CLOSED_BEHAVIOR") overrides.fail_closed_tests = [test];
    if (category === "DETERMINISM") overrides.determinism_tests = [test];
    if (category === "AUDITABILITY") overrides.audit_tests = [test];
    if (category === "REPLAY_COMPATIBILITY") overrides.replay_tests = [test];
    const gate = certifyTruthLedgerQueryLayer(baseInput(overrides));
    expect(gate.final_state).toBe("FAIL");
    expect(gate.blocking_failures).toContain(reason);
  });

  it("generates a certification report with test counts", () => {
    const report = toTruthQueryCertificationReport(certifyTruthLedgerQueryLayer(baseInput()));
    expect(report.certification_state).toBe("PASS");
    expect(report.passed_tests).toBe(12);
    expect(report.failed_tests).toBe(0);
  });

  it("report collects evidence refs", () => {
    const report = toTruthQueryCertificationReport(certifyTruthLedgerQueryLayer(baseInput()));
    expect(report.evidence_refs).toContain("evidence_query_contract");
    expect(report.evidence_refs).toContain("evidence_correlation");
  });

  it("report collects replay refs including certification replay ref", () => {
    const report = toTruthQueryCertificationReport(certifyTruthLedgerQueryLayer(baseInput()));
    expect(report.replay_refs).toContain("replay_cert_6j5_000001");
    expect(report.replay_refs).toContain("replay_search");
  });

  it("report collects integrity refs", () => {
    const report = toTruthQueryCertificationReport(certifyTruthLedgerQueryLayer(baseInput()));
    expect(report.integrity_refs).toContain("integrity_integrity");
  });

  it("report collects governance refs", () => {
    const report = toTruthQueryCertificationReport(certifyTruthLedgerQueryLayer(baseInput()));
    expect(report.governance_refs).toContain("governance_governance");
  });

  it("failed certification reports no certified components", () => {
    const gate = certifyTruthLedgerQueryLayer(baseInput({
      fail_closed_tests: [fail("FAIL_CLOSED_BEHAVIOR", "query mutates ledger state")],
    }));
    expect(toTruthQueryCertificationReport(gate).certified_components).toEqual([]);
  });

  it("certification hash is reproducible", () => {
    expect(certifyTruthLedgerQueryLayer(baseInput()).certification_hash).toBe(
      certifyTruthLedgerQueryLayer(baseInput()).certification_hash,
    );
  });

  it("certification hash changes when evidence changes", () => {
    const changed = pass("SEARCH_ENGINE", "search_changed");
    expect(certifyTruthLedgerQueryLayer(baseInput()).certification_hash).not.toBe(
      certifyTruthLedgerQueryLayer(baseInput({ search_tests: [changed] })).certification_hash,
    );
  });

  it("freezes generated gate arrays", () => {
    expect(Object.isFrozen(certifyTruthLedgerQueryLayer(baseInput()).search_tests)).toBe(true);
  });

  it("creates default result state from expected and actual outcomes", () => {
    expect(createQueryCertificationTestResult({
      test_id: "auto",
      test_name: "auto state",
      category: "QUERY_CONTRACT",
      expected: "PASS",
      actual: "FAIL",
      executed_at: NOW,
    }).result_state).toBe("FAILED");
  });
});
