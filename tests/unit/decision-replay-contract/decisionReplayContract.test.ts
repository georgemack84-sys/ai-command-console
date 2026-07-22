import { describe, expect, it } from "vitest";
import {
  DECISION_REPLAY_MODES,
  DECISION_REPLAY_STATES,
  DECISION_REPLAY_TERMINAL_STATES,
  computeDecisionReplayIntegrityHash,
  createDecisionReplayRecord,
  freezeDecisionReplayMetadata,
  getDecisionReplayContractFoundation,
  guardDecisionReplayExecution,
  validateDecisionReplayContract,
} from "@/services/decision-replay-contract";
import type { DecisionReplayFailure } from "@/types/decision-replay-contract";

describe("Mission Control Phase 9.10.1 Decision Replay Contract", () => {
  it("publishes the canonical replay contract foundation", () => {
    const foundation = getDecisionReplayContractFoundation();

    expect(foundation.contract_version).toBe("decision-replay-contract/v1");
    expect(foundation.supported_schema_versions).toEqual(["decision-replay-schema/v1"]);
    expect(foundation.replay_states).toEqual(DECISION_REPLAY_STATES);
    expect(foundation.terminal_states).toEqual(DECISION_REPLAY_TERMINAL_STATES);
    expect(foundation.replay_modes).toEqual(DECISION_REPLAY_MODES);
    expect(foundation.validation.ready_for_replay).toBe(true);
    expect(foundation.guard.execution_allowed).toBe(true);
  });

  it("creates deterministic immutable replay metadata and reproducible integrity", () => {
    const first = createDecisionReplayRecord();
    const second = createDecisionReplayRecord();
    const frozen = freezeDecisionReplayMetadata(first);

    expect(second).toEqual(first);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.replay_inputs)).toBe(true);
    expect(computeDecisionReplayIntegrityHash(first)).toBe(first.integrity_hash);
    expect(validateDecisionReplayContract(first).integrity_hash_reproducible).toBe(true);
  });

  it("declares all required replay inputs, lineage, governance, and constitutional references", () => {
    const record = createDecisionReplayRecord();

    expect(record.replay_inputs.input_candidate_refs).toHaveLength(1);
    expect(record.replay_inputs.normalized_candidate_refs).toHaveLength(1);
    expect(record.replay_inputs.dependency_graph_ref.ref_id).toContain("dependency_graph");
    expect(record.replay_inputs.final_decision_state_ref.ref_id).toContain("final_decision_state");
    expect(record.lineage_refs.orchestration_lineage_ref.ref_id).toContain("orchestration_lineage");
    expect(record.governance_refs.policy_ref.ref_id).toContain("governance_policy");
    expect(record.constitutional_refs.constitution_ref.ref_id).toContain("constitution");
  });

  it.each([
    ["MISSING_REPLAY_ID", "REPLAY_ID_MISSING"],
    ["MISSING_ORCHESTRATION_ID", "ORCHESTRATION_ID_MISSING"],
    ["MISSING_MISSION_ID", "MISSION_ID_MISSING"],
    ["MISSING_TENANT_ID", "TENANT_ID_MISSING"],
    ["MISSING_VERSION", "REPLAY_VERSION_MISSING"],
    ["MISSING_TIMESTAMP", "REPLAY_TIMESTAMP_MISSING"],
    ["MISSING_STATE", "REPLAY_STATE_MISSING"],
    ["UNKNOWN_STATE", "UNKNOWN_REPLAY_STATE"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_CONTRACT_VERSION"],
    ["MISSING_INPUTS", "MISSING_INPUT_REFS"],
    ["MISSING_LINEAGE", "LINEAGE_REFS_MISSING"],
    ["MISSING_GOVERNANCE", "MISSING_GOVERNANCE_REFS"],
    ["MISSING_CONSTITUTIONAL", "MISSING_CONSTITUTIONAL_REFS"],
    ["CROSS_TENANT", "CROSS_TENANT_REFS"],
    ["CROSS_ORCHESTRATION", "CROSS_ORCHESTRATION_REFS"],
    ["MALFORMED_HASH", "MALFORMED_HASH"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["OUTPUT_MUTATION", "REPLAY_OUTPUT_MUTATION"],
    ["VALIDATION_SKIPPED", "REPLAY_VALIDATION_SKIPPED"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const validation = validateDecisionReplayContract(createDecisionReplayRecord({ scenario }));
    const guard = guardDecisionReplayExecution(createDecisionReplayRecord({ scenario }), validation);

    expect(validation.validation_status).not.toBe("VALID");
    expect(validation.ready_for_replay).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(guard.execution_allowed).toBe(false);
    expect(guard.blocked_reason).toBe(validation.failures[0]);
  });

  it("blocks replay outside the contract", () => {
    const validation = validateDecisionReplayContract(null);
    const guard = guardDecisionReplayExecution(null, validation);

    expect(validation.failures).toContain("REPLAY_CONTRACT_MISSING");
    expect(guard.execution_allowed).toBe(false);
    expect(guard.blocked_reason).toBe("REPLAY_CONTRACT_MISSING");
  });

  it("requires READY_FOR_REPLAY before execution", () => {
    const created = createDecisionReplayRecord({ replay_state: "CREATED" });
    const completed = createDecisionReplayRecord({ replay_state: "REPLAY_COMPLETED" });

    expect(validateDecisionReplayContract(created).ready_for_replay).toBe(false);
    expect(guardDecisionReplayExecution(created).execution_allowed).toBe(false);
    expect(validateDecisionReplayContract(completed).ready_for_replay).toBe(false);
    expect(guardDecisionReplayExecution(completed).execution_allowed).toBe(false);
  });

  it("allows immutable completed outputs while blocking pre-execution output mutation", () => {
    const completed = createDecisionReplayRecord({ replay_state: "REPLAY_COMPLETED" });
    const prematureOutputs = createDecisionReplayRecord({ replay_outputs: completed.replay_outputs });

    expect(validateDecisionReplayContract(completed).failures).not.toContain("REPLAY_OUTPUT_MUTATION" satisfies DecisionReplayFailure);
    expect(validateDecisionReplayContract(prematureOutputs).failures).toContain("REPLAY_OUTPUT_MUTATION");
  });
});
