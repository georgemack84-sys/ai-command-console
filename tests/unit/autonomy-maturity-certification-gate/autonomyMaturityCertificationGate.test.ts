import { describe, expect, it } from "vitest";
import {
  buildAutonomyMaturityCertificationObservabilitySurface,
  certifyAutonomyMaturity,
  getAutonomyMaturityCertificationEvidence,
  getAutonomyMaturityCertificationGateBundle,
  listAutonomyMaturityCertificationReports,
  listAutonomyMaturityCertificationTests,
  validateAutonomyMaturityCertification,
} from "@/services/autonomy-maturity-certification-gate";
import type { AutonomyMaturityCertificationFailure, AutonomyMaturityCertificationScenario } from "@/types/autonomy-maturity-certification-gate";

describe("autonomy maturity certification gate", () => {
  it("publishes deterministic certification gate bundle without deployment authority", () => {
    const bundle = getAutonomyMaturityCertificationGateBundle();

    expect(bundle.doctrine.engine_version).toBe("autonomy-maturity-certification-gate/v8ALT.11.12");
    expect(bundle.doctrine.final_state).toBe("AUTONOMY_MATURITY_CERTIFICATION_GATE_READY");
    expect(bundle.repository.final_state).toBe("AUTONOMY_MATURITY_CERTIFICATION_COMPLETE");
    expect(bundle.repository.record.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.record.production_readiness_verified).toBe(true);
    expect(bundle.repository.record.production_deployment_authorized).toBe(false);
    expect(bundle.repository.record.runtime_behavior_modification_authorized).toBe(false);
    expect(bundle.repository.record.governance_modification_authorized).toBe(false);
    expect(bundle.repository.record.constitutional_modification_authorized).toBe(false);
  });

  it("produces tests, evidence, and reports", () => {
    const repository = certifyAutonomyMaturity();

    expect(repository.tests).toHaveLength(20);
    expect(repository.tests.every((test) => test.actual_result === "PASS")).toBe(true);
    expect(repository.evidence_package.complete).toBe(true);
    expect(repository.evidence_package.immutable).toBe(true);
    expect(repository.reports).toHaveLength(7);
    expect(repository.failures).toEqual([]);
    expect(getAutonomyMaturityCertificationEvidence().complete).toBe(true);
    expect(listAutonomyMaturityCertificationTests()).toHaveLength(20);
    expect(listAutonomyMaturityCertificationReports()).toHaveLength(7);
  });

  it("keeps certification deterministic", () => {
    const first = certifyAutonomyMaturity();
    const second = certifyAutonomyMaturity();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.record.integrity_hash).toBe(first.record.integrity_hash);
    expect(second.evidence_package.integrity_hash).toBe(first.evidence_package.integrity_hash);
  });

  it("supports conditional pass only for minor documentation/reporting gaps", () => {
    const repository = certifyAutonomyMaturity({ scenario: "DOCUMENTATION_GAP" });
    const validation = validateAutonomyMaturityCertification(repository);

    expect(repository.final_state).toBe("AUTONOMY_MATURITY_CERTIFICATION_CONDITIONAL");
    expect(repository.record.outcome).toBe("CONDITIONAL_PASS");
    expect(repository.failures).toEqual([]);
    expect(validation.valid).toBe(false);
    expect(repository.record.production_deployment_authorized).toBe(false);
  });

  it.each([
    ["CERTIFICATION_TEST_FAILURE", "CERTIFICATION_TEST_FAILED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["NONDETERMINISTIC_SCORING", "NONDETERMINISTIC_SCORING_DETECTED"],
    ["CLASSIFICATION_MISMATCH", "CLASSIFICATION_MISMATCH_DETECTED"],
    ["RECOMMENDATION_MISMATCH", "RECOMMENDATION_MISMATCH_DETECTED"],
    ["INCOMPLETE_EVIDENCE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_FAILURE_DETECTED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_FAILURE_DETECTED"],
    ["MONITORING_RUNTIME_MODIFICATION", "MONITORING_RUNTIME_MODIFICATION_DETECTED"],
    ["AUTOMATIC_RECOMMENDATION_EXECUTION", "AUTOMATIC_RECOMMENDATION_EXECUTION_DETECTED"],
    ["HIDDEN_ASSESSMENT_LOGIC", "HIDDEN_ASSESSMENT_LOGIC_DETECTED"],
    ["INCOMPLETE_REPLAY_REFERENCES", "REPLAY_REFERENCES_INCOMPLETE"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
  ] satisfies [AutonomyMaturityCertificationScenario, AutonomyMaturityCertificationFailure][])("fails certification for %s", (scenario, failure) => {
    const repository = certifyAutonomyMaturity({ scenario });
    const validation = validateAutonomyMaturityCertification(repository);

    expect(repository.final_state).toBe("AUTONOMY_MATURITY_CERTIFICATION_FAILED");
    expect(repository.record.outcome).toBe("FAIL");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.record.production_deployment_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "CERTIFICATION_TEST_FAILURE" })).all_tests_passed).toBe(false);
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "REPLAY_MISMATCH" })).replay_verified).toBe(false);
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "INCOMPLETE_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "GOVERNANCE_FAILURE" })).governance_verified).toBe(false);
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "CONSTITUTIONAL_FAILURE" })).constitutional_verified).toBe(false);
    expect(validateAutonomyMaturityCertification(certifyAutonomyMaturity({ scenario: "TENANT_ISOLATION_FAILURE" })).tenant_isolated).toBe(false);
    expect(validateAutonomyMaturityCertification().production_deployment_authorized).toBe(false);
  });

  it("publishes observability without production deployment authority", () => {
    const surface = buildAutonomyMaturityCertificationObservabilitySurface(certifyAutonomyMaturity({ scenario: "INCOMPLETE_EVIDENCE" }));

    expect(surface.final_state).toBe("AUTONOMY_MATURITY_CERTIFICATION_FAILED");
    expect(surface.outcome).toBe("FAIL");
    expect(surface.test_count).toBe(20);
    expect(surface.report_count).toBe(7);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.production_deployment_authorized).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });
});
