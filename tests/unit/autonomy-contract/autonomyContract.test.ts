import { describe, expect, it } from "vitest";
import {
  buildAutonomyContract,
  buildAutonomyObservabilitySurface,
  buildAutonomyRegistry,
  computeAutonomyIntegrityHash,
  getAutonomyContract,
  getAutonomyVersionPolicy,
  validateAutonomyContract,
} from "@/services/autonomy-contract";
import type { AutonomyContractScenario } from "@/types/autonomy-contract";

describe("Mission Control Phase 8A.1 Autonomy Contract", () => {
  it("builds an immutable autonomy contract with all required constitutional sections", () => {
    const contract = buildAutonomyContract();
    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.identity.version).toBe("autonomy-contract/v8A.1");
    expect(contract.governance.governance_profile).toBeTruthy();
    expect(contract.constitution.constitutional_profile).toBeTruthy();
    expect(contract.authority.operator_required).toBe(true);
    expect(contract.replay.replay_seed).toContain("stable");
    expect(contract.lineage.root_autonomy).toBe(contract.identity.autonomy_id);
  });

  it("validates a complete baseline contract", () => {
    const contract = buildAutonomyContract();
    const result = validateAutonomyContract(contract, { registry: [contract] });
    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.certification_ready).toBe(true);
    expect(result.tenant_isolated).toBe(true);
  });

  it("produces deterministic integrity hashes", () => {
    const contract = buildAutonomyContract();
    expect(computeAutonomyIntegrityHash(contract)).toBe(contract.certification.integrity_hash);
    expect(computeAutonomyIntegrityHash(contract)).toBe(computeAutonomyIntegrityHash(contract));
  });

  it.each([
    ["MISSING_MISSION", "REQUIRED_FIELD_MISSING"],
    ["UNSUPPORTED_TYPE", "UNSUPPORTED_AUTONOMY_TYPE"],
    ["INVALID_VERSION", "UNSUPPORTED_SCHEMA_VERSION"],
    ["GOVERNANCE_CONFLICT", "GOVERNANCE_CONFLICT"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION"],
    ["INVALID_LIFECYCLE", "INVALID_LIFECYCLE_STATE"],
    ["BROKEN_LINEAGE", "MISSING_LINEAGE_REFERENCE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["IMMUTABLE_MUTATION", "NON_DETERMINISTIC_REPLAY_SEED"],
  ] as readonly [AutonomyContractScenario, string][])("rejects scenario %s", (scenario, reason) => {
    const contract = buildAutonomyContract({ scenario });
    expect(validateAutonomyContract(contract, { registry: [contract] }).failures.some((item) => item.reason === reason)).toBe(true);
  });

  it("detects duplicate autonomy identifiers", () => {
    const root = buildAutonomyContract();
    const duplicate = buildAutonomyContract({ scenario: "DUPLICATE_ID", parent_contract: root });
    const result = validateAutonomyContract(duplicate, { registry: [root, duplicate] });
    expect(result.failures.some((item) => item.reason === "DUPLICATE_AUTONOMY_ID")).toBe(true);
  });

  it("detects duplicate replay references", () => {
    const root = buildAutonomyContract();
    const duplicateReplay = buildAutonomyContract({ scenario: "DUPLICATE_REPLAY_REFERENCE", parent_contract: root });
    const result = validateAutonomyContract(duplicateReplay, { registry: [root, duplicateReplay] });
    expect(result.failures.some((item) => item.reason === "DUPLICATE_REPLAY_REFERENCE")).toBe(true);
  });

  it("reconstructs parent lineage for a child contract", () => {
    const root = buildAutonomyContract();
    const child = buildAutonomyContract({ parent_contract: root });
    const result = validateAutonomyContract(child, { registry: [root, child] });
    expect(result.validation_state).toBe("PASS");
    expect(result.lineage_reconstructable).toBe(true);
    expect(child.lineage.generation).toBe(root.lineage.generation + 1);
  });

  it("rejects cross-tenant lineage", () => {
    const root = buildAutonomyContract();
    const child = buildAutonomyContract({ scenario: "CROSS_TENANT_LINEAGE", parent_contract: root });
    const result = validateAutonomyContract(child, { registry: [root, child] });
    expect(result.failures.some((item) => item.reason === "CROSS_TENANT_LINEAGE")).toBe(true);
    expect(result.tenant_isolated).toBe(false);
  });

  it("detects immutable protected field mutations", () => {
    const contract = buildAutonomyContract();
    const mutated = { ...contract, identity: { ...contract.identity, tenant_id: "tenant_beta" } };
    const result = validateAutonomyContract(mutated, { original_contract: contract, registry: [mutated] });
    expect(result.failures.some((item) => item.reason === "IMMUTABLE_FIELD_MUTATION")).toBe(true);
  });

  it("registers valid contracts and records audit trail", () => {
    const root = buildAutonomyContract();
    const child = buildAutonomyContract({ parent_contract: root });
    const registry = buildAutonomyRegistry([root, child]);
    expect(registry.contracts).toHaveLength(2);
    expect(registry.historical_versions[root.identity.autonomy_id]).toContain(child.identity.autonomy_id);
    expect(registry.audit_trail.every((entry) => entry.event_type === "REGISTERED")).toBe(true);
  });

  it("publishes version management policy", () => {
    const policy = getAutonomyVersionPolicy();
    expect(policy.current_schema_version).toBe("autonomy-contract/v8A.1");
    expect(policy.deterministic_compatibility_required).toBe(true);
  });

  it("exposes observability and aggregate contract response", () => {
    const contract = buildAutonomyContract();
    const surface = buildAutonomyObservabilitySurface(contract, [contract]);
    expect(surface.validation_state).toBe("PASS");
    expect(surface.replay_reference).toBe(contract.replay.replay_reference);
    expect(getAutonomyContract().doctrine.principles).toContain("tenant-isolated");
  });
});
