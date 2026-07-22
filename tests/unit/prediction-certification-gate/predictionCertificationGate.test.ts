import { describe, expect, it, vi } from "vitest";
import {
  buildPredictionCertificationObservabilitySurface,
  computePredictionCertificationLedgerHash,
  getPredictionCertificationGateContract,
  replayPredictionCertification,
  runPredictionCertification,
  validatePredictionCertification,
} from "@/services/prediction-certification-gate";
import type { PredictionCertificationFailure, PredictionCertificationScenario } from "@/types/prediction-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.10 Prediction Certification Gate", () => {
  it("defines the fail-closed prediction certification doctrine", () => {
    const contract = getPredictionCertificationGateContract();

    expect(contract.doctrine.gate_version).toBe("prediction-certification-gate/v8ALT.3.10");
    expect(contract.doctrine.principles).toContain("replay-first-certification");
    expect(contract.doctrine.principles).toContain("fail-closed-certification");
    expect(contract.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.pass_required_for_production).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the full predictive stack with a PASS baseline", () => {
    const ledger = runPredictionCertification();
    const report = ledger.certification_results[0];
    const validation = validatePredictionCertification(ledger);

    expect(report.overall_status).toBe("PASS");
    expect(report.certification_state).toBe("CERTIFIED");
    expect(report.production_certification_ready).toBe(true);
    expect(report.tests_failed).toBe(0);
    expect(validation.valid).toBe(true);
  });

  it("validates prediction, explainability, replay, confidence, governance, constitutional, security, and operational categories", () => {
    const report = runPredictionCertification().certification_results[0];

    expect(report.prediction_validation.status).toBe("PASS");
    expect(report.explainability_validation.status).toBe("PASS");
    expect(report.replay_validation.status).toBe("PASS");
    expect(report.confidence_validation.status).toBe("PASS");
    expect(report.governance_validation.status).toBe("PASS");
    expect(report.constitutional_validation.status).toBe("PASS");
    expect(report.security_validation.status).toBe("PASS");
    expect(report.operational_validation.status).toBe("PASS");
  });

  it("preserves certification evidence, lineage, replay references, and integrity hashes", () => {
    const ledger = runPredictionCertification();

    expect(ledger.validation_evidence.length).toBeGreaterThanOrEqual(9);
    expect(ledger.lineage_references.length).toBe(1);
    expect(ledger.replay_references.length).toBe(1);
    expect(ledger.integrity_verification.length).toBeGreaterThan(1);
    expect(ledger.certification_hashes.length).toBe(1);
  });

  it("replays and hashes certification deterministically", () => {
    const ledger = runPredictionCertification();
    const replay = replayPredictionCertification(ledger);

    expect(ledger.ledger_hash).toBe(computePredictionCertificationLedgerHash(ledger));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(ledger.ledger_hash);
  });

  it("enforces advisory-only behavior and production readiness reporting", () => {
    const ledger = runPredictionCertification();
    const report = ledger.certification_results[0];
    const validation = validatePredictionCertification(ledger);

    expect(report.advisory_only).toBe(true);
    expect(report.autonomous_execution_detected).toBe(false);
    expect(report.autonomous_mitigation_detected).toBe(false);
    expect(report.governance_modified).toBe(false);
    expect(report.constitutional_modified).toBe(false);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
    expect(validation.production_certification_readiness_confirmed).toBe(true);
  });

  it("allows conditional pass only for non-critical documentation warnings", () => {
    const ledger = runPredictionCertification({ scenario: "DOCUMENTATION_WARNING" });
    const report = ledger.certification_results[0];

    expect(report.overall_status).toBe("CONDITIONAL_PASS");
    expect(report.production_certification_ready).toBe(false);
    expect(report.tests_warning).toBe(1);
  });

  it.each([
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["AUTONOMOUS_MITIGATION_ATTEMPT", "AUTONOMOUS_MITIGATION_DETECTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPT", "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"],
    ["CONSTITUTIONAL_MODIFICATION_ATTEMPT", "CONSTITUTIONAL_MODIFICATION_DETECTED"],
    ["LINEAGE_MUTATION", "PREDICTION_LINEAGE_MUTATION_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["HIDDEN_PREDICTION_LOGIC", "HIDDEN_PREDICTION_LOGIC_DETECTED"],
  ] as readonly [PredictionCertificationScenario, PredictionCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = runPredictionCertification({ scenario });
    const report = ledger.certification_results[0];
    const validation = validatePredictionCertification(ledger);

    expect(report.overall_status).toBe("FAIL");
    expect(report.fail_closed_verified).toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible certification diagnostics", () => {
    const surface = buildPredictionCertificationObservabilitySurface(runPredictionCertification());

    expect(surface.certification_count).toBe(1);
    expect(surface.overall_status).toBe("PASS");
    expect(surface.tests_failed).toBe(0);
    expect(surface.production_certification_ready).toBe(true);
    expect(surface.advisory_only).toBe(true);
  });
});
