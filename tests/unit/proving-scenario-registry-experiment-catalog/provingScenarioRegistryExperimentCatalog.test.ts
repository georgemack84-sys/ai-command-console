import { describe, expect, it } from "vitest";
import { getProvingScenarioRegistryExperimentCatalogBundle, replayProvingScenarioRegistryExperimentCatalog, runProvingScenarioRegistryExperimentCatalog, validateProvingScenarioRegistryExperimentCatalog } from "@/services/proving-scenario-registry-experiment-catalog";
import type { ProvingRegistryFailure } from "@/types/proving-scenario-registry-experiment-catalog";

const FAILURE_MATRIX: readonly ProvingRegistryFailure[] = [
  "P6_2_PROVISIONING_INVALID",
  "SCENARIO_REGISTRY_MISSING",
  "EXPERIMENT_CATALOG_MISSING",
  "BENCHMARK_REGISTRY_MISSING",
  "EXERCISE_REGISTRY_MISSING",
  "VALIDATION_CATALOG_MISSING",
  "ARTIFACT_IDENTITY_MISSING",
  "ARTIFACT_IDENTITY_MUTATED",
  "ANONYMOUS_PROVING_ACTIVITY_ALLOWED",
  "VERSION_GOVERNANCE_MISSING",
  "HISTORICAL_VERSION_MUTABLE",
  "REPRODUCIBILITY_METADATA_MISSING",
  "DISCOVERY_SERVICE_MISSING",
  "EVIDENCE_LINEAGE_MISSING",
  "TENANT_VISIBILITY_VIOLATION",
  "SCENARIO_METADATA_INCOMPLETE",
  "EXPERIMENT_METADATA_INCOMPLETE",
  "BENCHMARK_METADATA_INCOMPLETE",
  "EXERCISE_METADATA_INCOMPLETE",
  "VALIDATION_SUITE_DUPLICATES_ARTIFACTS",
  "DEPENDENCY_TRACKING_MISSING",
  "DEPENDENCY_VALIDATION_FAILED",
  "LIFECYCLE_MANAGEMENT_MISSING",
  "REGISTRY_API_MISSING",
  "GOVERNANCE_METADATA_MISSING",
  "APPROVAL_EVIDENCE_MISSING",
  "ROLE_BASED_ACCESS_MISSING",
  "POLICY_ENFORCEMENT_MISSING",
  "IMMUTABLE_AUDIT_MISSING",
  "REGISTRY_AUTHORIZATION_MISSING",
  "EVIDENCE_PROTECTION_MISSING",
  "TRACEABILITY_LINKS_MISSING",
  "ORPHAN_ARTIFACT_DETECTED",
  "EXECUTION_REFERENCE_NOT_VERSIONED",
  "DOWNSTREAM_CONSUMPTION_NOT_READY",
  "SCENARIO_EXECUTION_ATTEMPTED",
  "SIMULATION_EXECUTION_ATTEMPTED",
  "VALIDATION_LOGIC_IMPLEMENTED",
  "CERTIFICATION_EXECUTION_ATTEMPTED",
  "QUALIFICATION_EXECUTION_ATTEMPTED",
];

