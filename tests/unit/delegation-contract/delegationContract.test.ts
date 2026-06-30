import { describe, expect, it } from "vitest";
import {
  buildDelegationContract,
  buildDelegationObservabilitySurface,
  buildDelegationRegistry,
  computeDelegationIntegrityHash,
  generateDelegationIdentity,
  getDelegationContractFramework,
  getDelegationVersionPolicy,
  replayDelegationContract,
  validateDelegationContract,
} from "@/services/delegation-contract";
import type { DelegationContractScenario, DelegationFailureReason } from "@/types/delegation-contract";

describe("Mission Control Phase 8D.1 Delegation Contract", () => {
  it("builds an immutable delegation contract with canonical sections", () => {
    const contract = buildDelegationContract();

    expect(Object.isFrozen(contract)).toBe(true);
    expect(contract.versioning.contract_version).toBe("delegation-contract/v8D.1");
    expect(contract.identity.delegation_id).toMatch(/^DEL-/);
    expect(contract.identity.task_id).toBeTruthy();
    expect(contract.target.delegate_type).toBe("AUTONOMY_ENGINE");
    expect(contract.authority.governing_policy).toBeTruthy();
    expect(contract.metadata.replay_reference).toBeTruthy();
    expect(contract.metadata.lineage_reference).toBeTruthy();
    expect(contract.lifecycle.current_state).toBe("READY");
  });

  it("validates a complete baseline delegation contract", () => {
    const contract = buildDelegationContract();
    const result = validateDelegationContract(contract, { registry: [contract] });

    expect(result.validation_state).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.identity_valid).toBe(true);
    expect(result.target_valid).toBe(true);
    expect(result.authority_valid).toBe(true);
    expect(result.ready_for_task_classification).toBe(true);
  });

  it("generates deterministic delegation identities and integrity hashes", () => {
    const input = {
      tenant_id: "tenant_alpha",
      mission_id: "mission_controlled_autonomy",
      task_id: "task:stable",
      execution_plan_id: "plan:stable",
      delegate_type: "AUTONOMY_ENGINE" as const,
    };
    const first = generateDelegationIdentity(input);
    const second = generateDelegationIdentity(input);
    const contract = buildDelegationContract();

    expect(second).toEqual(first);
    expect(computeDelegationIntegrityHash(contract)).toBe(contract.integrity_hash);
    expect(computeDelegationIntegrityHash(contract)).toBe(computeDelegationIntegrityHash(contract));
  });

  it("replays delegation reconstruction deterministically", () => {
    const contract = buildDelegationContract();
    const replay = replayDelegationContract(contract);

    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_identity).toEqual(contract.identity);
    expect(replay.reconstructed_target).toEqual(contract.target);
    expect(replay.reconstructed_state_order).toEqual(["CREATED", "VALIDATED", "AUTHORIZED", "READY"]);
    expect(replay.replay_hash).toBe(replayDelegationContract(contract).replay_hash);
  });

  it.each([
    ["MISSING_TASK", "MISSING_TASK_ID"],
    ["INVALID_PLAN", "INVALID_EXECUTION_PLAN_REFERENCE"],
    ["UNSUPPORTED_TARGET", "UNSUPPORTED_DELEGATE_TYPE"],
    ["UNKNOWN_DELEGATE", "UNKNOWN_DELEGATE"],
    ["SUSPENDED_DELEGATE", "SUSPENDED_DELEGATE"],
    ["UNCERTIFIED_DELEGATE", "UNCERTIFIED_DELEGATE"],
    ["MISSING_AUTHORITY", "MISSING_AUTHORITY"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["POLICY_VIOLATION", "POLICY_VIOLATION"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH"],
    ["REPLAY_CORRUPTION", "REPLAY_REFERENCE_CORRUPTION"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION"],
    ["INVALID_CONFIDENCE", "INVALID_CONFIDENCE"],
    ["INVALID_GOVERNANCE_SCORE", "INVALID_GOVERNANCE_SCORE"],
    ["INVALID_PRIORITY", "INVALID_PRIORITY"],
    ["INVALID_TRANSITION", "INVALID_LIFECYCLE_TRANSITION"],
    ["INCOMPLETE_METADATA", "INCOMPLETE_METADATA"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_SCHEMA_VERSION"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [DelegationContractScenario, DelegationFailureReason][])("rejects scenario %s", (scenario, reason) => {
    const contract = buildDelegationContract({ scenario });
    const result = validateDelegationContract(contract, { registry: [contract] });

    expect(result.validation_state).toBe("FAIL");
    expect(result.failures.some((item) => item.reason === reason)).toBe(true);
    expect(result.ready_for_task_classification).toBe(false);
  });

  it("detects duplicate delegation identifiers", () => {
    const root = buildDelegationContract();
    const duplicate = buildDelegationContract({ scenario: "DUPLICATE_ID", parent_contract: root });
    const result = validateDelegationContract(duplicate, { registry: [root, duplicate] });

    expect(result.failures.some((item) => item.reason === "DUPLICATE_DELEGATION_ID")).toBe(true);
  });

  it("detects immutable protected field mutations", () => {
    const contract = buildDelegationContract();
    const mutated = {
      ...contract,
      identity: { ...contract.identity, task_id: "task:mutated" },
    };
    const result = validateDelegationContract(mutated, { original_contract: contract, registry: [mutated] });

    expect(result.failures.some((item) => item.reason === "IMMUTABLE_FIELD_MUTATION")).toBe(true);
    expect(result.integrity_verified).toBe(false);
  });

  it("registers valid delegations and records validation failures", () => {
    const valid = buildDelegationContract();
    const invalid = buildDelegationContract({ scenario: "UNKNOWN_DELEGATE" });
    const registry = buildDelegationRegistry([valid, invalid]);

    expect(registry.active_delegations).toContain(valid.identity.delegation_id);
    expect(registry.active_delegations).not.toContain(invalid.identity.delegation_id);
    expect(registry.audit_trail.some((entry) => entry.event_type === "REGISTERED")).toBe(true);
    expect(registry.audit_trail.some((entry) => entry.event_type === "VALIDATION_FAILED")).toBe(true);
  });

  it("publishes schema versioning policy", () => {
    const policy = getDelegationVersionPolicy();

    expect(policy.current_contract_version).toBe("delegation-contract/v8D.1");
    expect(policy.current_schema_version).toBe("delegation-schema/v8D.1");
    expect(policy.deterministic_compatibility_required).toBe(true);
  });

  it("exposes observability and aggregate framework response", () => {
    const contract = buildDelegationContract();
    const surface = buildDelegationObservabilitySurface(contract, [contract]);
    const framework = getDelegationContractFramework();

    expect(surface.validation_state).toBe("PASS");
    expect(surface.integrity_status).toBe("VALID");
    expect(surface.replay_reference).toBe(contract.metadata.replay_reference);
    expect(framework.doctrine.principles).toContain("governance-controlled");
    expect(framework.validation.validation_state).toBe("PASS");
  });
});
