import { describe, expect, it } from "vitest";
import { getProvingCrossProgramIntegrationValidationBundle, replayProvingCrossProgramIntegrationValidation, runProvingCrossProgramIntegrationValidation, validateProvingCrossProgramIntegrationValidation } from "@/services/proving-cross-program-integration-validation";
import type { IntegrationFailure } from "@/types/proving-cross-program-integration-validation";

const FAILURE_MATRIX: readonly IntegrationFailure[] = [
  "P6_9_PERFORMANCE_QUALIFICATION_INVALID",
  "DEPENDENCY_ENGINE_MISSING",
  "DEPENDENCY_GRAPH_INCOMPLETE",
  "DEPENDENCY_INCORRECT",
  "CIRCULAR_DEPENDENCY_DETECTED",
  "VERSION_COMPATIBILITY_FAILED",
  "OWNERSHIP_VERIFICATION_FAILED",
  "NAMESPACE_VALIDATION_FAILED",
  "LIFECYCLE_COMPATIBILITY_FAILED",
  "INTERFACE_VALIDATION_MISSING",
  "API_COMPATIBILITY_FAILED",
  "EVENT_COMPATIBILITY_FAILED",
  "MESSAGE_COMPATIBILITY_FAILED",
  "SCHEMA_COMPATIBILITY_FAILED",
  "SERIALIZATION_COMPATIBILITY_FAILED",
  "PROTOCOL_COMPATIBILITY_FAILED",
  "CONTRACT_EVOLUTION_FAILED",
  "BACKWARD_COMPATIBILITY_FAILED",
  "INTEGRATION_TESTING_MISSING",
  "WORKFLOW_EXECUTION_FAILED",
  "IDENTITY_PROPAGATION_FAILED",
  "AUTHORITY_PROPAGATION_FAILED",
  "TRUST_PROPAGATION_FAILED",
  "GOVERNANCE_PROPAGATION_FAILED",
  "EVIDENCE_PROPAGATION_FAILED",
  "REPLAY_PROPAGATION_FAILED",
  "DATA_INTEROPERABILITY_FAILED",
  "GOVERNANCE_INTEGRATION_FAILED",
  "TRUST_INTEGRATION_FAILED",
  "REPLAY_COMPATIBILITY_FAILED",
  "ECOSYSTEM_SCENARIO_FAILED",
  "COMPATIBILITY_MATRIX_MISSING",
  "COMPATIBILITY_MATRIX_INCOMPLETE",
  "TENANT_ISOLATION_FAILED",
  "FAIL_CLOSED_BEHAVIOR_FAILED",
  "CONSTITUTIONAL_BOUNDARY_VIOLATED",
  "INDIVIDUAL_PROGRAM_CERTIFICATION_ATTEMPTED",
  "PROGRAM_ARCHITECTURE_MODIFICATION_ATTEMPTED",
  "PROGRAM_CERTIFICATION_REPLACEMENT_ATTEMPTED",
  "INTERFACE_REDEFINITION_ATTEMPTED",
  "CONSTITUTIONAL_OWNERSHIP_REDEFINITION_ATTEMPTED",
  "INTEGRATION_EVIDENCE_MISSING",
  "INTEGRATION_EVIDENCE_MUTATED",
  "INTEGRATION_LINEAGE_INCOMPLETE",
];

describe("P6.10 Cross-Program Integration Validation", () => {
  it("publishes ecosystem validation doctrine without owning individual certification, architecture modification, certification replacement, interface redefinition, or ownership redefinition", () => {
    const bundle = getProvingCrossProgramIntegrationValidationBundle();

    expect(bundle.doctrine.version).toBe("proving-cross-program-integration-validation/v6.10");
    expect(bundle.doctrine.owns_interoperability).toBe(true);
    expect(bundle.doctrine.owns_dependency_validation).toBe(true);
    expect(bundle.doctrine.owns_integration_testing).toBe(true);
    expect(bundle.doctrine.owns_ecosystem_validation).toBe(true);
    expect(bundle.doctrine.owns_individual_program_certification).toBe(false);
    expect(bundle.doctrine.owns_program_architecture_modification).toBe(false);
    expect(bundle.doctrine.owns_program_certification_replacement).toBe(false);
    expect(bundle.doctrine.owns_interface_redefinition).toBe(false);
    expect(bundle.doctrine.owns_constitutional_ownership_redefinition).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic integration validation with P6.9 performance qualification dependency", () => {
    const first = runProvingCrossProgramIntegrationValidation();
    const second = runProvingCrossProgramIntegrationValidation();

    expect(first.phase_identifier).toBe("ProvingCrossProgramIntegrationValidation");
    expect(first.performance_qualification_ref).toBe("proving-performance-scalability-qualification/v6.9");
    expect(first.dependency_report.programs).toHaveLength(5);
    expect(first.workflow_report.workflow).toHaveLength(5);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingCrossProgramIntegrationValidation(first).valid).toBe(true);
    expect(replayProvingCrossProgramIntegrationValidation(first)).toBe(true);
  });

  it("validates dependencies, interfaces, workflows, events, data, governance, trust, replay, ecosystem scenarios, and compatibility matrix", () => {
    const result = runProvingCrossProgramIntegrationValidation();

    expect(result.dependency_report.graph_complete).toBe(true);
    expect(result.dependency_report.circular_dependencies_absent).toBe(true);
    expect(result.interface_report.api_compatible).toBe(true);
    expect(result.interface_report.backward_compatible).toBe(true);
    expect(result.workflow_report.identity_propagation).toBe(true);
    expect(result.workflow_report.authority_propagation).toBe(true);
    expect(result.workflow_report.trust_propagation).toBe(true);
    expect(result.workflow_report.governance_propagation).toBe(true);
    expect(result.event_report.event_replay).toBe(true);
    expect(result.event_report.idempotency).toBe(true);
    expect(result.data_report.lineage_consistency).toBe(true);
    expect(result.governance_report.tenant_isolation).toBe(true);
    expect(result.governance_report.fail_closed_behavior).toBe(true);
    expect(result.trust_report.authorization_behavior).toBe(true);
    expect(result.replay_report.replay_interoperability).toBe(true);
    expect(result.ecosystem_report.scenarios).toHaveLength(12);
    expect(result.compatibility_matrix.programs).toHaveLength(5);
  });

  it("passes all P6.10 gates, evidence, boundaries, and readiness checks", () => {
    const result = runProvingCrossProgramIntegrationValidation();

    expect(result.gates.dependency_integrity).toBe(true);
    expect(result.gates.interface_compatibility).toBe(true);
    expect(result.gates.integration_success).toBe(true);
    expect(result.gates.trust_compatibility).toBe(true);
    expect(result.gates.replay_compatibility).toBe(true);
    expect(result.gates.governance_validation).toBe(true);
    expect(result.gates.ecosystem_readiness).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.traceable).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.lineage_complete).toBe(true);
    expect(result.boundaries.owns_individual_program_certification).toBe(false);
    expect(result.boundaries.owns_program_architecture_modification).toBe(false);
    expect(result.boundaries.owns_program_certification_replacement).toBe(false);
    expect(result.boundaries.owns_interface_redefinition).toBe(false);
    expect(result.boundaries.owns_constitutional_ownership_redefinition).toBe(false);
    expect(result.readiness.outcome).toBe("PASS");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails cross-program integration readiness for %s", (failure) => {
    const result = runProvingCrossProgramIntegrationValidation({ scenario: failure });
    const validation = validateProvingCrossProgramIntegrationValidation(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance review required without ecosystem readiness", () => {
    const result = runProvingCrossProgramIntegrationValidation({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
