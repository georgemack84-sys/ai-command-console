import { describe, expect, it, vi } from "vitest";
import {
  appendAutonomousHashChainNode,
  buildAutonomousHashChain,
  buildAutonomousHashChainObservabilitySurface,
  canonicalizeAutonomousHashArtifact,
  classifyAutonomousHashChainFailure,
  getAutonomousHashChainContract,
  validateAutonomousHashChain,
} from "@/services/autonomous-hash-chain-engine";
import type { IntegrityState } from "@/types/integrity-contract";
import type { AutonomousHashChainFailureReason, AutonomousHashChainScenario } from "@/types/autonomous-hash-chain-engine";

vi.setConfig({ testTimeout: 15000 });

describe("Mission Control Phase 8H.2 Autonomous Hash Chain Engine", () => {
  it("defines the autonomous hash-chain doctrine and version registry", () => {
    const contract = getAutonomousHashChainContract();

    expect(contract.doctrine.schema_version).toBe("autonomous-hash-chain-engine/v8H.2");
    expect(contract.doctrine.node_schema_version).toBe("autonomous-hash-chain-node/v8H.2");
    expect(contract.doctrine.chain_version).toBe("autonomous-hash-chain/v8H.2");
    expect(contract.doctrine.serializer_version).toBe("autonomous-hash-canonical-serializer/v8H.2");
    expect(contract.doctrine.hash_algorithm).toBe("SHA-256");
    expect(contract.doctrine.principles).toContain("append-only-chain-construction");
    expect(contract.doctrine.principles).toContain("fail-closed-chain-validation");
  });

  it("canonicalizes autonomous artifacts deterministically before hashing", () => {
    const left = canonicalizeAutonomousHashArtifact({ b: 2, a: 1 });
    const right = canonicalizeAutonomousHashArtifact({ a: 1, b: 2 });

    expect(left.canonical_payload).toBe(right.canonical_payload);
    expect(left.canonical_hash).toBe(right.canonical_hash);
    expect(left.deterministic).toBe(true);
  });

  it("builds the canonical planning-to-certification hash chain", () => {
    const execution = buildAutonomousHashChain();

    expect(execution.phase_version).toBe("8H.2");
    expect(execution.nodes.map((node) => node.artifact_type)).toEqual([
      "PLANNING_RECORD",
      "DECISION_RECORD",
      "DELEGATION_RECORD",
      "EXECUTION_RECORD",
      "ORCHESTRATION_RECORD",
      "SUPERVISION_RECORD",
      "INTERVENTION_RECORD",
      "REPLAY_RECORD",
      "CERTIFICATION_RECORD",
    ]);
    expect(execution.nodes[0].parent_hash).toBe("GENESIS");
    expect(execution.genesis_hash).toBe(execution.nodes[0].current_hash);
    expect(execution.terminal_hash).toBe(execution.nodes[execution.nodes.length - 1].current_hash);
    execution.nodes.slice(1).forEach((node, index) => {
      expect(node.parent_hash).toBe(execution.nodes[index].current_hash);
      expect(node.parent_artifact.parent_artifact_id).toBe(execution.nodes[index].artifact_id);
      expect(node.sequence_number).toBe(index + 1);
    });
    expect(execution.validation.valid).toBe(true);
    expect(execution.validation.chain_state).toBe("CERTIFIED");
  });

  it("preserves replay, lineage, governance, constitutional, and ledger evidence", () => {
    const execution = buildAutonomousHashChain();

    expect(execution.lineage_graph.ancestry_hash_ids).toHaveLength(execution.nodes.length);
    expect(execution.lineage_graph.lineage_edges).toHaveLength(execution.nodes.length - 1);
    expect(execution.lineage_graph.lineage_hash).toBeTruthy();
    expect(execution.replay_evidence.deterministic_replay).toBe(true);
    expect(execution.replay_evidence.replay_chain_hash).toBeTruthy();
    expect(execution.ledger_entries).toHaveLength(execution.nodes.length);
    expect(execution.ledger_entries.every((entry) => entry.append_only)).toBe(true);
    expect(execution.nodes.every((node) => node.governance_reference && node.constitutional_reference)).toBe(true);
  });

  it("reconstructs identical chains across deterministic runs", () => {
    const first = buildAutonomousHashChain();
    const second = buildAutonomousHashChain();

    expect(first.genesis_hash).toBe(second.genesis_hash);
    expect(first.terminal_hash).toBe(second.terminal_hash);
    expect(first.certification_evidence_hash).toBe(second.certification_evidence_hash);
    expect(first.nodes.map((node) => node.current_hash)).toEqual(second.nodes.map((node) => node.current_hash));
  });

  it("appends new nodes without rewriting prior chain history", () => {
    const execution = buildAutonomousHashChain();
    const appended = appendAutonomousHashChainNode(execution, "EXECUTION_RECORD", "execution-followup-001");

    expect(appended.nodes).toHaveLength(execution.nodes.length + 1);
    expect(appended.nodes.slice(0, execution.nodes.length).map((node) => node.current_hash)).toEqual(execution.nodes.map((node) => node.current_hash));
    expect(appended.nodes[appended.nodes.length - 1].parent_hash).toBe(execution.terminal_hash);
    expect(appended.validation.valid).toBe(true);
  });

  it.each([
    ["INVALID_HASH", "INVALID_HASH", "CORRUPTED"],
    ["BROKEN_PARENT_LINK", "BROKEN_PARENT_LINK", "CORRUPTED"],
    ["MISSING_PARENT", "MISSING_PARENT", "CORRUPTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH", "CORRUPTED"],
    ["NONDETERMINISTIC_ORDERING", "NONDETERMINISTIC_ORDERING", "CORRUPTED"],
    ["ORPHAN_NODE", "ORPHAN_NODE", "CORRUPTED"],
    ["UNAUTHORIZED_CHAIN_MODIFICATION", "UNAUTHORIZED_CHAIN_MODIFICATION", "CORRUPTED"],
    ["CROSS_TENANT_LINKAGE", "CROSS_TENANT_LINKAGE", "CORRUPTED"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION", "CORRUPTED"],
    ["GOVERNANCE_REFERENCE_LOSS", "GOVERNANCE_REFERENCE_LOSS", "DEGRADED"],
    ["CONSTITUTIONAL_REFERENCE_LOSS", "CONSTITUTIONAL_REFERENCE_LOSS", "CORRUPTED"],
    ["DUPLICATE_HASH", "DUPLICATE_HASH", "CORRUPTED"],
    ["MISSING_CHAIN_NODE", "MISSING_CHAIN_NODE", "CORRUPTED"],
    ["UNSUPPORTED_HASH_ALGORITHM", "UNSUPPORTED_HASH_ALGORITHM", "DEGRADED"],
  ] as readonly [AutonomousHashChainScenario, AutonomousHashChainFailureReason, IntegrityState][])(
    "maps %s to %s fail-closed validation",
    (scenario, reason, expectedState) => {
      const validation = validateAutonomousHashChain({ scenario });

      expect(classifyAutonomousHashChainFailure(reason)).toBe(expectedState);
      expect(validation.validation_state).toBe(expectedState);
      expect(validation.failures.map((failure) => failure.reason)).toContain(reason);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes chain observability for certification and forensic inspection", () => {
    const surface = buildAutonomousHashChainObservabilitySurface({ scenario: "GOVERNANCE_REFERENCE_LOSS" });

    expect(surface.validation_state).toBe("DEGRADED");
    expect(surface.chain_state).toBe("DEGRADED");
    expect(surface.failures).toContain("GOVERNANCE_REFERENCE_LOSS");
    expect(surface.genesis_hash).toBeTruthy();
    expect(surface.terminal_hash).toBeTruthy();
    expect(surface.latest_hash).toBe(surface.terminal_hash);
    expect(surface.replay_chain_hash).toBeTruthy();
    expect(surface.lineage_hash).toBeTruthy();
  });
});
