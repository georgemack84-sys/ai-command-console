import { describe, expect, it, vi } from "vitest";
import {
  buildScenarioStressCertificationObservabilitySurface,
  computeScenarioStressCertificationLedgerHash,
  getScenarioStressCertificationContract,
  replayScenarioStressCertification,
  runScenarioStressCertification,
  validateScenarioStressCertification,
} from "@/services/scenario-stress-certification-gate";
import type { ScenarioStressCertificationFailure, ScenarioStressCertificationScenario } from "@/types/scenario-stress-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.6.5 Scenario Stress Certification Gate", () => {
  it("defines the fail-closed scenario stress certification doctrine", () => {
    const contract = getScenarioStressCertificationContract();

    expect(contract.doctrine.gate_version).toBe("scenario-stress-certification-gate/v8ALT.6.5");
    expect(contract.doctrine.principles).toContain("replay-first-validation");
    expect(contract.doctrine.principles).toContain("pass-required-for-production");
    expect(contract.doctrine.certification_states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.pass_required_for_production).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the full scenario stress stack with a PASS baseline", () => {
    const ledger = runScenarioStressCertification();
    const report = ledger.reports[0];
    const validation = validateScenarioStressCertification(ledger);

    expect(report.certification_state).toBe("PASS");
    expect(report.scenario_count).toBe(8);
    expect(report.failed_scenarios).toBe(0);
    expect(report.tests).toHaveLength(26);
    expect(validation.valid).toBe(true);
  });

  it("preserves evidence package, replay references, lineage references, and integrity", () => {
    const ledger = runScenarioStressCertification();

    expect(ledger.validation_evidence.length).toBeGreaterThanOrEqual(4);
    expect(ledger.replay_references.length).toBeGreaterThanOrEqual(4);
    expect(ledger.lineage_references.length).toBeGreaterThanOrEqual(4);
    expect(ledger.integrity_verification.length).toBeGreaterThan(10);
    expect(ledger.ledger_hash).toBe(computeScenarioStressCertificationLedgerHash(ledger));
  });

  it("validates governance, constitution, authority, tenant isolation, replay, integrity, and visibility", () => {
    const report = runScenarioStressCertification().reports[0];

    expect(report.governance_validation).toBe(true);
    expect(report.constitutional_validation).toBe(true);
    expect(report.authority_validation).toBe(true);
    expect(report.tenant_isolation_validation).toBe(true);
    expect(report.replay_validation).toBe(true);
    expect(report.integrity_validation).toBe(true);
    expect(report.operator_visibility_status).toBe(true);
  });

  it("replays certification deterministically", () => {
    const ledger = runScenarioStressCertification();
    const replay = replayScenarioStressCertification(ledger);

    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.original_hash);
  });

  it("allows conditional pass only for non-critical reporting warnings", () => {
    const ledger = runScenarioStressCertification({ scenario: "DOCUMENTATION_WARNING" });
    const report = ledger.reports[0];
    const validation = validateScenarioStressCertification(ledger);

    expect(report.certification_state).toBe("CONDITIONAL_PASS");
    expect(report.warnings).toHaveLength(1);
    expect(validation.valid).toBe(false);
    expect(validation.failures).not.toContain("NON_CRITICAL_DOCUMENTATION_WARNING");
  });

  it.each([
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["REPLAY_MISMATCH_UNNOTICED", "REPLAY_MISMATCH_UNDETECTED"],
    ["CROSS_TENANT_ACCESS", "CROSS_TENANT_ACCESS_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["HIDDEN_FAILURE_STATE", "HIDDEN_FAILURE_STATE_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["STRESS_SCORE_INCONSISTENCY", "STRESS_SCORE_INCONSISTENT"],
    ["RECOVERY_RECOMMENDATION_MISMATCH", "RECOVERY_RECOMMENDATION_UNREPRODUCIBLE"],
  ] as readonly [ScenarioStressCertificationScenario, ScenarioStressCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = runScenarioStressCertification({ scenario });
    const report = ledger.reports[0];
    const validation = validateScenarioStressCertification(ledger);

    expect(report.certification_state).toBe("FAIL");
    expect(report.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes certification observability", () => {
    const ledger = runScenarioStressCertification();
    const surface = buildScenarioStressCertificationObservabilitySurface(ledger);

    expect(surface.ledger_id).toBe(ledger.ledger_id);
    expect(surface.certification_state).toBe("PASS");
    expect(surface.tests_failed).toBe(0);
    expect(surface.production_ready).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
