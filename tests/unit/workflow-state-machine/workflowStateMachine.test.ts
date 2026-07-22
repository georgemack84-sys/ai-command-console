import { describe, expect, it } from "vitest";
import { createOperatorWorkflowContract } from "@/services/operator-workflow-contract";
import {
  WORKFLOW_STATE_MACHINE_STATES,
  computeWorkflowStateHistoryHash,
  computeWorkflowTransitionContractHash,
  computeWorkflowTransitionEventHash,
  createWorkflowStateHistory,
  createWorkflowTransitionEvents,
  defineWorkflowTransitionContract,
  getWorkflowStateMachineFoundation,
  replayWorkflowStateMachine,
  runWorkflowStateMachine,
} from "@/services/workflow-state-machine";

describe("Mission Control Phase 9.9.2 Workflow State Machine", () => {
  it("publishes the workflow state machine foundation", () => {
    const foundation = getWorkflowStateMachineFoundation();

    expect(foundation.state_machine_version).toBe("workflow-state-machine/v1");
    expect(foundation.workflow_states).toEqual(WORKFLOW_STATE_MACHINE_STATES);
    expect(foundation.result.state_machine_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic state progression to presented without executing decisions", () => {
    const first = runWorkflowStateMachine();
    const second = runWorkflowStateMachine();

    expect(first).toEqual(second);
    expect(first.history.state_sequence).toEqual(["CREATED", "CONTEXTUALIZED", "PRIORITIZED", "GOVERNANCE_REVIEWED", "PACKAGED", "PRESENTED"]);
    expect(first.history.current_state).toBe("PRESENTED");
    expect(first.transition_events).toHaveLength(5);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.state_history_ledger).toHaveLength(1);
    expect(first.advisory_only).toBe(true);
  });

  it("defines the complete legal transition contract", () => {
    const result = runWorkflowStateMachine();

    expect(result.transition_contract.initial_state).toBe("CREATED");
    expect(result.transition_contract.legal_transitions.CREATED).toEqual(["CONTEXTUALIZED"]);
    expect(result.transition_contract.legal_transitions.PRESENTED).toEqual(["APPROVED", "REJECTED", "DEFERRED", "ESCALATED", "SUPERSEDED"]);
    expect(result.transition_contract.legal_transitions.ARCHIVED).toEqual([]);
    expect(result.transition_contract.terminal_states).toEqual(["APPROVED", "REJECTED", "ARCHIVED"]);
  });

  it("fails closed for invalid, skipped, duplicate, hidden, circular, terminal, and unauthorized transitions", () => {
    const contract = createOperatorWorkflowContract();
    const transitionContract = defineWorkflowTransitionContract(contract);
    const events = createWorkflowTransitionEvents(contract, transitionContract);
    const history = createWorkflowStateHistory(contract, events);
    const first = events[0]!;

    expect(runWorkflowStateMachine({ transition_events: [{ ...first, to_state: "PACKAGED", integrity_hash: computeWorkflowTransitionEventHash({ ...first, to_state: "PACKAGED" }) }] }).failures).toContain("INVALID_TRANSITION");
    expect(runWorkflowStateMachine({ transition_events: [{ ...first, transition_order: 2, integrity_hash: computeWorkflowTransitionEventHash({ ...first, transition_order: 2 }) }] }).failures).toContain("SKIPPED_STATE_DETECTED");
    expect(runWorkflowStateMachine({ transition_events: [first, first] }).failures).toContain("DUPLICATE_TRANSITION");
    expect(runWorkflowStateMachine({ transition_events: [] }).failures).toContain("HIDDEN_TRANSITION_DETECTED");
    expect(runWorkflowStateMachine({ history: { ...history, state_sequence: ["CREATED", "CONTEXTUALIZED", "CREATED"], integrity_hash: computeWorkflowStateHistoryHash({ ...history, state_sequence: ["CREATED", "CONTEXTUALIZED", "CREATED"] }) } }).failures).toContain("CIRCULAR_TRANSITION");
    expect(runWorkflowStateMachine({ history: { ...history, state_sequence: ["CREATED", "CONTEXTUALIZED", "ARCHIVED", "PRESENTED"], current_state: "PRESENTED", integrity_hash: computeWorkflowStateHistoryHash({ ...history, state_sequence: ["CREATED", "CONTEXTUALIZED", "ARCHIVED", "PRESENTED"], current_state: "PRESENTED" }) } }).failures).toContain("TERMINAL_STATE_VIOLATION");
    expect(runWorkflowStateMachine({ transition_events: [{ ...first, authorized_by: "", integrity_hash: computeWorkflowTransitionEventHash({ ...first, authorized_by: "" }) }] }).failures).toContain("UNAUTHORIZED_TRANSITION");
  });

  it("rejects invalid contract, governance and constitutional failures, replay gaps, tenant mismatch, advisory violations, unauthorized access, and tampering", () => {
    const valid = runWorkflowStateMachine();
    const badContract = { ...valid.contract_result, contract_status: "FAIL" as const };
    const badTransitionContract = { ...valid.transition_contract, initial_state: "PRESENTED" as const, integrity_hash: computeWorkflowTransitionContractHash({ ...valid.transition_contract, initial_state: "PRESENTED" as const }) };
    const badEvent = { ...valid.transition_events[0]!, governance_validated: false, constitutional_validated: false, replay_ref: "", advisory_only: false as true };
    const badEventWithHash = { ...badEvent, integrity_hash: computeWorkflowTransitionEventHash(badEvent) };
    const badTenant = {
      ...valid.contract_result,
      workflow: {
        ...valid.contract_result.workflow,
        tenant_id: "tenant_beta",
      },
    };

    expect(runWorkflowStateMachine({ contract_result: badContract }).failures).toContain("WORKFLOW_CONTRACT_INVALID");
    expect(runWorkflowStateMachine({ transition_contract: badTransitionContract }).failures).toContain("INVALID_TRANSITION");
    expect(runWorkflowStateMachine({ transition_events: [badEventWithHash] }).failures).toEqual(expect.arrayContaining(["GOVERNANCE_FAILURE", "CONSTITUTIONAL_VIOLATION", "REPLAY_FAILURE", "ADVISORY_ONLY_VIOLATION"]));
    expect(runWorkflowStateMachine({ contract_result: badTenant }).failures).toContain("TENANT_MISMATCH");
    expect(runWorkflowStateMachine({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_STATE_MACHINE_ACCESS");
    expect(runWorkflowStateMachine({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(runWorkflowStateMachine({ transition_events: [{ ...valid.transition_events[0]!, transition_reason: "tampered" }] }).failures).toContain("INTEGRITY_MISMATCH");
  });

  it("replays workflow state machines deterministically", () => {
    const result = runWorkflowStateMachine();
    const replay = replayWorkflowStateMachine(result);
    const tampered = replayWorkflowStateMachine({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.workflow_id).toBe(result.contract_result.workflow.workflow_id);
    expect(replay.reconstructed_sequence).toEqual(result.history.state_sequence);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
