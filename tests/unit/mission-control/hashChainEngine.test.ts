import { describe, expect, it } from "vitest";
import {
  buildTruthHashChainExecution,
  createDefaultTruthIntegrityContractFixture,
  hashTruthIntegrityContract,
  toTruthHashChainExecutionStorageRecord,
  TRUTH_HASH_CHAIN_EVENTS,
  TRUTH_HASH_CHAIN_RESULT_PRECEDENCE,
} from "@/services/mission-control";
import type {
  TruthHashChainExecutionRequest,
  TruthHashChainFailureCode,
  TruthHashChainResultState,
  TruthHashChainSourceArtifact,
  TruthIntegrityContract,
} from "@/services/mission-control";

function contract(overrides: Partial<TruthIntegrityContract> = {}): TruthIntegrityContract {
  return createDefaultTruthIntegrityContractFixture(overrides);
}

function artifacts(overrides: Partial<TruthHashChainSourceArtifact>[] = []): TruthHashChainSourceArtifact[] {
  const base: TruthHashChainSourceArtifact[] = [
    {
      source_ref: "truth_001",
      node_type: "TRUTH_RECORD",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      payload: { id: "truth_001", value: "recommendation", nested: { a: 1, b: 2 } },
      expected_hash: "truth_hash_001",
      observed_hash: "truth_hash_001",
      schema_ref: "schema_integrity_v1",
      schema_hash: "schema_hash_001",
      evidence_refs: ["evidence_001"],
      lineage_refs: ["lineage_001"],
      governance_refs: ["gov_decision_001"],
      source_order: 1,
    },
    {
      source_ref: "evidence_001",
      node_type: "EVIDENCE",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      payload: { id: "evidence_001", support: true },
      expected_hash: "evidence_hash_001",
      observed_hash: "evidence_hash_001",
      schema_ref: "schema_integrity_v1",
      schema_hash: "schema_hash_001",
      source_order: 2,
    },
    {
      source_ref: "lineage_001",
      node_type: "LINEAGE_REF",
      tenant_id: "tenant_alpha",
      mission_id: "mission_truth_001",
      payload: { id: "lineage_001", parent: "truth_001" },
      expected_hash: "lineage_hash_001",
      observed_hash: "lineage_hash_001",
      schema_ref: "schema_integrity_v1",
      schema_hash: "schema_hash_001",
      source_order: 3,
    },
  ];
  return base.map((item, index) => ({ ...item, ...overrides[index] }));
}

