import { describe, expect, it } from "vitest";
import { getProvingAdversarialTestingFrameworkBundle, replayProvingAdversarialTestingFramework, runProvingAdversarialTestingFramework, validateProvingAdversarialTestingFramework } from "@/services/proving-adversarial-testing-framework";
import type { AdversarialFailure } from "@/types/proving-adversarial-testing-framework";

const FAILURE_MATRIX: readonly AdversarialFailure[] = [
  "P6_6_REPLAY_VALIDATION_INVALID",
  "ADVERSARIAL_ARCHITECTURE_MISSING",
  "ATTACK_CATALOG_MISSING",
  "ATTACK_COVERAGE_INCOMPLETE",
  "ATTACK_SCENARIO_GENERATION_MISSING",
  "FAULT_INJECTION_MISSING",
  "FAULT_INJECTION_NONDETERMINISTIC",
  "MISUSE_TESTING_MISSING",
  "ABUSE_VALIDATION_MISSING",
  "GOVERNANCE_ATTACK_VALIDATION_MISSING",
  "IDENTITY_TENANT_ATTACK_VALIDATION_MISSING",
  "REPLAY_ADVERSARIAL_VALIDATION_MISSING",
  "RECOVERY_VALIDATION_MISSING",
  "ADVERSARIAL_ANALYTICS_MISSING",
  "CERTIFICATION_EVIDENCE_MISSING",
  "DETERMINISTIC_ADVERSARIAL_EXECUTION_FAILED",
  "GOVERNANCE_FAIL_CLOSED_FAILED",
  "TENANT_ISOLATION_VIOLATED",
  "EVIDENCE_INTEGRITY_FAILED",
  "REPLAY_EQUIVALENCE_FAILED",
  "NON_PRODUCTION_CONTAINMENT_FAILED",
  "UNAUTHORIZED_EXECUTION_NOT_BLOCKED",
  "AUTHORITY_PRESERVATION_FAILED",
  "POLICY_PRESERVATION_FAILED",
  "SAFETY_PRESERVATION_FAILED",
  "REPLAY_DIVERGENCE_UNCLASSIFIED",
  "RECOVERY_CONTAINMENT_FAILED",
  "RESTORATION_VALIDATION_FAILED",
  "EVIDENCE_LINEAGE_INCOMPLETE",
  "CERTIFICATION_PACKAGE_MISSING",
  "PRODUCTION_SECURITY_MONITORING_OWNERSHIP_VIOLATION",
  "RUNTIME_INCIDENT_RESPONSE_OWNERSHIP_VIOLATION",
  "TRUST_EVALUATION_ATTEMPTED",
  "SAFETY_QUALIFICATION_ATTEMPTED",
  "REPLAY_ENGINE_IMPLEMENTATION_ATTEMPTED",
  "SIMULATION_ENGINE_IMPLEMENTATION_ATTEMPTED",
];

