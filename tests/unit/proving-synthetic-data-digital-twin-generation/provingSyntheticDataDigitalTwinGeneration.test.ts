import { describe, expect, it } from "vitest";
import { getProvingSyntheticDataDigitalTwinGenerationBundle, replayProvingSyntheticDataDigitalTwinGeneration, runProvingSyntheticDataDigitalTwinGeneration, validateProvingSyntheticDataDigitalTwinGeneration } from "@/services/proving-synthetic-data-digital-twin-generation";
import type { SyntheticGenerationFailure } from "@/types/proving-synthetic-data-digital-twin-generation";

const FAILURE_MATRIX: readonly SyntheticGenerationFailure[] = [
  "P6_3_REGISTRY_INVALID",
  "SYNTHETIC_TENANT_GENERATOR_MISSING",
  "SYNTHETIC_ORGANIZATION_GENERATOR_MISSING",
  "SYNTHETIC_USER_GENERATOR_MISSING",
  "SYNTHETIC_MISSION_GENERATOR_MISSING",
  "SYNTHETIC_DATASET_GENERATOR_MISSING",
  "DIGITAL_TWIN_GENERATOR_MISSING",
  "INFRASTRUCTURE_TWIN_GENERATOR_MISSING",
  "BEHAVIORAL_MODEL_GENERATOR_MISSING",
  "HISTORICAL_TIMELINE_GENERATOR_MISSING",
  "ENVIRONMENT_COMPOSER_MISSING",
  "PRODUCTION_DATA_EXPOSURE",
  "STATISTICAL_REALISM_MISSING",
  "DETERMINISTIC_REPLAY_MISSING",
  "GENERATION_SEED_MISSING",
  "GENERATOR_IDENTITY_MISSING",
  "CONFIGURATION_VERSION_MISSING",
  "SCHEMA_VALIDATION_FAILED",
  "ONTOLOGY_COMPLIANCE_FAILED",
  "REFERENTIAL_INTEGRITY_FAILED",
  "DEPENDENCY_INTEGRITY_FAILED",
  "LIFECYCLE_CONSISTENCY_FAILED",
  "IDENTITY_UNIQUENESS_FAILED",
  "GOVERNANCE_CONSISTENCY_FAILED",
  "TRUST_COMPATIBILITY_FAILED",
  "DIGITAL_TWIN_LINEAGE_MISSING",
  "DIGITAL_TWIN_VERSION_HISTORY_MISSING",
  "SYNTHETIC_DATA_CATALOG_MISSING",
  "SYNTHETIC_ENVIRONMENT_REGISTRY_MISSING",
  "COMPOSED_ENVIRONMENT_NOT_EXECUTABLE",
  "GOVERNANCE_SAFE_EVIDENCE_MISSING",
  "SCENARIO_INSTANTIATION_MISSING",
  "SIMULATION_EXECUTION_ATTEMPTED",
  "BENCHMARK_EXECUTION_ATTEMPTED",
  "CERTIFICATION_EXECUTION_ATTEMPTED",
  "VALIDATION_ORCHESTRATION_ATTEMPTED",
];

