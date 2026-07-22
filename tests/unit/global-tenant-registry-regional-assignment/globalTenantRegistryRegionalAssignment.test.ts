import { describe, expect, it } from "vitest";
import {
  getGlobalTenantRegistryRegionalAssignmentBundle,
  replayGlobalTenantRegistryRegionalAssignment,
  runGlobalTenantRegistryRegionalAssignment,
  validateGlobalTenantRegistryRegionalAssignment,
} from "@/services/global-tenant-registry-regional-assignment";
import type { GlobalTenantRegistryRegionalAssignmentFailure } from "@/types/global-tenant-registry-regional-assignment";

describe("Mission Control Phase 17.3 Global Tenant Registry & Regional Assignment", () => {
  it("publishes global tenant registry assignment doctrine", () => {
    const bundle = getGlobalTenantRegistryRegionalAssignmentBundle();

    expect(bundle.doctrine.version).toBe("global-tenant-registry-regional-assignment/v17.3");
    expect(bundle.doctrine.upstream_phase).toBe("tenant-provisioning-lifecycle/v17.2");
    expect(bundle.doctrine.assignment_lifecycle_states).toEqual(["REQUESTED", "VALIDATING", "AUTHORIZED", "COMPARE_AND_SET", "COMMITTED", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);
    expect(bundle.doctrine.mutation_outcomes).toHaveLength(5);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates authoritative global and regional registries", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.global_registry.authoritative).toBe(true);
    expect(result.global_registry.deterministic).toBe(true);
    expect(result.global_registry.tenant_records).toHaveLength(1);
    expect(result.regional_assignment_registry.single_source_of_truth).toBe(true);
    expect(result.regional_assignment_registry.immutable_history).toBe(true);
  });

  it("validates the normative mutation envelope", () => {
    const result = runGlobalTenantRegistryRegionalAssignment({ target_region: "eu-central-1" });

    expect(result.mutation_envelope.proposed_assignment).toBe("eu-central-1");
    expect(result.mutation_envelope.tenant_id).toBeTruthy();
    expect(result.mutation_envelope.expected_registry_version).toBe("17.3.0");
    expect(result.mutation_validation.envelope_complete).toBe(true);
    expect(result.mutation_validation.outcome).toBe("ASSIGNMENT_COMMITTED");
  });

  it("enforces compare-and-set conflict resolution without timing precedence", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.conflict_resolver.validates_registry_version).toBe(true);
    expect(result.conflict_resolver.rejects_stale_proposals).toBe(true);
    expect(result.conflict_resolver.prohibits_last_writer_wins).toBe(true);
    expect(result.conflict_resolver.ignores_timestamp_ordering).toBe(true);
    expect(result.integrity_validator.timestamp_metadata_only).toBe(true);
  });

  it("validates assignment authority before mutation", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.authority_validation.governance_authorization).toBe(true);
    expect(result.authority_validation.certification_authority).toBe(true);
    expect(result.authority_validation.precedes_registry_mutation).toBe(true);
    expect(result.mutation_validation.requester_authorized).toBe(true);
  });

  it("records immutable assignment lineage and ledger", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.assignment_ledger).toHaveLength(8);
    expect(result.assignment_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_ref.length > 0)).toBe(true);
    expect(result.regional_assignment_registry.assignment_lineage.length).toBeGreaterThan(0);
  });

  it("replays registry evolution to identical state", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.replay_service.reconstructs_registry_creation).toBe(true);
    expect(result.replay_service.reconstructs_compare_and_set_decisions).toBe(true);
    expect(result.replay_service.reproduces_identical_registry_state).toBe(true);
  });

  it("publishes audit visibility and certification package", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.dashboard.operational).toBe(true);
    expect(result.dashboard.stale_proposal_frequency_visible).toBe(true);
    expect(result.certification_package.registry_certified).toBe(true);
    expect(result.certification_package.overwrite_prevention).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runGlobalTenantRegistryRegionalAssignment();
    const second = runGlobalTenantRegistryRegionalAssignment();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateGlobalTenantRegistryRegionalAssignment(first).valid).toBe(true);
    expect(replayGlobalTenantRegistryRegionalAssignment(first)).toBe(true);
  });

  it("executes the Phase 17.3 registry certification matrix", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();

    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional registry warnings", () => {
    const result = runGlobalTenantRegistryRegionalAssignment({ scenario: "NON_CONSTITUTIONAL_REGISTRY_WARNING" });
    const validation = validateGlobalTenantRegistryRegionalAssignment(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.registry_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("rejects stale assignment proposals", () => {
    const result = runGlobalTenantRegistryRegionalAssignment({ scenario: "STALE_PROPOSALS_NOT_REJECTED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.mutation_validation.outcome).toBe("STALE_ASSIGNMENT_PROPOSAL");
    expect(result.failures).toContain("STALE_PROPOSALS_NOT_REJECTED");
  });

  it.each([
    "REGISTRY_NOT_DETERMINISTIC",
    "COMPARE_AND_SET_NOT_ENFORCED",
    "STALE_PROPOSALS_NOT_REJECTED",
    "SILENT_OVERWRITE_POSSIBLE",
    "IMMUTABLE_ASSIGNMENT_AUDIT_INCOMPLETE",
    "REPLAY_NOT_PRESERVED",
    "REGISTRY_NOT_CERTIFIED",
    "GLOBAL_REGISTRY_NOT_AUTHORITATIVE",
    "ASSIGNMENT_AUTHORITY_NOT_VALIDATED",
    "ASSIGNMENT_INTEGRITY_NOT_VERIFIED",
    "TIMESTAMP_USED_FOR_PRECEDENCE",
    "MUTATION_ENVELOPE_INCOMPLETE",
    "PHASE_17_2_LIFECYCLE_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: GlobalTenantRegistryRegionalAssignmentFailure) => {
    const result = runGlobalTenantRegistryRegionalAssignment({ scenario });
    const validation = validateGlobalTenantRegistryRegionalAssignment(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested registry record tampering", () => {
    const result = runGlobalTenantRegistryRegionalAssignment();
    const tampered = {
      ...result,
      global_registry: {
        ...result.global_registry,
        authoritative: false,
      },
    };

    expect(validateGlobalTenantRegistryRegionalAssignment(tampered).valid).toBe(false);
  });
});
