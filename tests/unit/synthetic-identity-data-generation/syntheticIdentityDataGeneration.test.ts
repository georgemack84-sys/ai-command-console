import { describe, expect, it } from "vitest";
import {
  getSyntheticIdentityDataGenerationBundle,
  replaySyntheticIdentityDataGeneration,
  runSyntheticIdentityDataGeneration,
  validateSyntheticIdentityDataGeneration,
} from "@/services/synthetic-identity-data-generation";
import type { SyntheticGenerationFailure } from "@/types/synthetic-identity-data-generation";

describe("Mission Control Phase 14.3 Synthetic Identity & Data Generation", () => {
  it("publishes the generation doctrine", () => {
    const bundle = getSyntheticIdentityDataGenerationBundle();

    expect(bundle.doctrine.version).toBe("synthetic-identity-data-generation/v14.3");
    expect(bundle.doctrine.foundation_phase).toBe("synthetic-validation-foundation/v14.1");
    expect(bundle.doctrine.environment_phase).toBe("synthetic-environment-architecture/v14.2");
    expect(bundle.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(bundle.doctrine.replay_divergence_categories).toEqual(["INPUT_DIVERGENCE", "SEED_DIVERGENCE", "SCHEMA_DIVERGENCE", "VERSION_DIVERGENCE", "OUTPUT_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the synthetic identity contract and lifecycle", () => {
    const result = runSyntheticIdentityDataGeneration();

    expect(result.contract.lifecycle).toEqual(["DEFINED", "GENERATED", "QUALIFIED", "REGISTERED", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);
    expect(result.contract.deterministic_generation_required).toBe(true);
    expect(result.contract.immutable_provenance_required).toBe(true);
    expect(result.contract.replay_required).toBe(true);
    expect(result.contract.production_separation_required).toBe(true);
    expect(result.contract.governance_required).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
  });

  it("generates deterministic synthetic identities", () => {
    const result = runSyntheticIdentityDataGeneration({ tenant_id: "tenant_alpha", generation_seed: "seed:alpha" });

    expect(result.identities).toHaveLength(4);
    expect(result.identities.every((identity) => identity.tenant_id === "tenant_alpha" && identity.lifecycle_state === "ACTIVE")).toBe(true);
    expect(new Set(result.identities.map((identity) => identity.deterministic_identifier)).size).toBe(result.identities.length);
    expect(result.identities.every((identity) => identity.origin_reference && identity.lineage_reference && identity.replay_reference)).toBe(true);
  });

  it("generates deterministic synthetic datasets", () => {
    const result = runSyntheticIdentityDataGeneration({ dataset_record_count: 200 });

    expect(result.datasets).toHaveLength(3);
    expect(result.datasets.map((dataset) => dataset.dataset_type)).toEqual(["MISSION", "GOVERNANCE", "TELEMETRY"]);
    expect(result.datasets.every((dataset) => dataset.dataset_version === "dataset/v14.3.0" && dataset.schema_version === "schema/v14.3.0")).toBe(true);
    expect(result.datasets.map((dataset) => dataset.record_count)).toEqual([200, 201, 202]);
  });

  it("preserves canonical origins and provenance", () => {
    const result = runSyntheticIdentityDataGeneration();

    expect(result.origins).toHaveLength(result.identities.length + result.datasets.length);
    expect(result.origins.every((origin) => origin.origin_id && origin.lineage_reference && origin.governing_policy_reference)).toBe(true);
    expect(result.provenance_ledger).toHaveLength(7);
    expect(result.provenance_ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable)).toBe(true);
  });

  it("validates integrity for every generated artifact", () => {
    const result = runSyntheticIdentityDataGeneration();

    expect(result.integrity_records.length).toBe(result.identities.length + result.datasets.length + result.origins.length);
    expect(result.integrity_records.every((record) => record.validation_result === "VALID")).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runSyntheticIdentityDataGeneration();
    const second = runSyntheticIdentityDataGeneration();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSyntheticIdentityDataGeneration(first).valid).toBe(true);
    expect(replaySyntheticIdentityDataGeneration(first)).toBe(true);
  });

  it("enforces governance, isolation, and production separation", () => {
    const result = runSyntheticIdentityDataGeneration();

    expect(result.governance.tenant_isolation_enforced).toBe(true);
    expect(result.governance.environment_isolation_enforced).toBe(true);
    expect(result.governance.governance_compliant).toBe(true);
    expect(result.governance.production_contamination_prevented).toBe(true);
    expect(result.governance.production_impersonation_prevented).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runSyntheticIdentityDataGeneration();

    expect(result.certification_tests).toHaveLength(19);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Synthetic Identity Contract valid",
      "Identity lifecycle deterministic",
      "Identity generation reproducible",
      "Synthetic Dataset generation deterministic",
      "Origin Registry complete",
      "Canonical origin enforced",
      "Origin lineage immutable",
      "Integrity validation successful",
      "Schema validation successful",
      "Replay regeneration identical",
      "Replay divergence detection operational",
      "Unexplained divergence rejected",
      "Provenance graph complete",
      "Tenant isolation enforced",
      "Production contamination prevented",
      "Governance compliance enforced",
      "Explainability complete",
      "Immutable audit preserved",
      "Observability operational",
    ]);
  });

  it("supports conditional pass for non-constitutional metadata warnings", () => {
    const result = runSyntheticIdentityDataGeneration({ scenario: "NON_CONSTITUTIONAL_METADATA_WARNING" });
    const validation = validateSyntheticIdentityDataGeneration(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "IDENTITY_CONTRACT_INVALID",
    "IDENTITY_LIFECYCLE_INVALID",
    "IDENTITY_GENERATION_NON_DETERMINISTIC",
    "DATASET_GENERATION_NON_DETERMINISTIC",
    "ORIGIN_REGISTRY_INCOMPLETE",
    "CANONICAL_ORIGIN_VIOLATION",
    "ORIGIN_LINEAGE_MUTABLE",
    "INTEGRITY_VALIDATION_FAILED",
    "SCHEMA_VALIDATION_FAILED",
    "REPLAY_REGENERATION_MISMATCH",
    "REPLAY_DIVERGENCE_UNDETECTED",
    "UNEXPLAINED_DIVERGENCE_ACCEPTED",
    "PROVENANCE_GRAPH_INCOMPLETE",
    "TENANT_ISOLATION_BREACH",
    "PRODUCTION_CONTAMINATION",
    "GOVERNANCE_NON_COMPLIANT",
    "EXPLAINABILITY_INCOMPLETE",
    "AUDIT_MUTABLE",
    "OBSERVABILITY_UNAVAILABLE",
  ] as const)("fails certification for %s", (scenario: SyntheticGenerationFailure) => {
    const result = runSyntheticIdentityDataGeneration({ scenario });
    const validation = validateSyntheticIdentityDataGeneration(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested identity tampering", () => {
    const result = runSyntheticIdentityDataGeneration();
    const tampered = {
      ...result,
      identities: [
        {
          ...result.identities[0],
          identity_name: "production-looking identity",
        },
        ...result.identities.slice(1),
      ],
    };

    expect(validateSyntheticIdentityDataGeneration(tampered).valid).toBe(false);
  });
});