function replayArtifacts(overrides: Partial<TruthHashChainSourceArtifact>[] = []): TruthHashChainSourceArtifact[] {
  const base: TruthHashChainSourceArtifact[] = [
    { source_ref: "replay_contract_001", node_type: "REPLAY_CONTRACT", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", payload: { contract: true }, expected_hash: "replay_contract_hash", observed_hash: "replay_contract_hash" },
    { source_ref: "input_bundle_001", node_type: "REPLAY_INPUT_BUNDLE", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", payload: { input: true }, expected_hash: "input_hash", observed_hash: "input_hash" },
    { source_ref: "state_package_001", node_type: "REPLAY_STATE_PACKAGE", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", payload: { state: true }, expected_hash: "state_hash", observed_hash: "state_hash" },
    { source_ref: "output_verification_001", node_type: "REPLAY_OUTPUT_VERIFICATION", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", payload: { output: true }, expected_hash: "output_hash", observed_hash: "output_hash" },
    { source_ref: "gate_001", node_type: "REPLAY_DETERMINISM_GATE", tenant_id: "tenant_alpha", mission_id: "mission_truth_001", payload: { gate: true }, expected_hash: "gate_hash", observed_hash: "gate_hash" },
  ];
  return base.map((item, index) => ({ ...item, ...overrides[index] }));
}

function request(overrides: Partial<TruthHashChainExecutionRequest> = {}): TruthHashChainExecutionRequest {
  return {
    hash_chain_id: "hash_chain_001",
    integrity_contract: contract(),
    source_artifacts: artifacts(),
    created_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function expectState(overrides: Partial<TruthHashChainExecutionRequest>, state: TruthHashChainResultState, code?: TruthHashChainFailureCode) {
  const execution = buildTruthHashChainExecution(request(overrides));
  expect(execution.chain_result_state).toBe(state);
  if (code) expect(execution.failure_reasons?.map((reason) => reason.code)).toContain(code);
  return execution;
}

describe("Mission Control Phase 6I.2 Hash Chain Engine", () => {
  it("defines required hash chain audit events", () => {
    expect(Object.keys(TRUTH_HASH_CHAIN_EVENTS)).toEqual([
      "HASH_CHAIN_REQUESTED",
      "HASH_CHAIN_INTEGRITY_CONTRACT_LOADED",
      "HASH_CHAIN_SCOPE_RESOLVED",
      "HASH_CHAIN_SOURCES_LOADED",
      "HASH_CHAIN_ARTIFACTS_CANONICALIZED",
      "HASH_CHAIN_NODES_BUILT",
      "HASH_CHAIN_EDGES_BUILT",
      "HASH_CHAIN_ORDERED",
      "HASH_CHAIN_ROOT_COMPUTED",
      "HASH_CHAIN_VERIFIED",
      "HASH_CHAIN_MISMATCH_DETECTED",
      "HASH_CHAIN_INCOMPLETE_DETECTED",
      "HASH_CHAIN_CORRUPTION_DETECTED",
      "HASH_CHAIN_UNAUTHORIZED_DETECTED",
      "HASH_CHAIN_INVALID_DETECTED",
      "HASH_CHAIN_PROOF_CREATED",
      "HASH_CHAIN_RESULT_RECORDED",
      "HASH_CHAIN_ESCALATED",
    ]);
  });

  it("hash chain result precedence is explicit", () => {
    expect(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.INVALID).toBeGreaterThan(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.UNAUTHORIZED);
    expect(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.UNAUTHORIZED).toBeGreaterThan(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.CORRUPTED);
    expect(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.CORRUPTED).toBeGreaterThan(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.INCOMPLETE);
    expect(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.INCOMPLETE).toBeGreaterThan(TRUTH_HASH_CHAIN_RESULT_PRECEDENCE.MISMATCH);
  });

  it("integrity contract loaded -> PASS", () => {
    expectState({}, "VERIFIED");
  });

  it("integrity contract missing -> INVALID", () => {
    expectState({ force_integrity_contract_missing: true }, "INVALID", "INTEGRITY_CONTRACT_MISSING");
  });

  it("integrity contract hash valid -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.integrity_contract_id).toBe("integrity_contract_001");
  });

  it("integrity contract hash mismatch -> INVALID", () => {
    expectState({ force_integrity_contract_hash_mismatch: true }, "INVALID", "INTEGRITY_CONTRACT_HASH_MISMATCH");
  });

  it("invalid integrity contract -> INVALID", () => {
    expectState({ integrity_contract: contract({ tenant_id: "" }) }, "INVALID", "INTEGRITY_CONTRACT_INVALID");
  });

  it("hash chain scope resolved -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_chain_scope.allowed_tenant_ids).toContain("tenant_alpha");
  });

  it("hash chain scope missing -> INVALID", () => {
    expectState({ force_hash_chain_scope_missing: true }, "INVALID", "HASH_CHAIN_SCOPE_MISSING");
  });

  it("tenant scope valid -> PASS", () => {
    expectState({}, "VERIFIED");
  });

  it("tenant scope violation -> INVALID", () => {
    expectState({
      hash_chain_scope: { ...buildTruthHashChainExecution(request()).hash_chain_scope, allowed_tenant_ids: ["tenant_beta"] },
    }, "INVALID", "TENANT_SCOPE_VIOLATION");
  });

  it("mission scope valid -> PASS", () => {
    expectState({}, "VERIFIED");
  });

  it("mission scope violation -> INVALID", () => {
    expectState({
      hash_chain_scope: { ...buildTruthHashChainExecution(request()).hash_chain_scope, allowed_mission_ids: ["mission_other"] },
    }, "INVALID", "MISSION_SCOPE_VIOLATION");
  });

  it("target valid -> PASS", () => {
    expectState({}, "VERIFIED");
  });

  it("target missing -> INVALID", () => {
    expectState({ force_hash_chain_target_missing: true }, "INVALID", "HASH_CHAIN_TARGET_MISSING");
  });

  it("target outside scope -> INVALID", () => {
    expectState({
      hash_chain_target: { target_type: "SCHEMA", target_ids: ["schema_001"] },
    }, "INVALID", "HASH_CHAIN_TARGET_INVALID");
  });

  it("source artifacts loaded -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_nodes).toHaveLength(3);
  });

  it("source artifact missing -> INCOMPLETE", () => {
    expectState({ source_artifacts: artifacts([{ missing: true }]) }, "INCOMPLETE", "SOURCE_ARTIFACT_MISSING");
  });

  it("source tenant mismatch -> INVALID", () => {
    expectState({ source_artifacts: artifacts([{ tenant_id: "tenant_beta" }]) }, "INVALID", "SOURCE_TENANT_MISMATCH");
  });

  it("source mission mismatch -> INVALID", () => {
    expectState({ source_artifacts: artifacts([{ mission_id: "mission_beta" }]) }, "INVALID", "MISSION_SCOPE_VIOLATION");
  });

  it("unauthorized source artifact -> UNAUTHORIZED", () => {
    expectState({ source_artifacts: artifacts([{ unauthorized: true }]) }, "UNAUTHORIZED", "SOURCE_ARTIFACT_UNAUTHORIZED");
  });

  it("canonical serialization stable -> PASS", () => {
    const first = buildTruthHashChainExecution(request());
    const second = buildTruthHashChainExecution(request({ source_artifacts: artifacts([{ payload: { nested: { b: 2, a: 1 }, value: "recommendation", id: "truth_001" } }]) }));
    expect(first.hash_nodes[0].canonical_payload_hash).toBe(second.hash_nodes[0].canonical_payload_hash);
  });

  it("reordered object keys produce same root hash", () => {
    const first = buildTruthHashChainExecution(request());
    const second = buildTruthHashChainExecution(request({ source_artifacts: artifacts([{ payload: { nested: { b: 2, a: 1 }, value: "recommendation", id: "truth_001" } }]) }));
    expect(first.chain_root.observed_root_hash).toBe(second.chain_root.observed_root_hash);
  });

  it("unstable serialization detected -> INVALID", () => {
    expectState({ force_unstable_serialization: true }, "INVALID", "UNSTABLE_SERIALIZATION_DETECTED");
  });

  it("wall-clock injection detected -> INVALID", () => {
    expectState({ force_wall_clock_injection: true }, "INVALID", "WALL_CLOCK_INJECTION_DETECTED");
  });

  it("environment-specific value detected -> INVALID", () => {
    expectState({ force_environment_value: true }, "INVALID", "ENVIRONMENT_VALUE_DETECTED");
  });

  it("hash node created -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_nodes[0].node_id).toContain("truth_001");
  });

  it("node hash generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_nodes.every((node) => node.node_hash.length > 0)).toBe(true);
  });

  it("expected node hash missing -> INCOMPLETE", () => {
    expectState({ source_artifacts: artifacts([{ expected_hash: undefined, stored_hash: undefined }]) }, "INCOMPLETE", "EXPECTED_NODE_HASH_MISSING");
  });

  it("node hash mismatch -> MISMATCH", () => {
    expectState({ source_artifacts: artifacts([{ expected_hash: "expected", observed_hash: "observed" }]) }, "MISMATCH", "NODE_HASH_MISMATCH");
  });

  it("corrupted node detected -> CORRUPTED", () => {
    expectState({ source_artifacts: artifacts([{ stored_hash: "not_payload_hash", corrupted: true }]) }, "CORRUPTED", "CORRUPTED_NODE_DETECTED");
  });

  it("hash edge created -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_edges).toHaveLength(2);
  });

  it("edge hash generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.hash_edges.every((edge) => edge.edge_hash.length > 0)).toBe(true);
  });

  it("edge hash mismatch -> MISMATCH", () => {
    expectState({
      edge_specs: [{ edge_type: "SEQUENCE_NEXT", from_source_ref: "truth_001", to_source_ref: "evidence_001", expected_edge_hash: "expected", observed_edge_hash: "observed" }],
      expected_edge_count: 1,
    }, "MISMATCH", "EDGE_HASH_MISMATCH");
  });

  it("missing edge detected -> INCOMPLETE", () => {
    expectState({ force_missing_edge: true }, "INCOMPLETE", "EDGE_MISSING");
  });

  it("cross-tenant edge detected -> INVALID", () => {
    expectState({
      edge_specs: [{ edge_type: "SEQUENCE_NEXT", from_source_ref: "truth_001", to_source_ref: "evidence_001", tenant_id: "tenant_beta" }],
      expected_edge_count: 1,
    }, "INVALID", "CROSS_TENANT_EDGE_DETECTED");
  });

  it("deterministic ordering applied -> PASS", () => {
    const execution = buildTruthHashChainExecution(request({ source_artifacts: [artifacts()[2], artifacts()[0], artifacts()[1]] }));
    expect(execution.hash_nodes.map((node) => node.source_ref)).toEqual(["truth_001", "evidence_001", "lineage_001"]);
  });

  it("ambiguous ordering detected -> INVALID", () => {
    expectState({ force_ambiguous_ordering: true }, "INVALID", "AMBIGUOUS_ORDERING_DETECTED");
  });

  it("ordering hash generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.ordering_context.ordering_hash).toBeTruthy();
  });

  it("linear chain built -> PASS", () => {
    const execution = buildTruthHashChainExecution(request({ root_strategy: "LINEAR_CHAIN_ROOT" }));
    expect(execution.chain_root.root_strategy).toBe("LINEAR_CHAIN_ROOT");
  });

  it("linear chain gap detected -> INCOMPLETE", () => {
    expectState({ force_chain_gap: true }, "INCOMPLETE", "CHAIN_GAP_DETECTED");
  });

  it("graph root built -> PASS", () => {
    const execution = buildTruthHashChainExecution(request({ root_strategy: "GRAPH_ROOT" }));
    expect(execution.chain_root.root_strategy).toBe("GRAPH_ROOT");
  });

  it("graph node missing -> INCOMPLETE", () => {
    expectState({ expected_node_count: 4 }, "INCOMPLETE", "SOURCE_ARTIFACT_MISSING");
  });

  it("graph edge missing -> INCOMPLETE", () => {
    expectState({ expected_edge_count: 3 }, "INCOMPLETE", "EDGE_MISSING");
  });

  it("replay artifact chain built -> PASS", () => {
    const replayContract = contract({
      integrity_type: "REPLAY_DETERMINISM_GATE_INTEGRITY",
      integrity_scope: { ...contract().integrity_scope, scope_type: "REPLAY", allowed_target_types: ["REPLAY_DETERMINISM_GATE"] },
      integrity_target: { target_type: "REPLAY_DETERMINISM_GATE", target_ids: ["gate_001"] },
    });
    const execution = buildTruthHashChainExecution(request({
      integrity_contract: replayContract,
      hash_chain_type: "REPLAY_ARTIFACT_HASH_CHAIN",
      source_artifacts: replayArtifacts(),
      root_strategy: "REPLAY_CHAIN_ROOT",
    }));
    expect(execution.chain_result_state).toBe("VERIFIED");
    expect(execution.hash_nodes.map((node) => node.node_type)).toEqual(["REPLAY_CONTRACT", "REPLAY_INPUT_BUNDLE", "REPLAY_STATE_PACKAGE", "REPLAY_OUTPUT_VERIFICATION", "REPLAY_DETERMINISM_GATE"]);
  });

  it("replay artifact missing -> INCOMPLETE", () => {
    expectState({ hash_chain_type: "REPLAY_ARTIFACT_HASH_CHAIN", source_artifacts: replayArtifacts([{}, { missing: true }]) }, "INCOMPLETE", "SOURCE_ARTIFACT_MISSING");
  });

  it("replay hash mismatch -> MISMATCH", () => {
    expectState({ hash_chain_type: "REPLAY_ARTIFACT_HASH_CHAIN", source_artifacts: replayArtifacts([{ expected_hash: "a", observed_hash: "b" }]) }, "MISMATCH", "NODE_HASH_MISMATCH");
  });

  it("replay provenance mismatch -> INVALID", () => {
    expectState({ hash_chain_type: "REPLAY_ARTIFACT_HASH_CHAIN", source_artifacts: replayArtifacts([{ provenance_mismatch: true }]) }, "INVALID", "REPLAY_PROVENANCE_MISMATCH");
  });

  it("governance hash chain built -> PASS", () => {
    expectState({ hash_chain_type: "GOVERNANCE_HASH_CHAIN" }, "VERIFIED");
  });

  it("policy substitution detected -> INVALID", () => {
    expectState({ source_artifacts: artifacts([{ policy_substituted: true }]) }, "INVALID", "POLICY_SUBSTITUTION_DETECTED");
  });

  it("governance bypass detected -> INVALID", () => {
    expectState({ source_artifacts: artifacts([{ governance_bypass: true }]) }, "INVALID", "GOVERNANCE_BYPASS_DETECTED");
  });

  it("evidence hash chain built -> PASS", () => {
    expectState({ hash_chain_type: "EVIDENCE_HASH_CHAIN" }, "VERIFIED");
  });

  it("evidence missing -> INCOMPLETE", () => {
    expectState({ source_artifacts: artifacts([{}, { missing: true }]) }, "INCOMPLETE", "SOURCE_ARTIFACT_MISSING");
  });

  it("evidence hash mismatch -> MISMATCH", () => {
    expectState({ source_artifacts: artifacts([{}, { expected_hash: "expected", observed_hash: "observed" }]) }, "MISMATCH", "NODE_HASH_MISMATCH");
  });

  it("lineage hash chain built -> PASS", () => {
    expectState({ hash_chain_type: "LINEAGE_HASH_CHAIN" }, "VERIFIED");
  });

  it("broken lineage detected -> MISMATCH via node hash mismatch", () => {
    expectState({ source_artifacts: artifacts([{}, {}, { expected_hash: "expected", observed_hash: "observed" }]) }, "MISMATCH", "NODE_HASH_MISMATCH");
  });

  it("schema hash chain built -> PASS", () => {
    expectState({ hash_chain_type: "SCHEMA_HASH_CHAIN" }, "VERIFIED");
  });

  it("silent schema migration detected -> INVALID", () => {
    expectState({ source_artifacts: artifacts([{ silent_schema_migration: true }]) }, "INVALID", "SILENT_SCHEMA_MIGRATION_DETECTED");
  });

  it("root hash generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.chain_root.observed_root_hash).toBeTruthy();
  });

  it("root hash matches expected -> VERIFIED candidate", () => {
    const baseline = buildTruthHashChainExecution(request());
    expectState({ expected_root_hash: baseline.chain_root.observed_root_hash }, "VERIFIED");
  });

  it("root hash mismatch -> MISMATCH", () => {
    expectState({ force_root_hash_mismatch: true }, "MISMATCH", "ROOT_HASH_MISMATCH");
  });

  it("chain proof generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.chain_proof.proof_path_hashes.length).toBe(5);
  });

  it("proof hash generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.chain_proof.proof_hash).toBeTruthy();
  });

  it("proof hash mismatch -> MISMATCH", () => {
    expectState({ force_proof_hash_mismatch: true }, "MISMATCH", "PROOF_HASH_MISMATCH");
  });

  it("completeness report generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.completeness_report.complete).toBe(true);
  });

  it("integrity report generated -> PASS", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.integrity_report.deterministic).toBe(true);
  });

  it("verified chain result generated -> VERIFIED", () => {
    expectState({}, "VERIFIED");
  });

  it("mismatch chain result generated -> MISMATCH", () => {
    expectState({ source_artifacts: artifacts([{ expected_hash: "expected", observed_hash: "observed" }]) }, "MISMATCH");
  });

  it("incomplete chain result generated -> INCOMPLETE", () => {
    expectState({ source_artifacts: artifacts([{ missing: true }]) }, "INCOMPLETE");
  });

  it("corrupted chain result generated -> CORRUPTED", () => {
    expectState({ source_artifacts: artifacts([{ stored_hash: "wrong", corrupted: true }]) }, "CORRUPTED");
  });

  it("unauthorized chain result generated -> UNAUTHORIZED", () => {
    expectState({ source_artifacts: artifacts([{ unauthorized: true }]) }, "UNAUTHORIZED");
  });

  it("invalid chain result generated -> INVALID", () => {
    expectState({ force_unsupported_hash_algorithm: true }, "INVALID", "UNSUPPORTED_HASH_ALGORITHM");
  });

  it("same chain inputs produce same root hash", () => {
    expect(buildTruthHashChainExecution(request()).chain_root.observed_root_hash).toBe(buildTruthHashChainExecution(request()).chain_root.observed_root_hash);
  });

  it("changed node changes chain root", () => {
    expect(buildTruthHashChainExecution(request()).chain_root.observed_root_hash).not.toBe(buildTruthHashChainExecution(request({ source_artifacts: artifacts([{ observed_hash: "changed" }]) })).chain_root.observed_root_hash);
  });

  it("changed edge changes chain root", () => {
    expect(buildTruthHashChainExecution(request()).chain_root.observed_root_hash).not.toBe(buildTruthHashChainExecution(request({
      edge_specs: [{ edge_type: "SUPPORTED_BY", from_source_ref: "truth_001", to_source_ref: "evidence_001" }],
      expected_edge_count: 1,
    })).chain_root.observed_root_hash);
  });

  it("chain execution hash generated", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.chain_execution_hash).toBeTruthy();
  });

  it("same chain inputs produce same execution hash", () => {
    expect(buildTruthHashChainExecution(request()).chain_execution_hash).toBe(buildTruthHashChainExecution(request()).chain_execution_hash);
  });

  it("hash chain audit event emitted", () => {
    const execution = buildTruthHashChainExecution(request());
    expect(execution.audit_events).toContain("HASH_CHAIN_RESULT_RECORDED");
  });

  it("non-VERIFIED result has reason", () => {
    const execution = expectState({ force_unsupported_hash_algorithm: true }, "INVALID");
    expect(execution.failure_reasons?.length).toBeGreaterThan(0);
  });

  it("storage representation preserves canonical JSON fields", () => {
    const execution = buildTruthHashChainExecution(request());
    const storage = toTruthHashChainExecutionStorageRecord(execution);
    expect(storage.hash_chain_id).toBe("hash_chain_001");
    expect(storage.hash_nodes_json).toContain("truth_001");
    expect(storage.chain_execution_hash).toBe(execution.chain_execution_hash);
  });

  it("source mutation is forbidden", () => {
    const execution = expectState({ force_source_mutation: true }, "INVALID", "SOURCE_MUTATION_ATTEMPTED");
    expect(execution.sourceMutationAllowed).toBe(false);
  });

  it("execution authority is forbidden", () => {
    expectState({ force_execution_authority: true }, "INVALID", "EXECUTION_AUTHORITY_DETECTED");
  });

  it("read-only result is explicit", () => {
    expect(buildTruthHashChainExecution(request()).readOnly).toBe(true);
  });

  it("contract hash helper remains deterministic for 6I.2 loader", () => {
    const loaded = contract();
    expect(loaded.contract_hash).toBe(hashTruthIntegrityContract({ ...loaded, contract_hash: undefined }));
  });
});
