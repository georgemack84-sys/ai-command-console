import { describe, expect, it } from "vitest";
import { getProvingArchitectureEnvironmentFoundationBundle, replayProvingArchitectureEnvironmentFoundation, runProvingArchitectureEnvironmentFoundation, validateProvingArchitectureEnvironmentFoundation } from "@/services/proving-architecture-environment-foundation";
import type { ProvingFoundationFailure } from "@/types/proving-architecture-environment-foundation";

const FAILURE_MATRIX: readonly ProvingFoundationFailure[] = [
  "P5_18_PROGRAM_QUALIFICATION_INVALID",
  "PROVING_ARCHITECTURE_MISSING",
  "ENVIRONMENT_MODEL_MISSING",
  "SERVICE_MODEL_MISSING",
  "EXECUTION_MODEL_MISSING",
  "ENVIRONMENT_LIFECYCLE_MISSING",
  "ENVIRONMENT_STATE_MODEL_INVALID",
  "ENVIRONMENT_SERVICES_MISSING",
  "ENVIRONMENT_GOVERNANCE_MISSING",
  "ENVIRONMENT_COMPOSITION_INVALID",
  "ENVIRONMENT_REGISTRATION_INVALID",
  "ARCHITECTURE_INCOMPLETE",
  "DEPENDENCY_CORRECTNESS_FAILED",
  "SERVICE_COMPOSITION_FAILED",
  "BOUNDARY_DEFINITION_FAILED",
  "LIFECYCLE_CORRECTNESS_FAILED",
  "PROVISIONING_SEQUENCE_INVALID",
  "ISOLATION_FAILURE",
  "EXECUTION_READINESS_INVALID",
  "SERVICE_CONTRACT_INVALID",
  "SERVICE_INTEROPERABILITY_FAILED",
  "LIFECYCLE_INTEGRATION_FAILED",
  "DEPENDENCY_RESOLUTION_FAILED",
  "CONSTITUTIONAL_COMPATIBILITY_FAILED",
  "PROGRAM_1_COMPATIBILITY_FAILED",
  "PROGRAM_2_COMPATIBILITY_FAILED",
  "PROGRAM_3_COMPATIBILITY_FAILED",
  "PROGRAM_4_COMPATIBILITY_FAILED",
  "PROGRAM_5_COMPATIBILITY_FAILED",
  "GLOBAL_IDENTITY_MISSING",
  "IMMUTABLE_IDENTITY_VIOLATION",
  "REPRODUCIBILITY_MISSING",
  "CONFIGURATION_VERSION_MISSING",
  "DETERMINISTIC_REPLAY_UNSUPPORTED",
  "DEPENDENCIES_NOT_DECLARED",
  "SERVICES_NOT_COMPOSABLE",
  "LIFECYCLE_VALIDATION_BYPASSED",
  "PROVISIONING_BEFORE_REGISTRATION",
  "INACTIVE_ENVIRONMENT_EXECUTION_ALLOWED",
  "ARCHIVED_ENVIRONMENT_MUTABLE",
  "RETIRED_ENVIRONMENT_EXECUTION_ALLOWED",
  "PRODUCTION_ACCESS_WITHOUT_CONSTITUTIONAL_AUTHORIZATION",
  "GOVERNANCE_INHERITANCE_MISSING",
  "ARCHITECTURAL_EVIDENCE_MISSING",
  "RUNTIME_EXECUTION_LOGIC_IMPLEMENTED",
  "PROVING_SCENARIO_OWNERSHIP_VIOLATION",
  "PROVING_EVIDENCE_OWNERSHIP_VIOLATION",
  "REPLAY_OWNERSHIP_VIOLATION",
  "CERTIFICATION_OWNERSHIP_VIOLATION",
  "QUALIFICATION_OWNERSHIP_VIOLATION",
  "TRUST_EVALUATION_OWNERSHIP_VIOLATION",
];

