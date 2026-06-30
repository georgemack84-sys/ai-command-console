import { describe, expect, it } from "vitest";
import { buildAutonomyContract } from "@/services/autonomy-contract";
import {
  buildAutonomyIdentityObservabilitySurface,
  buildAutonomyIdentityRegistry,
  computeAutonomyIdentityHash,
  computeAutonomyIdentityIntegrityHash,
  generateAutonomyIdentity,
  getAutonomyIdentityFramework,
  getAutonomyIdentityVersionPolicy,
  reconstructAutonomyLineage,
  validateAutonomyIdentity,
} from "@/services/autonomy-identity";
import type { AutonomyIdentityScenario } from "@/types/autonomy-identity";

describe("Mission Control Phase 8A.2 Autonomy Identity", () => {
  it("generates a deterministic immutable identity record from an autonomy contract", () => {
    const contract = buildAutonomyContract();
    const identity = generateAutonomyIdentity({ contract });
    expect(Object.isFrozen(identity)).toBe(true);
    expect(identity.primary.contract_reference).toBe(contract.identity.autonomy_id);
    expect(identity.primary.version).toBe("autonomy-identity/v8A.2");
    expect(identity.primary.root_autonomy_id).toBe(identity.primary.autonomy_id);
    expect(identity.runtime.replay_reference).toBe(identity.primary.replay_reference);
    expect(identity.lineage.derivation_path).toEqual([identity.primary.autonomy_id]);
  });

  it("validates a baseline identity as certification-ready", () => {
    const identity = generateAutonomyIdentity();
    const result = validateAutonomyIdentity(identity, { registry: [identity] });
    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.globally_unique).toBe(true);
    expect(result.certification_ready).toBe(true);
  });

  it("reproduces identity hashes deterministically", () => {
    const identity = generateAutonomyIdentity();
    expect(computeAutonomyIdentityHash(identity.primary)).toBe(identity.primary.identity_hash);
    expect(computeAutonomyIdentityIntegrityHash(identity.primary)).toBe(identity.primary.integrity_hash);
  });

  it.each([
    ["MISSING_TENANT", "REQUIRED_FIELD_MISSING"],
    ["INVALID_MISSION", "MISSION_NOT_FOUND"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_IDENTITY_VERSION"],
    ["DEPRECATED_VERSION", "DEPRECATED_IDENTITY_VERSION"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE"],
    ["CIRCULAR_LINEAGE", "CIRCULAR_ANCESTRY"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_OWNERSHIP_INVALID"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [AutonomyIdentityScenario, string][])("rejects scenario %s", (scenario, reason) => {
    const identity = generateAutonomyIdentity({ scenario });
    expect(validateAutonomyIdentity(identity, { registry: [identity] }).failures.some((item) => item.reason === reason)).toBe(true);
  });

  it("detects duplicate autonomy IDs", () => {
    const root = generateAutonomyIdentity();
    const duplicate = generateAutonomyIdentity({ parent_identity: root, scenario: "DUPLICATE_AUTONOMY_ID" });
    const result = validateAutonomyIdentity(duplicate, { registry: [root, duplicate] });
    expect(result.failures.some((item) => item.reason === "DUPLICATE_AUTONOMY_ID")).toBe(true);
  });

  it("detects duplicate runtime instance IDs", () => {
    const root = generateAutonomyIdentity();
    const duplicate = generateAutonomyIdentity({ parent_identity: root, scenario: "DUPLICATE_INSTANCE_ID" });
    const result = validateAutonomyIdentity(duplicate, { registry: [root, duplicate] });
    expect(result.failures.some((item) => item.reason === "DUPLICATE_INSTANCE_ID")).toBe(true);
  });

  it("builds valid parent-child lineage", () => {
    const root = generateAutonomyIdentity();
    const child = generateAutonomyIdentity({ parent_identity: root });
    const result = validateAutonomyIdentity(child, { registry: [root, child] });
    expect(result.validation_state).toBe("PASS");
    expect(result.lineage_complete).toBe(true);
    expect(child.primary.generation).toBe(root.primary.generation + 1);
  });

  it("reconstructs ancestry and replay lineage", () => {
    const root = generateAutonomyIdentity();
    const child = generateAutonomyIdentity({ parent_identity: root });
    const lineage = reconstructAutonomyLineage(child, [root, child]);
    expect(lineage.lineage_complete).toBe(true);
    expect(lineage.parent_chain).toEqual([root.primary.autonomy_id]);
    expect(lineage.derivation_path).toEqual([root.primary.autonomy_id, child.primary.autonomy_id]);
    expect(lineage.replay_references.length).toBeGreaterThan(0);
  });

  it("rejects cross-tenant identity lineage", () => {
    const root = generateAutonomyIdentity();
    const child = generateAutonomyIdentity({ parent_identity: root, scenario: "CROSS_TENANT_IDENTITY" });
    const result = validateAutonomyIdentity(child, { registry: [root, child] });
    expect(result.failures.some((item) => item.reason === "CROSS_TENANT_IDENTITY")).toBe(true);
    expect(result.tenant_isolated).toBe(false);
  });

  it("detects immutable field mutation", () => {
    const identity = generateAutonomyIdentity();
    const mutated = { ...identity, primary: { ...identity.primary, tenant_id: "tenant_beta" } };
    const result = validateAutonomyIdentity(mutated, { original_identity: identity, registry: [mutated] });
    expect(result.failures.some((item) => item.reason === "IMMUTABLE_FIELD_MUTATION")).toBe(true);
  });

  it("stores identities in an append-only registry with audit metadata", () => {
    const root = generateAutonomyIdentity();
    const child = generateAutonomyIdentity({ parent_identity: root });
    const registry = buildAutonomyIdentityRegistry([root, child]);
    expect(registry.identities).toHaveLength(2);
    expect(registry.primary_index[root.primary.autonomy_id]).toBe(root.primary.integrity_hash);
    expect(registry.lineage_index[root.primary.root_autonomy_id]).toContain(child.primary.autonomy_id);
    expect(registry.audit_log.some((entry) => entry.event_type === "CERTIFICATION_READY")).toBe(true);
  });

  it("publishes version policy and observability", () => {
    const identity = generateAutonomyIdentity();
    const policy = getAutonomyIdentityVersionPolicy();
    const surface = buildAutonomyIdentityObservabilitySurface(identity, [identity]);
    expect(policy.current_identity_version).toBe("autonomy-identity/v8A.2");
    expect(policy.new_identity_required_for_structural_change).toBe(true);
    expect(surface.validation_state).toBe("PASS");
    expect(getAutonomyIdentityFramework().doctrine.principles).toContain("globally-unique");
  });
});
