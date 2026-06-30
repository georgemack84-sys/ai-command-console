import { describe, expect, it, vi } from "vitest";
import {
  buildAdaptiveRuntimeCertificationObservabilitySurface,
  computeAdaptiveRuntimeCertificationReportHash,
  getAdaptiveRuntimeAssuranceCertificationContract,
  runAdaptiveRuntimeAssuranceCertification,
  validateAdaptiveRuntimeAssuranceCertification,
} from "@/services/adaptive-runtime-assurance-certification-gate";
import type { AdaptiveRuntimeCertificationFailure, AdaptiveRuntimeCertificationScenario } from "@/types/adaptive-runtime-assurance-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.1H Adaptive Runtime Assurance Certification Gate", () => {
  it("defines certification doctrine, scope, states, and categories", () => {
    const contract = getAdaptiveRuntimeAssuranceCertificationContract();

    expect(contract.doctrine.certification_version).toBe("adaptive-runtime-assurance-certification-gate/v8ALT.1H");
    expect(contract.doctrine.states).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(contract.doctrine.certification_scope).toEqual(["Phase 8ALT.1A", "Phase 8ALT.1B", "Phase 8ALT.1C", "Phase 8ALT.1D", "Phase 8ALT.1E", "Phase 8ALT.1F", "Phase 8ALT.1G"]);
    expect(contract.doctrine.categories).toContain("Ledger");
    expect(contract.doctrine.categories).toContain("Operator Visibility");
    expect(contract.doctrine.pass_rule).toBe("all-critical-tests-pass");
    expect(contract.doctrine.conditional_pass_rule).toBe("minor-non-critical-only");
  });

  it("returns PASS when the full adaptive runtime assurance stack certifies", () => {
    const report = runAdaptiveRuntimeAssuranceCertification();
    const validation = validateAdaptiveRuntimeAssuranceCertification(report);

    expect(report.phase).toBe("8ALT.1H");
    expect(report.certification_state).toBe("PASS");
    expect(report.production_progression_permitted).toBe(true);
    expect(report.higher_order_resilience_enabled).toBe(true);
    expect(report.validation_matrix.length).toBe(49);
    expect(report.validation_matrix.filter((item) => item.expected === "PASS").every((item) => item.actual === "PASS")).toBe(true);
    expect(report.detected_failures).toEqual([]);
    expect(report.certification_evidence.length).toBe(7);
    expect(report.ledger_package.entries.length).toBeGreaterThan(0);
    expect(report.operator_required).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it.each([
    ["MINOR_DOCUMENTATION_GAP", "MINOR_DOCUMENTATION_GAP"],
    ["MINOR_REPORTING_GAP", "MINOR_REPORTING_GAP"],
    ["MINOR_VISUALIZATION_GAP", "MINOR_VISUALIZATION_GAP"],
    ["NON_CRITICAL_OBSERVABILITY_GAP", "NON_CRITICAL_OBSERVABILITY_GAP"],
  ] as readonly [AdaptiveRuntimeCertificationScenario, AdaptiveRuntimeCertificationFailure][])( 
    "allows conditional pass for %s while blocking progression",
    (scenario, failure) => {
      const report = runAdaptiveRuntimeAssuranceCertification({ scenario });
      const validation = validateAdaptiveRuntimeAssuranceCertification(report);

      expect(report.certification_state).toBe("CONDITIONAL_PASS");
      expect(report.production_progression_permitted).toBe(false);
      expect(report.higher_order_resilience_enabled).toBe(false);
      expect(report.detected_failures).toContain(failure);
      expect(report.readiness.blocked_operations).toContain("higher-order resilience capabilities");
      expect(validation.valid).toBe(false);
    },
  );

  it.each([
    ["NONDETERMINISTIC_CONFIDENCE", "NONDETERMINISTIC_CONFIDENCE_EVALUATION"],
    ["NONDETERMINISTIC_HEALTH", "NONDETERMINISTIC_HEALTH_SCORING"],
    ["DRIFT_INCONSISTENCY", "DRIFT_INCONSISTENCY"],
    ["RECOMMENDATION_INCONSISTENCY", "RECOMMENDATION_INCONSISTENCY"],
    ["STATE_MISMATCH", "ASSURANCE_STATE_MISMATCH"],
    ["LEDGER_CORRUPTION", "LEDGER_CORRUPTION"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE"],
    ["HIDDEN_ASSURANCE_STATE", "HIDDEN_RUNTIME_ASSURANCE_STATE"],
    ["INCOMPLETE_OPERATOR_VISIBILITY", "INCOMPLETE_OPERATOR_VISIBILITY"],
    ["UNAUTHORIZED_EXECUTION_CAPABILITY", "UNAUTHORIZED_EXECUTION_CAPABILITY"],
  ] as readonly [AdaptiveRuntimeCertificationScenario, AdaptiveRuntimeCertificationFailure][])( 
    "fails closed for %s",
    (scenario, failure) => {
      const report = runAdaptiveRuntimeAssuranceCertification({ scenario });
      const validation = validateAdaptiveRuntimeAssuranceCertification(report);

      expect(report.certification_state).toBe("FAIL");
      expect(report.production_progression_permitted).toBe(false);
      expect(report.higher_order_resilience_enabled).toBe(false);
      expect(report.operator_required).toBe(true);
      expect(report.detected_failures).toContain(failure);
      expect(report.detected_risks).toContain(`CRITICAL:${failure}`);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("replays and hashes certification reports deterministically", () => {
    const first = runAdaptiveRuntimeAssuranceCertification();
    const second = runAdaptiveRuntimeAssuranceCertification();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(first.report_hash).toBe(computeAdaptiveRuntimeCertificationReportHash(first));
    expect(first.replay.deterministic).toBe(true);
    expect(first.replay.reconstructed_matrix_hashes).toEqual(first.validation_matrix.map((item) => item.test_hash));
  });

  it("publishes operator-visible certification observability", () => {
    const surface = buildAdaptiveRuntimeCertificationObservabilitySurface(runAdaptiveRuntimeAssuranceCertification({ scenario: "TENANT_ISOLATION_FAILURE" }));

    expect(surface.certification_state).toBe("FAIL");
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.production_progression_permitted).toBe(false);
    expect(surface.higher_order_resilience_enabled).toBe(false);
    expect(surface.failures).toContain("TENANT_ISOLATION_FAILURE");
    expect(surface.operator_required).toBe(true);
  });
});