describe("P6.4 Synthetic Data and Digital Twin Generation", () => {
  it("publishes generation doctrine without production data exposure or execution ownership", () => {
    const bundle = getProvingSyntheticDataDigitalTwinGenerationBundle();

    expect(bundle.doctrine.version).toBe("proving-synthetic-data-digital-twin-generation/v6.4");
    expect(bundle.doctrine.owns_synthetic_tenants).toBe(true);
    expect(bundle.doctrine.owns_synthetic_organizations).toBe(true);
    expect(bundle.doctrine.owns_synthetic_missions).toBe(true);
    expect(bundle.doctrine.owns_synthetic_datasets).toBe(true);
    expect(bundle.doctrine.owns_digital_twins).toBe(true);
    expect(bundle.doctrine.exposes_production_data).toBe(false);
    expect(bundle.doctrine.redefines_prior_programs).toBe(false);
    expect(bundle.doctrine.executes_simulations).toBe(false);
    expect(bundle.doctrine.performs_certification).toBe(false);
    expect(bundle.doctrine.orchestrates_validation).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("generates deterministic synthetic ecosystem artifacts from equivalent seed inputs", () => {
    const first = runProvingSyntheticDataDigitalTwinGeneration({ seed: "seed:test:p6.4" });
    const second = runProvingSyntheticDataDigitalTwinGeneration({ seed: "seed:test:p6.4" });

    expect(first.phase_identifier).toBe("ProvingSyntheticDataDigitalTwinGeneration");
    expect(first.registry_ref).toBe("proving-scenario-registry-experiment-catalog/v6.3");
    expect(first.pipeline.random_seed).toBe("seed:test:p6.4");
    expect(first.pipeline.deterministic).toBe(true);
    expect(first.pipeline.equivalent_inputs_equivalent_outputs).toBe(true);
    expect(first.tenant.tenant_id).toBe("synthetic-tenant:civitas:p6.4");
    expect(first.organization.hierarchy_depth).toBeGreaterThan(0);
    expect(first.users.count_supported).toBe("BILLIONS");
    expect(first.missions.mission_types).toContain("emergency response");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingSyntheticDataDigitalTwinGeneration(first).valid).toBe(true);
    expect(replayProvingSyntheticDataDigitalTwinGeneration()).toBe(true);
  });

  it("publishes complete synthetic data, digital twin, infrastructure, behavior, and timeline models", () => {
    const result = runProvingSyntheticDataDigitalTwinGeneration();

    expect(result.datasets.modalities).toHaveLength(10);
    expect(result.datasets.no_production_data).toBe(true);
    expect(result.datasets.statistically_realistic).toBe(true);
    expect(result.datasets.lifecycle).toEqual(["DEFINED", "GENERATED", "VALIDATED", "CATALOGED", "PUBLISHED", "VERSIONED", "ARCHIVED"]);
    expect(result.digital_twins.categories).toEqual(["PLATFORM", "ORGANIZATION", "INFRASTRUCTURE", "APPLICATION", "MISSION", "USER", "WORKFLOW", "ENVIRONMENT"]);
    expect(result.digital_twins.lifecycle).toEqual(["DEFINED", "GENERATED", "VALIDATED", "REGISTERED", "ACTIVE", "UPDATED", "ARCHIVED", "RETIRED"]);
    expect(result.digital_twins.evidence_lineage.length).toBeGreaterThan(0);
    expect(result.digital_twins.version_history.length).toBeGreaterThan(0);
    expect(result.infrastructure_twin.cloud).toBe(true);
    expect(result.infrastructure_twin.kubernetes).toBe(true);
    expect(result.infrastructure_twin.recovery).toBe(true);
    expect(result.behavior.deterministic_seeded_probabilities).toBe(true);
    expect(result.behavior.repeatable_execution).toBe(true);
    expect(result.timeline.years_of_events).toBeGreaterThan(0);
    expect(result.timeline.replay_initialization).toBe(true);
  });

  it("validates schema, ontology, dependencies, realism, replay, governance, trust, and composed environment readiness", () => {
    const result = runProvingSyntheticDataDigitalTwinGeneration();

    expect(result.validation.schema_correctness).toBe(true);
    expect(result.validation.referential_integrity).toBe(true);
    expect(result.validation.ontology_compliance).toBe(true);
    expect(result.validation.dependency_integrity).toBe(true);
    expect(result.validation.statistical_realism).toBe(true);
    expect(result.validation.deterministic_replay).toBe(true);
    expect(result.validation.lifecycle_consistency).toBe(true);
    expect(result.validation.identity_uniqueness).toBe(true);
    expect(result.validation.governance_consistency).toBe(true);
    expect(result.validation.trust_compatibility).toBe(true);
    expect(result.composition.executable_in_proving_ground).toBe(true);
    expect(result.composition.scenarios.length).toBeGreaterThan(0);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.no_production_data).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails generation readiness for %s", (failure) => {
    const result = runProvingSyntheticDataDigitalTwinGeneration({ scenario: failure });
    const validation = validateProvingSyntheticDataDigitalTwinGeneration(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without generation readiness", () => {
    const result = runProvingSyntheticDataDigitalTwinGeneration({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
