import { describe, expect, it, vi } from "vitest";
import {
  buildExplainabilityCertificationObservabilitySurface,
  computeExplainabilityCertificationLedgerHash,
  getExplainabilityCertificationGateContract,
  replayExplainabilityCertification,
  runExplainabilityCertification,
  validateExplanationCertification,
  validateExplanationReplay,
} from "@/services/explainability-certification-gate";
import type { ExplainabilityCertificationFailure, ExplainabilityCertificationScenario } from "@/types/explainability-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.5.5 Explainability Certification Gate", () => {
  it("defines the fail-closed explainability certification doctrine", () => {
    const contract = getExplainabilityCertificationGateContract();

    expect(contract.doctrine.gate_version).toBe("explainability-certification-gate/v8ALT.5.5");
    expect(contract.doctrine.principles).toContain("replay-reproducibility");
    expect(contract.doctrine.principles).toContain("fail-closed-certification");
    expect(contract.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.pass_required_for_production).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the full explainability stack with a PASS baseline", () => {
    const ledger = runExplainabilityCertification();
    const report = ledger.reports[0];
    const validation = validateExplanationCertification(ledger);

    expect(report.overall_status).toBe("PASS");
    expect(report.certification_state).toBe("CERTIFIED");
    expect(report.tests_executed).toBe(28);
    expect(report.tests_failed).toBe(0);
    expect(validation.valid).toBe(true);
  });

  it("validates every certification scope in the report", () => {
    const report = runExplainabilityCertification().reports[0];

    expect(report.explanation_coverage).toBe(true);
    expect(report.replay_verification).toBe(true);
    expect(report.governance_verification).toBe(true);
    expect(report.constitutional_verification).toBe(true);
    expect(report.authority_verification).toBe(true);
    expect(report.confidence_verification).toBe(true);
    expect(report.risk_verification).toBe(true);
    expect(report.integrity_verification).toBe(true);
    expect(report.tenant_isolation_status).toBe(true);
  });

  it("preserves certification evidence, lineage, replay references, and integrity hashes", () => {
    const ledger = runExplainabilityCertification();

    expect(ledger.append_only).toBe(true);
    expect(ledger.read_only).toBe(true);
    expect(ledger.validation_evidence.length).toBeGreaterThanOrEqual(4);
    expect(ledger.lineage_references.length).toBeGreaterThanOrEqual(4);
    expect(ledger.replay_references.length).toBeGreaterThanOrEqual(4);
    expect(ledger.integrity_verification.length).toBeGreaterThan(10);
  });

  it("replays and hashes certification deterministically", () => {
    const ledger = runExplainabilityCertification();
    const replay = replayExplainabilityCertification(ledger);
    const replayValidation = validateExplanationReplay(ledger);

    expect(ledger.ledger_hash).toBe(computeExplainabilityCertificationLedgerHash(ledger));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(ledger.ledger_hash);
    expect(replayValidation.deterministic).toBe(true);
  });

  it("allows conditional pass only for documentation warnings", () => {
    const ledger = runExplainabilityCertification({ scenario: "DOCUMENTATION_WARNING" });
    const report = ledger.reports[0];
    const validation = validateExplanationCertification(ledger);

    expect(report.overall_status).toBe("CONDITIONAL_PASS");
    expect(report.warnings).toHaveLength(1);
    expect(validation.valid).toBe(false);
    expect(validation.failures).not.toContain("NON_CRITICAL_DOCUMENTATION_WARNING");
  });

  it.each([
    ["MISSING_EXPLANATION", "MISSING_EXPLANATION_DETECTED"],
    ["FABRICATED_EXPLANATION", "FABRICATED_EXPLANATION_DETECTED"],
    ["HIDDEN_EVIDENCE", "HIDDEN_EVIDENCE_DETECTED"],
    ["POLICY_OMISSION", "POLICY_OMISSION_DETECTED"],
    ["AUTHORITY_OMISSION", "AUTHORITY_OMISSION_DETECTED"],
    ["CONFIDENCE_REPLAY_MISMATCH", "CONFIDENCE_REPLAY_MISMATCH_DETECTED"],
    ["RISK_REPLAY_MISMATCH", "RISK_REPLAY_MISMATCH_DETECTED"],
    ["NONDETERMINISTIC_WORDING", "NONDETERMINISTIC_EXPLANATION_WORDING"],
    ["CROSS_TENANT_LEAKAGE", "CROSS_TENANT_EXPLANATION_LEAKAGE"],
    ["REPLAY_MISMATCH", "REPLAY_EXPLANATION_MISMATCH"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] as readonly [ExplainabilityCertificationScenario, ExplainabilityCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = runExplainabilityCertification({ scenario });
    const report = ledger.reports[0];
    const validation = validateExplanationCertification(ledger);

    expect(report.overall_status).toBe("FAIL");
    expect(report.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible certification diagnostics", () => {
    const surface = buildExplainabilityCertificationObservabilitySurface(runExplainabilityCertification());

    expect(surface.certification_count).toBe(1);
    expect(surface.overall_status).toBe("PASS");
    expect(surface.tests_failed).toBe(0);
    expect(surface.production_certification_ready).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
