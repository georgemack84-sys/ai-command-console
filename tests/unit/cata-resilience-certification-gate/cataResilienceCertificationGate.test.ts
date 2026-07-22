import { describe, expect, it } from "vitest";
import {
  buildCataResilienceCertificationObservabilitySurface,
  certifyCataResilience,
  getCataResilienceCertificationEvidence,
  getCataResilienceCertificationGateBundle,
  listCataResilienceCertificationReports,
  listCataResilienceCertificationTests,
  validateCataResilienceCertification,
} from "@/services/cata-resilience-certification-gate";
import type { CataResilienceCertificationFailure, CataResilienceCertificationScenario } from "@/types/cata-resilience-certification-gate";

describe("CATA resilience certification gate", () => {
  it("publishes the Phase 8 capstone gate without deployment authority", () => {
    const bundle = getCataResilienceCertificationGateBundle();

    expect(bundle.doctrine.engine_version).toBe("cata-resilience-certification-gate/v8ALT.12");
    expect(bundle.doctrine.final_state).toBe("CATA_RESILIENCE_CERTIFICATION_GATE_READY");
    expect(bundle.repository.final_state).toBe("CATA_RESILIENCE_CERTIFICATION_COMPLETE");
    expect(bundle.repository.record.outcome).toBe("PASS");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.record.production_readiness_verified).toBe(true);
    expect(bundle.repository.record.production_deployment_authorized).toBe(false);
    expect(bundle.repository.record.next_phase_progression_authorized).toBe(false);
    expect(bundle.repository.record.autonomous_execution_authorized).toBe(false);
    expect(bundle.repository.record.autonomous_recovery_authorized).toBe(false);
    expect(bundle.repository.record.governance_modification_authorized).toBe(false);
    expect(bundle.repository.record.constitutional_modification_authorized).toBe(false);
  });

  it("produces the full test matrix, evidence package, and deliverable reports", () => {
    const repository = certifyCataResilience();

    expect(repository.tests).toHaveLength(24);
    expect(repository.tests.every((test) => test.actual_result === "PASS")).toBe(true);
    expect(repository.evidence_package.complete).toBe(true);
    expect(repository.evidence_package.immutable).toBe(true);
    expect(repository.reports).toHaveLength(18);
    expect(repository.failures).toEqual([]);
    expect(getCataResilienceCertificationEvidence().complete).toBe(true);
    expect(listCataResilienceCertificationTests()).toHaveLength(24);
    expect(listCataResilienceCertificationReports()).toHaveLength(18);
  });

  it("keeps certification deterministic and immutable", () => {
    const first = certifyCataResilience();
    const second = certifyCataResilience();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.record.integrity_hash).toBe(first.record.integrity_hash);
    expect(second.evidence_package.integrity_hash).toBe(first.evidence_package.integrity_hash);
    expect(second.immutable).toBe(true);
  });

  it("supports conditional pass for documentation or reporting gaps only", () => {
    const repository = certifyCataResilience({ scenario: "DOCUMENTATION_GAP" });
    const validation = validateCataResilienceCertification(repository);

    expect(repository.final_state).toBe("CATA_RESILIENCE_CERTIFICATION_CONDITIONAL");
    expect(repository.record.outcome).toBe("CONDITIONAL_PASS");
    expect(repository.failures).toEqual([]);
    expect(validation.valid).toBe(false);
    expect(repository.record.production_deployment_authorized).toBe(false);
    expect(repository.record.next_phase_progression_authorized).toBe(false);
  });

  it.each([
    ["RUNTIME_ASSURANCE_MISSING", "RUNTIME_ASSURANCE_MISSING"],
    ["RUNTIME_DRIFT", "RUNTIME_DRIFT_DETECTED"],
    ["AUTONOMOUS_RECOVERY", "AUTONOMOUS_RECOVERY_DETECTED"],
    ["RECOVERY_REPLAY_MISMATCH", "RECOVERY_REPLAY_MISMATCH_DETECTED"],
    ["PREDICTION_INCONSISTENCY", "PREDICTION_INCONSISTENCY_DETECTED"],
    ["MISSION_HEALTH_GAP", "MISSION_HEALTH_EVIDENCE_INCOMPLETE"],
    ["EXPLAINABILITY_INCOMPLETE", "EXPLAINABILITY_INCOMPLETE"],
    ["STRESS_UNRESOLVED_CRITICAL_FAILURE", "UNRESOLVED_CRITICAL_STRESS_FAILURE"],
    ["COORDINATION_NONDETERMINISTIC", "COORDINATION_NONDETERMINISTIC_DETECTED"],
    ["HIDDEN_COMMUNICATION", "HIDDEN_COMMUNICATION_DETECTED"],
    ["UNAUTHORIZED_OPTIMIZATION", "UNAUTHORIZED_OPTIMIZATION_DETECTED"],
    ["OUTCOME_MODIFICATION", "OUTCOME_MODIFICATION_DETECTED"],
    ["UNAUTHORIZED_LEARNING", "UNAUTHORIZED_LEARNING_DETECTED"],
    ["POLICY_MODIFICATION", "POLICY_MODIFICATION_DETECTED"],
    ["CONSTITUTIONAL_MODIFICATION", "CONSTITUTIONAL_MODIFICATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_DETECTED"],
    ["CERTIFICATION_SUITE_FAILURE", "CERTIFICATION_SUITE_FAILED"],
    ["INCOMPLETE_EVIDENCE", "CERTIFICATION_EVIDENCE_INCOMPLETE"],
    ["INCOMPLETE_REPLAY_REFERENCES", "REPLAY_REFERENCES_INCOMPLETE"],
  ] satisfies [CataResilienceCertificationScenario, CataResilienceCertificationFailure][])("fails CATA certification for %s", (scenario, failure) => {
    const repository = certifyCataResilience({ scenario });
    const validation = validateCataResilienceCertification(repository);

    expect(repository.final_state).toBe("CATA_RESILIENCE_CERTIFICATION_FAILED");
    expect(repository.record.outcome).toBe("FAIL");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.record.production_deployment_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "REPLAY_MISMATCH" })).replay_verified).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "INTEGRITY_FAILURE" })).integrity_verified).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "GOVERNANCE_BYPASS" })).governance_verified).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "CONSTITUTIONAL_VIOLATION" })).constitutional_verified).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "AUTHORITY_ESCALATION" })).authority_enforced).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "TENANT_ISOLATION_FAILURE" })).tenant_isolated).toBe(false);
    expect(validateCataResilienceCertification(certifyCataResilience({ scenario: "HIDDEN_EXECUTION" })).no_hidden_execution).toBe(false);
    expect(validateCataResilienceCertification().production_deployment_authorized).toBe(false);
    expect(validateCataResilienceCertification().next_phase_progression_authorized).toBe(false);
  });

  it("publishes observability without operational authority", () => {
    const surface = buildCataResilienceCertificationObservabilitySurface(certifyCataResilience({ scenario: "INCOMPLETE_EVIDENCE" }));

    expect(surface.final_state).toBe("CATA_RESILIENCE_CERTIFICATION_FAILED");
    expect(surface.outcome).toBe("FAIL");
    expect(surface.test_count).toBe(24);
    expect(surface.report_count).toBe(18);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.production_deployment_authorized).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });
});
