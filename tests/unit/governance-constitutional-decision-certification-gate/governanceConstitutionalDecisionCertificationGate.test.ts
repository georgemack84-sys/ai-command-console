import { describe, expect, it } from "vitest";
import { writeGovernanceDecisionLedger } from "@/services/governance-decision-ledger";
import {
  GOVERNANCE_DECISION_CERTIFICATION_CATEGORIES,
  GOVERNANCE_DECISION_CERTIFICATION_STATES,
  certifyGovernanceConstitutionalDecision,
  createGovernanceDecisionCertificationTests,
  getGovernanceDecisionCertificationGateFoundation,
  replayGovernanceDecisionCertification,
} from "@/services/governance-constitutional-decision-certification-gate";

describe("Mission Control Phase 9.7.10 Governance & Constitutional Decision Certification Gate", () => {
  it("publishes the governance constitutional decision certification foundation", () => {
    const foundation = getGovernanceDecisionCertificationGateFoundation();

    expect(foundation.gate_version).toBe("governance-constitutional-decision-certification-gate/v1");
    expect(foundation.certification_states).toEqual(GOVERNANCE_DECISION_CERTIFICATION_STATES);
    expect(foundation.certification_categories).toEqual(GOVERNANCE_DECISION_CERTIFICATION_CATEGORIES);
    expect(foundation.result.gate_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("executes the complete certification test suite deterministically", () => {
    const first = certifyGovernanceConstitutionalDecision();
    const second = certifyGovernanceConstitutionalDecision();

    expect(first).toEqual(second);
    expect(first.certification_tests).toHaveLength(30);
    expect(first.final_report.passed_tests).toHaveLength(30);
    expect(first.final_report.failed_tests).toEqual([]);
    expect(first.evidence_package.production_readiness).toBe("READY");
  });

  it("certifies governance, constitutional, authority, tenant, replay, integrity, enforcement, and ledger categories", () => {
    const result = certifyGovernanceConstitutionalDecision();

    for (const category of GOVERNANCE_DECISION_CERTIFICATION_CATEGORIES) {
      expect(result.certification_tests.some((test) => test.category === category)).toBe(true);
    }
    expect(result.validation.checks.governance_certified).toBe(true);
    expect(result.validation.checks.constitutional_certified).toBe(true);
    expect(result.validation.checks.authority_certified).toBe(true);
    expect(result.validation.checks.tenant_certified).toBe(true);
    expect(result.validation.checks.production_ready).toBe(true);
  });

  it("fails closed when ledger certification is invalid or access is unauthorized", () => {
    const valid = certifyGovernanceConstitutionalDecision();
    const badLedger = { ...valid.ledger_result, ledger_status: "FAIL" as const };

    expect(certifyGovernanceConstitutionalDecision({ ledger_result: badLedger }).failures).toContain("LEDGER_CERTIFICATION_INVALID");
    expect(certifyGovernanceConstitutionalDecision({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_CERTIFICATION_GATE_ACCESS");
  });

  it("maps failed certification tests to mandatory failure conditions", () => {
    const ledger = writeGovernanceDecisionLedger();
    const tests = createGovernanceDecisionCertificationTests(ledger);
    const failed = tests.map((test) => test.test_name === "Constitutional compliance verified" ? { ...test, actual: "FAIL" as const } : test);
    const result = certifyGovernanceConstitutionalDecision({ ledger_result: ledger, certification_tests: failed });

    expect(result.gate_status).toBe("FAIL");
    expect(result.fail_closed).toBe(true);
    expect(result.failures).toContain("CONSTITUTIONAL_RULE_VIOLATION");
    expect(result.final_report.failed_tests).toContain("Constitutional compliance verified");
    expect(result.evidence_package.production_readiness).toBe("NOT_READY");
  });

  it("detects integrity tampering and certification replay mismatch", () => {
    const valid = certifyGovernanceConstitutionalDecision();
    const tamperedTests = valid.certification_tests.map((test, index) => index === 0 ? { ...test, rationale: "tampered" } : test);

    expect(certifyGovernanceConstitutionalDecision({ certification_tests: tamperedTests }).failures).toContain("INTEGRITY_HASH_MISMATCH_IGNORED");
    expect(certifyGovernanceConstitutionalDecision({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("CERTIFICATION_REPLAY_FAILED");
  });

  it("replays final certification packages and reports deterministically", () => {
    const result = certifyGovernanceConstitutionalDecision();
    const replay = replayGovernanceDecisionCertification(result);
    const tampered = replayGovernanceDecisionCertification({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.certification_state).toBe("PASS");
    expect(replay.passed_tests).toEqual(result.final_report.passed_tests);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("CERTIFICATION_REPLAY_FAILED");
  });
});
