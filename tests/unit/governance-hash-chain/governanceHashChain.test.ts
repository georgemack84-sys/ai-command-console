import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceHashChain,
  buildGovernanceHashChainObservabilitySurface,
  canonicalizeGovernanceArtifact,
  classifyGovernanceHashChainFailure,
  generateGovernanceArtifactHash,
  getGovernanceHashChainContract,
  validateGovernanceHashChain,
} from "@/services/governance-hash-chain";
import type { GovernanceHashChainFailureReason, GovernanceHashChainScenario } from "@/types/governance-hash-chain";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";

vi.setConfig({ testTimeout: 15000 });

describe("Mission Control Phase 7I.2 Governance Hash Chain Engine", () => {
  it("defines the governance hash-chain doctrine and version registry", () => {
    const contract = getGovernanceHashChainContract();

    expect(contract.doctrine.schema_version).toBe("governance-hash-chain-engine/v7I.2");
    expect(contract.doctrine.chain_version).toBe("governance-hash-chain/v7I.2");
    expect(contract.doctrine.serializer_version).toBe("governance-canonical-serializer/v7I.2");
    expect(contract.doctrine.hash_algorithm).toBe("SHA-256");
    expect(contract.doctrine.principles).toContain("canonical-serialization-before-hashing");
    expect(contract.doctrine.principles).toContain("fail-closed-validation");
  });

  it("serializes artifacts canonically and hashes them deterministically", () => {
    const left = canonicalizeGovernanceArtifact({ b: 2, a: 1 });
    const right = canonicalizeGovernanceArtifact({ a: 1, b: 2 });

    expect(left.canonical_payload).toBe(right.canonical_payload);
    expect(left.canonical_hash).toBe(right.canonical_hash);
    expect(generateGovernanceArtifactHash(left)).toEqual(generateGovernanceArtifactHash(right));
  });

  it("builds an immutable governance chain with sequential previous-hash linkage", () => {
    const execution = buildGovernanceHashChain();

    expect(execution.phase_version).toBe("7I.2");
    expect(execution.records).toHaveLength(7);
    expect(execution.records[0].previous_hash).toBeNull();
    expect(execution.root_hash).toBe(execution.records[0].current_hash);
    execution.records.slice(1).forEach((record, index) => {
      expect(record.previous_hash).toBe(execution.records[index].current_hash);
      expect(record.root_hash).toBe(execution.root_hash);
      expect(record.chain_position).toBe(index + 1);
    });
    expect(execution.validation.validation_state).toBe("VALID");
  });

  it("preserves lineage, replay, and Truth Ledger references in the hash chain", () => {
    const execution = buildGovernanceHashChain();

    expect(execution.lineage_graph.ancestry_record_ids).toHaveLength(execution.records.length);
    expect(execution.lineage_graph.lineage_edges).toHaveLength(execution.records.length - 1);
    expect(execution.lineage_graph.lineage_hash).toBeTruthy();
    expect(execution.replay_chain.replay_chain_hash).toBeTruthy();
    expect(execution.replay_chain.truth_ledger_reference).toMatch(/^truth-ledger:/);
    expect(execution.ledger_entries).toHaveLength(execution.records.length);
    expect(execution.ledger_entries.every((entry) => entry.append_only)).toBe(true);
  });

  it("reconstructs identical chains across executions", () => {
    const first = buildGovernanceHashChain();
    const second = buildGovernanceHashChain();

    expect(first.root_hash).toBe(second.root_hash);
    expect(first.chain_execution_hash).toBe(second.chain_execution_hash);
    expect(first.records.map((record) => record.current_hash)).toEqual(second.records.map((record) => record.current_hash));
  });

  it.each([
    ["CANONICAL_SERIALIZATION_MISMATCH", "CANONICAL_SERIALIZATION_MISMATCH", "CORRUPTED"],
    ["CONTENT_HASH_MISMATCH", "CONTENT_HASH_MISMATCH", "CORRUPTED"],
    ["PREVIOUS_HASH_MISMATCH", "PREVIOUS_HASH_MISMATCH", "CORRUPTED"],
    ["ROOT_HASH_MISMATCH", "ROOT_HASH_MISMATCH", "CORRUPTED"],
    ["MISSING_CHAIN_RECORD", "MISSING_CHAIN_RECORD", "CORRUPTED"],
    ["DUPLICATE_CHAIN_POSITION", "DUPLICATE_CHAIN_POSITION", "CORRUPTED"],
    ["REORDERED_CHAIN", "REORDERED_CHAIN", "CORRUPTED"],
    ["REPLAY_HASH_MISMATCH", "REPLAY_HASH_MISMATCH", "CORRUPTED"],
    ["UNSUPPORTED_HASH_ALGORITHM", "UNSUPPORTED_HASH_ALGORITHM", "DEGRADED"],
    ["MISSING_LINEAGE_REFERENCE", "MISSING_LINEAGE_REFERENCE", "DEGRADED"],
    ["LEDGER_PERSISTENCE_DELAY", "LEDGER_PERSISTENCE_DELAY", "DEGRADED"],
    ["CROSS_TENANT_LINKAGE", "CROSS_TENANT_LINKAGE", "CORRUPTED"],
  ] as readonly [GovernanceHashChainScenario, GovernanceHashChainFailureReason, GovernanceIntegrityState][])(
    "maps %s to %s fail-closed validation",
    (scenario, reason, expectedState) => {
      const validation = validateGovernanceHashChain({ scenario });

      expect(classifyGovernanceHashChainFailure(reason)).toBe(expectedState);
      expect(validation.validation_state).toBe(expectedState);
      expect(validation.failures.map((failure) => failure.reason)).toContain(reason);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes operator visibility into chain health", () => {
    const surface = buildGovernanceHashChainObservabilitySurface({ scenario: "LEDGER_PERSISTENCE_DELAY" });

    expect(surface.validation_state).toBe("DEGRADED");
    expect(surface.failures).toContain("LEDGER_PERSISTENCE_DELAY");
    expect(surface.root_hash).toBeTruthy();
    expect(surface.latest_hash).toBeTruthy();
    expect(surface.replay_chain_hash).toBeTruthy();
    expect(surface.lineage_hash).toBeTruthy();
    expect(surface.advisory_only_notice).toContain("does not grant autonomous execution authority");
  });
});