describe("P6.1 Proving Architecture and Environment Foundation", () => {
  it("publishes foundation doctrine without owning later proving capabilities", () => {
    const bundle = getProvingArchitectureEnvironmentFoundationBundle();

    expect(bundle.doctrine.version).toBe("proving-architecture-environment-foundation/v6.1");
    expect(bundle.doctrine.owns_proving_architecture).toBe(true);
    expect(bundle.doctrine.owns_environment_model).toBe(true);
    expect(bundle.doctrine.owns_service_model).toBe(true);
    expect(bundle.doctrine.owns_execution_model).toBe(true);
    expect(bundle.doctrine.owns_environment_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_environment_registration).toBe(true);
    expect(bundle.doctrine.owns_runtime_execution_logic).toBe(false);
    expect(bundle.doctrine.owns_proving_scenarios).toBe(false);
    expect(bundle.doctrine.owns_proving_evidence).toBe(false);
    expect(bundle.doctrine.owns_replay).toBe(false);
    expect(bundle.doctrine.owns_certification).toBe(false);
    expect(bundle.doctrine.owns_qualification).toBe(false);
    expect(bundle.doctrine.owns_trust_evaluation).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines deterministic architecture, environment, service, execution, lifecycle, and governance models", () => {
    const first = runProvingArchitectureEnvironmentFoundation();
    const second = runProvingArchitectureEnvironmentFoundation();

    expect(first.phase_identifier).toBe("ProvingArchitectureEnvironmentFoundation");
    expect(first.trust_program_qualification_ref).toBe("trust-program-qualification/v5.18");
    expect(first.architecture.constitutional).toBe(true);
    expect(first.architecture.replayable).toBe(true);
    expect(first.environment_model.environment_id).toBe("proving-env:civitas:foundation");
    expect(first.environment_model.environment_version).toBe("p6.1.0");
    expect(first.environment_model.lifecycle_state).toBe("DEFINED");
    expect(first.environment_model.dependencies.length).toBe(9);
    expect(first.environment_model.services.length).toBe(10);
    expect(first.execution_model.runtime_logic_implemented).toBe(false);
    expect(first.execution_model.only_active_executes).toBe(true);
    expect(first.service_catalog.independently_composable).toBe(true);
    expect(first.governance.program_5_inherited).toBe(true);
    expect(first.governance.trust_standing_consumed).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingArchitectureEnvironmentFoundation(first).valid).toBe(true);
    expect(replayProvingArchitectureEnvironmentFoundation(first)).toBe(true);
  });

  it("formalizes the canonical lifecycle, isolation profile, invariants, and verification gates", () => {
    const result = runProvingArchitectureEnvironmentFoundation();

    expect(result.lifecycle.states).toEqual(["DEFINED", "REGISTERED", "VALIDATED", "PROVISIONING", "READY", "ACTIVE", "PAUSED", "RESUMED", "ARCHIVED", "RETIRED"]);
    expect(result.lifecycle.registration_precedes_provisioning).toBe(true);
    expect(result.lifecycle.validation_precedes_execution).toBe(true);
    expect(result.lifecycle.archived_immutable).toBe(true);
    expect(result.lifecycle.retired_non_executable).toBe(true);
    expect(result.isolation.compute).toBe(true);
    expect(result.isolation.storage).toBe(true);
    expect(result.isolation.networking).toBe(true);
    expect(result.isolation.messaging).toBe(true);
    expect(result.isolation.identities).toBe(true);
    expect(result.isolation.secrets).toBe(true);
    expect(result.isolation.telemetry).toBe(true);
    expect(result.isolation.evidence).toBe(true);
    expect(result.isolation.replay).toBe(true);
    expect(result.isolation.audit).toBe(true);
    expect(result.isolation.production_access_requires_constitutional_authorization).toBe(true);
    expect(result.invariants).toHaveLength(15);
    expect(result.invariants.every((item) => item.satisfied)).toBe(true);
    expect(result.gates.map((gate) => gate.gate_id)).toEqual(["P6.1-G1", "P6.1-G2", "P6.1-G3", "P6.1-G4"]);
    expect(result.gates.every((gate) => gate.passed)).toBe(true);
  });

  it("declares dependencies and produces only the foundation outputs", () => {
    const result = runProvingArchitectureEnvironmentFoundation();

    expect(result.dependencies.consumes_program_1_capability_registry).toBe(true);
    expect(result.dependencies.consumes_program_2_platform_services).toBe(true);
    expect(result.dependencies.consumes_program_2_identity).toBe(true);
    expect(result.dependencies.consumes_program_2_deployment_services).toBe(true);
    expect(result.dependencies.consumes_program_2_runtime_services).toBe(true);
    expect(result.dependencies.consumes_program_2_observability).toBe(true);
    expect(result.dependencies.consumes_program_3_agent_runtime).toBe(true);
    expect(result.dependencies.consumes_program_4_applications).toBe(true);
    expect(result.dependencies.consumes_program_5_trust_standing).toBe(true);
    expect(result.dependencies.produces_environment_foundation).toBe(true);
    expect(result.dependencies.produces_environment_registration).toBe(true);
    expect(result.dependencies.produces_environment_lifecycle).toBe(true);
    expect(result.dependencies.produces_execution_foundation).toBe(true);
    expect(result.boundaries.owns_runtime_execution_logic).toBe(false);
    expect(result.boundaries.owns_certification).toBe(false);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails foundation readiness for %s", (failure) => {
    const result = runProvingArchitectureEnvironmentFoundation({ scenario: failure });
    const validation = validateProvingArchitectureEnvironmentFoundation(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without marking the foundation ready", () => {
    const result = runProvingArchitectureEnvironmentFoundation({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
