import { describe, expect, it } from "vitest";
import { getRegistryCoreBundle, replayRegistryCore, runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import type { RegistryCoreFailure } from "@/types/registry-core";

const CONDITIONAL_FAILURES: readonly RegistryCoreFailure[] = [
  "REGISTRY_ARCHITECTURE_MISSING",
  "REGISTRY_DATA_MODEL_INVALID",
  "REGISTRY_PERSISTENCE_MISSING",
  "REGISTRY_STORAGE_UNAVAILABLE",
  "REGISTRATION_ENGINE_MISSING",
  "SERVICE_REGISTRATION_FAILED",
  "CONTRACT_REGISTRATION_FAILED",
  "DEPENDENCY_REGISTRATION_FAILED",
  "OWNERSHIP_REGISTRATION_FAILED",
  "QUERY_ENGINE_MISSING",
  "DETERMINISTIC_LOOKUP_FAILED",
  "OWNERSHIP_REGISTRY_MISSING",
  "AUTHORITY_RECORDS_MISSING",
  "DEPENDENCY_REGISTRY_MISSING",
  "DEPENDENCY_GRAPH_INVALID",
  "DEPENDENCY_CYCLE_UNCONTROLLED",
  "CONTRACT_REGISTRY_MISSING",
  "CONTRACT_VALIDATION_FAILED",
  "REGISTRY_MESSAGING_MISSING",
  "REGISTRATION_EVENTS_NOT_PUBLISHED",
  "REGISTRY_SECURITY_MISSING",
  "REGISTRY_AUTHENTICATION_FAILED",
  "REGISTRY_EVIDENCE_MISSING",
  "REGISTRATION_LINEAGE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly RegistryCoreFailure[] = [
  "W1_1A_IDENTITY_CORE_INVALID",
  "W1_2A_STORAGE_CORE_INVALID",
  "W1_3A_MESSAGING_CORE_INVALID",
  "SECURITY_CORE_INVALID",
  "QUERY_NON_DETERMINISTIC",
  "REGISTRY_AUTHORIZATION_FAILED",
  "REGISTRY_ACCESS_POLICY_VIOLATED",
  "REGISTRY_EVIDENCE_NOT_IMMUTABLE",
  "REGISTRY_REPLAY_INVALID",
];

describe("W1.4A Registry Core", () => {
  it("publishes registry-core doctrine and validates baseline", () => {
    const bundle = getRegistryCoreBundle();

    expect(bundle.doctrine.version).toBe("registry-core/w1.4a");
    expect(bundle.doctrine.owns_registry_engine).toBe(true);
    expect(bundle.doctrine.owns_service_registration).toBe(true);
    expect(bundle.doctrine.owns_contract_registration).toBe(true);
    expect(bundle.doctrine.owns_dependency_registration).toBe(true);
    expect(bundle.doctrine.owns_ownership_registry).toBe(true);
    expect(bundle.doctrine.owns_query_engine).toBe(true);
    expect(bundle.doctrine.owns_registry_messaging).toBe(true);
    expect(bundle.doctrine.owns_registry_evidence).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic registry activation with W1 predecessor references", () => {
    const first = runRegistryCore();
    const second = runRegistryCore();

    expect(first.phase_identifier).toBe("RegistryCore");
    expect(first.identity_core_ref).toBe("identity-core/w1.1a");
    expect(first.storage_core_ref).toBe("storage-core/w1.2a");
    expect(first.messaging_core_ref).toBe("messaging-core/w1.3a");
    expect(first.evidence.records).toHaveLength(6);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRegistryCore(first).valid).toBe(true);
    expect(replayRegistryCore(first)).toBe(true);
  });

  it("provides registration, deterministic query, ownership, dependency, and contract services", () => {
    const result = runRegistryCore();

    expect(result.registration_engine.service_registration).toBe(true);
    expect(result.registration_engine.contract_registration).toBe(true);
    expect(result.registration_engine.dependency_registration).toBe(true);
    expect(result.registration_engine.ownership_registration).toBe(true);
    expect(result.query_engine.deterministic_lookup).toBe(true);
    expect(result.query_engine.stable_sorting).toBe(true);
    expect(result.ownership_registry.authority_records).toBe(true);
    expect(result.dependency_registry.dependency_graph).toBe(true);
    expect(result.dependency_registry.cycle_controls).toBe(true);
    expect(result.contract_registry.version_registry).toBe(true);
    expect(result.contract_registry.contract_validation).toBe(true);
  });

  it("persists registry state, publishes registry events, and produces immutable evidence", () => {
    const result = runRegistryCore();

    expect(result.persistence.registry_database).toBe(true);
    expect(result.persistence.durable_state).toBe(true);
    expect(result.persistence.integrity_hashing).toBe(true);
    expect(result.registry_messaging.service_registered_events).toBe(true);
    expect(result.registry_messaging.contract_registered_events).toBe(true);
    expect(result.registry_messaging.dependency_registered_events).toBe(true);
    expect(result.registry_messaging.ownership_changed_events).toBe(true);
    expect(result.security.authentication).toBe(true);
    expect(result.security.authorization).toBe(true);
    expect(result.evidence.registration_history).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replay_validated).toBe(true);
  });

  it("activates Registry Core readiness", () => {
    const result = runRegistryCore();

    expect(result.readiness.decision).toBe("CORE_ACTIVATED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.identity_ready).toBe(true);
    expect(result.readiness.storage_ready).toBe(true);
    expect(result.readiness.messaging_ready).toBe(true);
    expect(result.readiness.security_ready).toBe(true);
    expect(result.readiness.evidence_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks registry core conditionally active for remediable deficiency %s", (failure) => {
    const result = runRegistryCore({ scenario: failure });
    const validation = validateRegistryCore(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks registry core not active for activation failure", () => {
    const result = runRegistryCore({ scenario: "CORE_ACTIVATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_ACTIVE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateRegistryCore(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical registry defect %s", (failure) => {
    const result = runRegistryCore({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateRegistryCore(result).valid).toBe(false);
  });

  it("supports active with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runRegistryCore({ scenario: "ACTIVE_WITH_OBSERVATIONS" });
    const conditional = runRegistryCore({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("ACTIVE_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateRegistryCore(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