describe("P6.3 Scenario Registry and Experiment Catalog", () => {
  it("publishes registry ownership doctrine without executing proving activities", () => {
    const bundle = getProvingScenarioRegistryExperimentCatalogBundle();

    expect(bundle.doctrine.version).toBe("proving-scenario-registry-experiment-catalog/v6.3");
    expect(bundle.doctrine.owns_scenario_registry).toBe(true);
    expect(bundle.doctrine.owns_experiment_catalog).toBe(true);
    expect(bundle.doctrine.owns_exercise_registry).toBe(true);
    expect(bundle.doctrine.owns_benchmark_registry).toBe(true);
    expect(bundle.doctrine.owns_validation_catalog).toBe(true);
    expect(bundle.doctrine.owns_registry_apis).toBe(true);
    expect(bundle.doctrine.executes_scenarios).toBe(false);
    expect(bundle.doctrine.executes_simulations).toBe(false);
    expect(bundle.doctrine.implements_validation_logic).toBe(false);
    expect(bundle.doctrine.performs_certification).toBe(false);
    expect(bundle.doctrine.performs_qualification).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("registers deterministic scenario, experiment, benchmark, exercise, and validation suite catalogs", () => {
    const first = runProvingScenarioRegistryExperimentCatalog();
    const second = runProvingScenarioRegistryExperimentCatalog();

    expect(first.phase_identifier).toBe("ProvingScenarioRegistryExperimentCatalog");
    expect(first.provisioning_ref).toBe("proving-environment-identity-isolation-provisioning/v6.2");
    expect(first.scenario_registry).toHaveLength(1);
    expect(first.experiment_catalog).toHaveLength(1);
    expect(first.benchmark_registry).toHaveLength(1);
    expect(first.exercise_registry).toHaveLength(1);
    expect(first.validation_catalog).toHaveLength(1);
    expect(first.scenario_registry[0]?.immutable_identity).toBe(true);
    expect(first.scenario_registry[0]?.version).toBe("1.0.0");
    expect(first.experiment_catalog[0]?.evidence_producing).toBe(true);
    expect(first.benchmark_registry[0]?.metric).toBe("registry discovery latency");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingScenarioRegistryExperimentCatalog(first).valid).toBe(true);
    expect(replayProvingScenarioRegistryExperimentCatalog(first)).toBe(true);
  });

  it("supports reusable validation relationships without duplicating artifacts", () => {
    const result = runProvingScenarioRegistryExperimentCatalog();

    expect(result.validation_catalog[0]?.duplicates_artifacts).toBe(false);
    expect(result.relationships.validation_suite_to_scenarios).toBe(true);
    expect(result.relationships.validation_suite_to_experiments).toBe(true);
    expect(result.relationships.validation_suite_to_benchmarks).toBe(true);
    expect(result.relationships.validation_suite_to_exercises).toBe(true);
    expect(result.relationships.scenario_to_environment).toBe(true);
    expect(result.relationships.scenario_to_dataset).toBe(true);
    expect(result.relationships.scenario_to_policy).toBe(true);
    expect(result.relationships.scenario_to_identity).toBe(true);
    expect(result.relationships.scenario_to_service).toBe(true);
    expect(result.relationships.scenario_to_expected_evidence).toBe(true);
  });

  it("enforces version governance, discovery, dependencies, security, and traceability", () => {
    const result = runProvingScenarioRegistryExperimentCatalog();

    expect(result.versioning.immutable_identity).toBe(true);
    expect(result.versioning.metadata_may_evolve).toBe(true);
    expect(result.versioning.historical_versions_immutable).toBe(true);
    expect(result.services.search).toBe(true);
    expect(result.services.dependency_tracking).toBe(true);
    expect(result.services.api_surface).toHaveLength(11);
    expect(result.governance.owner).toBe(true);
    expect(result.governance.approving_authority).toBe(true);
    expect(result.governance.approval_evidence.length).toBeGreaterThan(0);
    expect(result.security.tenant_isolation).toBe(true);
    expect(result.security.role_based_access).toBe(true);
    expect(result.security.policy_enforcement).toBe(true);
    expect(result.security.immutable_audit).toBe(true);
    expect(result.security.registry_authorization).toBe(true);
    expect(result.security.evidence_protection).toBe(true);
    expect(result.traceability.no_orphan_artifacts).toBe(true);
    expect(result.traceability.execution_references_registered_versions).toBe(true);
    expect(result.readiness.downstream_ready).toBe(true);
  });

  it.each(FAILURE_MATRIX)("fails registry readiness for %s", (failure) => {
    const result = runProvingScenarioRegistryExperimentCatalog({ scenario: failure });
    const validation = validateProvingScenarioRegistryExperimentCatalog(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without registry readiness", () => {
    const result = runProvingScenarioRegistryExperimentCatalog({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
