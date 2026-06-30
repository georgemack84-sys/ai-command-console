import { describe, expect, it, vi } from "vitest";
import {
  buildRecoveryCertificationObservabilitySurface,
  computeRecoveryCertificationHash,
  getRecoveryIntelligenceCertificationGateContract,
  runRecoveryIntelligenceCertification,
  validateRecoveryIntelligenceCertification,
} from "@/services/recovery-intelligence-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.7 Recovery Intelligence Certification Gate", () => {
  it("defines the fail-closed certification gate doctrine", () => {
    const contract = getRecoveryIntelligenceCertificationGateContract();

    expect(contract.doctrine.gate_version).toBe("recovery-intelligence-certification-gate/v8ALT.2.7");
    expect(contract.doctrine.principles).toContain("replay-first-verification");
    expect(contract.doctrine.principles).toContain("advisory-only-recovery-intelligence");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.production_requires_pass).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the complete recovery intelligence stack with PASS", () => {
    const certification = runRecoveryIntelligenceCertification();
    const validation = validateRecoveryIntelligenceCertification(certification);

    expect(certification.certification_state).toBe("PASS");
    expect(certification.failed_tests).toBe(0);
    expect(certification.passed_tests).toBe(certification.executed_tests.length);
    expect(certification.production_deployment_approved).toBe(true);
    expect(certification.controlled_autonomy_integration_approved).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("executes positive deterministic, replay, governance, authority, tenant, and operator approval tests", () => {
    const certification = runRecoveryIntelligenceCertification();
    const names = certification.executed_tests.map((test) => test.name);

    expect(names).toContain("recovery contract valid");
    expect(names).toContain("execution failures detected deterministically");
    expect(names).toContain("recovery recommendations reproducible");
    expect(names).toContain("replay reproduces recovery analysis");
    expect(names).toContain("governance validation enforced");
    expect(names).toContain("constitutional compliance verified");
    expect(names).toContain("authority validation enforced");
    expect(names).toContain("tenant isolation enforced");
    expect(names).toContain("operator approval required");
    expect(certification.executed_tests.filter((test) => test.expected_result === "PASS").every((test) => test.passed)).toBe(true);
  });

  it("passes negative security tests only when prohibited behavior is detected and rejected", () => {
    const certification = runRecoveryIntelligenceCertification();
    const negative = certification.executed_tests.filter((test) => test.expected_result === "FAIL");

    expect(negative.length).toBeGreaterThan(0);
    expect(negative.map((test) => test.name)).toContain("autonomous recovery attempted");
    expect(negative.map((test) => test.name)).toContain("autonomous rollback performed");
    expect(negative.map((test) => test.name)).toContain("autonomous restart performed");
    expect(negative.map((test) => test.name)).toContain("policy modification attempted");
    expect(negative.map((test) => test.name)).toContain("authority escalation detected");
    expect(negative.map((test) => test.name)).toContain("replay mismatch");
    expect(negative.every((test) => test.passed && test.actual_result === "FAIL")).toBe(true);
  });

  it("blocks production for conditional pass", () => {
    const certification = runRecoveryIntelligenceCertification({ scenario: "CONDITIONAL_REPORTING_GAP" });
    const validation = validateRecoveryIntelligenceCertification(certification);

    expect(certification.certification_state).toBe("CONDITIONAL_PASS");
    expect(certification.production_deployment_approved).toBe(false);
    expect(certification.controlled_autonomy_integration_approved).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain("CERTIFICATION_NOT_PASS");
  });

  it.each([
    "AUTONOMOUS_RECOVERY",
    "REPLAY_MISMATCH",
    "TENANT_ISOLATION_FAILURE",
    "INTEGRITY_FAILURE",
  ] as const)("fails closed for %s certification scenario", (scenario) => {
    const certification = runRecoveryIntelligenceCertification({ scenario });
    const validation = validateRecoveryIntelligenceCertification(certification);

    expect(certification.certification_state).toBe("FAIL");
    expect(certification.production_deployment_approved).toBe(false);
    expect(certification.controlled_autonomy_integration_approved).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain("CERTIFICATION_NOT_PASS");
  });

  it("produces immutable certification report and ledger evidence", () => {
    const certification = runRecoveryIntelligenceCertification();

    expect(certification.certification_report.report_hash).toBeTruthy();
    expect(certification.ledger_entry.append_only).toBe(true);
    expect(certification.ledger_entry.executed_test_ids.length).toBe(certification.executed_tests.length);
    expect(certification.integrity_hash).toBeTruthy();
    expect(certification.replay_reference).toContain("replay:");
    expect(certification.lineage_reference).toContain("lineage:");
  });

  it("hashes certification records deterministically", () => {
    const first = runRecoveryIntelligenceCertification();
    const second = runRecoveryIntelligenceCertification();

    expect(second.record_hash).toBe(first.record_hash);
    expect(first.record_hash).toBe(computeRecoveryCertificationHash(first));
  });

  it("exposes operator-visible certification diagnostics", () => {
    const surface = buildRecoveryCertificationObservabilitySurface(runRecoveryIntelligenceCertification());

    expect(surface.certification_state).toBe("PASS");
    expect(surface.failed_tests).toBe(0);
    expect(surface.production_deployment_approved).toBe(true);
    expect(surface.controlled_autonomy_integration_approved).toBe(true);
    expect(surface.replay_status).toBe("PASS");
    expect(surface.integrity_status).toBe("PASS");
  });
});
