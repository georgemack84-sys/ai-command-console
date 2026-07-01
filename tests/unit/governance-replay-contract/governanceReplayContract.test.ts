import { describe, expect, it, vi } from "vitest";
import {
  appendReplayAuditLog,
  buildDeterministicReplayConfig,
  buildGovernanceReplayContract,
  buildGovernanceReplayObservabilitySurface,
  buildReplayReferenceRegistry,
  computeGovernanceReplayHash,
  generateGovernanceReplayIdentity,
  getGovernanceReplayContract,
  resolveReplayDependencies,
  validateGovernanceReplayContract,
  validateReplayAuthorization,
} from "@/services/governance-replay-contract";
import type { GovernanceReplayScenario } from "@/types/governance-replay-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7H.1 Governance Replay Contract", () => {
  it("defines replay doctrine and a certification-ready baseline contract", () => {
    const response = getGovernanceReplayContract();
    expect(response.doctrine.principles).toContain("deterministic");
    expect(response.doctrine.replay_scopes).toContain("FULL_GOVERNANCE_EXECUTION");
    expect(response.contract.replay_version).toBe("governance-replay-contract/v7H.1");
    expect(response.validation.validation_state).toBe("VALID");
    expect(response.validation.certification_ready).toBe(true);
    expect(response.observability.replay_ready).toBe(true);
  });

  it("generates immutable deterministic replay identity", () => {
    const identity = generateGovernanceReplayIdentity();
    const repeat = generateGovernanceReplayIdentity();
    expect(identity).toEqual(repeat);
    expect(identity.governance_replay_id).toMatch(/^GOV-REPLAY-/);
    expect(identity.identity_hash).toBeTruthy();
  });

  it("builds references, dependencies, deterministic config, and audit log", () => {
    const contract = buildGovernanceReplayContract();
    const registry = buildReplayReferenceRegistry(contract);
    const config = buildDeterministicReplayConfig(contract);
    const dependencies = resolveReplayDependencies(contract);
    const audited = appendReplayAuditLog(contract);
    expect(registry.all_references_resolved).toBe(true);
    expect(dependencies.every((item) => item.resolved)).toBe(true);
    expect(config.external_data_policy).toBe("PROHIBITED");
    expect(config.timestamp_source).toBe("ORIGINAL_EXECUTION_ONLY");
    expect(audited.audit_log.length).toBe(contract.audit_log.length + 1);
  });

  it("validates replay hashes, authorization, and tenant isolation", () => {
    const contract = buildGovernanceReplayContract();
    const validation = validateGovernanceReplayContract(contract);
    const authorization = validateReplayAuthorization(contract);
    expect(computeGovernanceReplayHash(contract)).toBe(contract.contract_hash);
    expect(validation.hash_valid).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(authorization.authorized).toBe(true);
  });

  it("rejects a missing contract before replay can begin", () => {
    const validation = validateGovernanceReplayContract(undefined);
    expect(validation.validation_state).toBe("INVALID");
    expect(validation.errors.map((error) => error.reason)).toContain("REPLAY_CONTRACT_MISSING");
    expect(validation.replay_ready).toBe(false);
  });

  it("detects duplicate replay identifiers through the reference registry", () => {
    const contract = buildGovernanceReplayContract();
    const registry = {
      ...buildReplayReferenceRegistry(contract),
      replay_ids: [contract.governance_replay_id, contract.governance_replay_id],
    };
    const validation = validateGovernanceReplayContract(contract, registry);
    expect(validation.validation_state).toBe("INVALID");
    expect(validation.errors.map((error) => error.reason)).toContain("DUPLICATE_REPLAY_IDENTIFIER");
  });

  it("fails closed for contract precondition and security violations", () => {
    const scenarios: readonly Exclude<GovernanceReplayScenario, "BASELINE" | "MISSING_CONTRACT" | "DUPLICATE_REPLAY_ID">[] = [
      "MISSING_EXECUTION",
      "EVIDENCE_INCOMPLETE",
      "LINEAGE_BROKEN",
      "HASH_MISMATCH",
      "TENANT_MISMATCH",
      "AUTHORITY_MISMATCH",
      "CONSTITUTIONAL_MISMATCH",
      "UNSUPPORTED_VERSION",
      "INTEGRITY_FAILURE",
      "HIDDEN_STATE",
      "NON_DETERMINISTIC_SEED",
      "UNAUTHORIZED_REQUESTOR",
      "IMMUTABLE_MUTATION",
    ];
    for (const scenario of scenarios) {
      const contract = buildGovernanceReplayContract({ scenario });
      const validation = validateGovernanceReplayContract(contract);
      expect(validation.validation_state, scenario).toBe("INVALID");
      expect(validation.errors.length, scenario).toBeGreaterThan(0);
      expect(validation.replay_ready, scenario).toBe(false);
    }
  }, 180000);

  it("exposes operator observability for replay readiness", () => {
    const surface = buildGovernanceReplayObservabilitySurface();
    expect(surface.validation_state).toBe("VALID");
    expect(surface.replay_ready).toBe(true);
    expect(surface.dependency_count).toBeGreaterThan(0);
    expect(surface.advisory_only_notice).toContain("without granting execution authority");
  });
});
