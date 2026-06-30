import { describe, expect, it } from "vitest";
import {
  buildTruthLedgerCertificationContract,
  buildTruthLedgerCertificationFixtures,
  buildTruthLedgerCertificationView,
  certifyEvidence,
  certifyFailClosed,
  certifyIntegrity,
  certifyIsolation,
  certifyLineage,
  certifyPersistence,
  certifyReplay,
  certifyVisibility,
  runTruthLedgerCertification,
} from "@/services/truth-ledger-certification";

function contract() {
  return buildTruthLedgerCertificationContract({
    certification_id: "truth_ledger_cert_6l_test",
    tenant_scope: "tenant_alpha",
    mission_scope: "mission_query_layer",
  });
}

describe("Mission Control Phase 6L Truth Ledger Certification Suite", () => {
  it("creates the 6L certification contract", () => {
    const result = contract();
    expect(result.suite_name).toBe("Truth Ledger Certification Suite");
    expect(result.phase).toBe("6L");
    expect(result.test_categories).toEqual(["PERSISTENCE", "EVIDENCE", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION", "FAIL_CLOSED"]);
  });

  it("builds deterministic fixtures", () => {
    const fixtures = buildTruthLedgerCertificationFixtures();
    expect(fixtures.map((fixture) => fixture.truth_record_id)).toContain("truth_6l_recommendation");
    expect(fixtures[0].integrity.record_hash).toBe(buildTruthLedgerCertificationFixtures()[0].integrity.record_hash);
  });

  it("certifies persistence", () => {
    const result = certifyPersistence(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests).toHaveLength(8);
    expect(result.tests.every((test) => test.state === "PASS")).toBe(true);
  });

  it("certifies evidence reconstruction", () => {
    const result = certifyEvidence(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("evidence reconstructs recommendation");
  });

  it("certifies lineage reconstruction", () => {
    const result = certifyLineage(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("circular lineage rejected");
  });

  it("certifies replay determinism", () => {
    const result = certifyReplay(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("replay result is deterministic across repeated runs");
  });

  it("certifies tamper-aware integrity", () => {
    const result = certifyIntegrity(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("tampering detected");
    expect(result.tests.map((test) => test.name)).toContain("corrupted truth blocks certification");
  });

  it("certifies operator visibility", () => {
    const result = certifyVisibility(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("operators can inspect truth chain");
  });

  it("certifies tenant isolation", () => {
    const result = certifyIsolation(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("cross-tenant replay blocked");
  });

  it("certifies fail-closed behavior", () => {
    const result = certifyFailClosed(contract());
    expect(result.state).toBe("PASS");
    expect(result.tests.map((test) => test.name)).toContain("missing truth blocks replay");
    expect(result.tests.map((test) => test.name)).toContain("corrupted truth blocks replay");
  });

  it("runs the full Truth Ledger certification suite", () => {
    const result = runTruthLedgerCertification(contract());
    expect(result.certification_state).toBe("PASS");
    expect(result.total_tests).toBe(65);
    expect(result.failed_tests).toBe(0);
    expect(result.blocking_failures).toEqual([]);
  });

  it("produces category results for every scope area", () => {
    const result = runTruthLedgerCertification(contract());
    expect(result.persistence.state).toBe("PASS");
    expect(result.evidence.state).toBe("PASS");
    expect(result.lineage.state).toBe("PASS");
    expect(result.replay.state).toBe("PASS");
    expect(result.integrity.state).toBe("PASS");
    expect(result.visibility.state).toBe("PASS");
    expect(result.isolation.state).toBe("PASS");
    expect(result.fail_closed.state).toBe("PASS");
  });

  it("produces replay and integrity hashes", () => {
    const result = runTruthLedgerCertification(contract());
    expect(result.replay_hashes.length).toBeGreaterThan(0);
    expect(result.integrity_hashes.length).toBeGreaterThan(0);
  });

  it("produces a formal certification report", () => {
    const result = runTruthLedgerCertification(contract());
    expect(result.report.certification_state).toBe("PASS");
    expect(result.report.category_results).toHaveLength(8);
    expect(result.report.failure_summary).toEqual([]);
  });

  it("produces required certification artifacts", () => {
    const result = runTruthLedgerCertification(contract());
    expect(result.artifacts.map((artifact) => artifact.artifact_type)).toEqual(expect.arrayContaining([
      "CERTIFICATION_CONTRACT",
      "FIXTURE_LIBRARY",
      "PERSISTENCE_TEST_REPORT",
      "FINAL_CERTIFICATION_REPORT",
    ]));
  });

  it("is deterministic across repeated runs", () => {
    const first = runTruthLedgerCertification(contract());
    const second = runTruthLedgerCertification(contract());
    expect(first.deterministic_result_hash).toBe(second.deterministic_result_hash);
    expect(first.report.total_tests).toBe(second.report.total_tests);
  });

  it("builds the operator certification view", () => {
    const view = buildTruthLedgerCertificationView({ certification_id: "truth_ledger_cert_6l_test" });
    expect(view.result.certification_state).toBe("PASS");
    expect(view.guardrails).toContain("fail-closed certification");
  });
});