describe("P6.7 Adversarial Testing Framework", () => {
  it("publishes adversarial testing doctrine without owning production monitoring, incident response, trust evaluation, safety qualification, replay engine, or simulation engine", () => {
    const bundle = getProvingAdversarialTestingFrameworkBundle();

    expect(bundle.doctrine.version).toBe("proving-adversarial-testing-framework/v6.7");
    expect(bundle.doctrine.owns_adversarial_testing).toBe(true);
    expect(bundle.doctrine.owns_attack_simulation).toBe(true);
    expect(bundle.doctrine.owns_fault_injection).toBe(true);
    expect(bundle.doctrine.owns_misuse_testing).toBe(true);
    expect(bundle.doctrine.owns_abuse_validation).toBe(true);
    expect(bundle.doctrine.owns_production_security_monitoring).toBe(false);
    expect(bundle.doctrine.owns_runtime_incident_response).toBe(false);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.doctrine.owns_safety_qualification).toBe(false);
    expect(bundle.doctrine.owns_replay_engine_implementation).toBe(false);
    expect(bundle.doctrine.owns_simulation_engine).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministically with replay validation dependency and complete attack catalog coverage", () => {
    const first = runProvingAdversarialTestingFramework();
    const second = runProvingAdversarialTestingFramework();

    expect(first.phase_identifier).toBe("ProvingAdversarialTestingFramework");
    expect(first.replay_validation_ref).toBe("proving-replay-validation-framework/v6.6");
    expect(first.architecture.dependency_validation).toBe(true);
    expect(first.attack_catalog.attacks).toHaveLength(16);
    expect(first.attack_catalog.identity_attacks).toBe(true);
    expect(first.attack_catalog.governance_attacks).toBe(true);
    expect(first.attack_catalog.replay_attacks).toBe(true);
    expect(first.attack_catalog.tenant_attacks).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingAdversarialTestingFramework(first).valid).toBe(true);
    expect(replayProvingAdversarialTestingFramework(first)).toBe(true);
  });

  it("produces scenario generation, fault injection, misuse, abuse, governance, isolation, replay, and recovery evidence", () => {
    const result = runProvingAdversarialTestingFramework();

    expect(result.attack_scenarios.supported_types).toHaveLength(7);
    expect(result.attack_scenarios.deterministic_generation).toBe(true);
    expect(result.fault_injection.service_failures).toBe(true);
    expect(result.fault_injection.storage_corruption).toBe(true);
    expect(result.fault_injection.event_duplication).toBe(true);
    expect(result.fault_injection.deterministic).toBe(true);
    expect(result.fault_injection.replay_compatible).toBe(true);
    expect(result.misuse_report.evidence_refs).toHaveLength(1);
    expect(result.abuse_report.evidence_refs).toHaveLength(1);
    expect(result.governance_report.fail_closed).toBe(true);
    expect(result.isolation_report.fail_closed).toBe(true);
    expect(result.replay_attack_report.fail_closed).toBe(true);
    expect(result.recovery_report.fail_closed).toBe(true);
    expect(result.evidence_package.lineage_complete).toBe(true);
    expect(result.evidence_package.certification_ready).toBe(true);
  });

  it("passes all P6.7 gates, invariants, boundaries, analytics, and readiness checks", () => {
    const result = runProvingAdversarialTestingFramework();

    expect(result.gates.architecture_verification).toBe(true);
    expect(result.gates.attack_coverage).toBe(true);
    expect(result.gates.fault_injection).toBe(true);
    expect(result.gates.misuse_verification).toBe(true);
    expect(result.gates.abuse_validation).toBe(true);
    expect(result.gates.governance_validation).toBe(true);
    expect(result.gates.replay_validation).toBe(true);
    expect(result.gates.recovery_verification).toBe(true);
    expect(result.gates.evidence_verification).toBe(true);
    expect(result.gates.phase_certification).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.invariants.deterministic_execution).toBe(true);
    expect(result.invariants.fail_closed_governance).toBe(true);
    expect(result.invariants.tenant_isolation).toBe(true);
    expect(result.invariants.evidence_integrity).toBe(true);
    expect(result.invariants.replay_equivalence).toBe(true);
    expect(result.invariants.non_production_containment).toBe(true);
    expect(result.analytics.resilience_score).toBeGreaterThanOrEqual(90);
    expect(result.boundaries.owns_production_security_monitoring).toBe(false);
    expect(result.boundaries.owns_runtime_incident_response).toBe(false);
    expect(result.boundaries.owns_trust_evaluation).toBe(false);
    expect(result.boundaries.owns_safety_qualification).toBe(false);
    expect(result.boundaries.owns_replay_engine_implementation).toBe(false);
    expect(result.boundaries.owns_simulation_engine).toBe(false);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails adversarial testing readiness for %s", (failure) => {
    const result = runProvingAdversarialTestingFramework({ scenario: failure });
    const validation = validateProvingAdversarialTestingFramework(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance review required without adversarial testing readiness", () => {
    const result = runProvingAdversarialTestingFramework({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
