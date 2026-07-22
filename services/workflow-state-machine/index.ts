import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { createOperatorWorkflowContract, replayOperatorWorkflowContract } from "@/services/operator-workflow-contract";
import type { OperatorWorkflowContractResult } from "@/types/operator-workflow-contract";
import type {
  WorkflowStateHistory,
  WorkflowStateHistoryLedgerEntry,
  WorkflowStateMachineFailureReason,
  WorkflowStateMachineFoundation,
  WorkflowStateMachineInput,
  WorkflowStateMachineObservability,
  WorkflowStateMachineReplay,
  WorkflowStateMachineResult,
  WorkflowStateMachineState,
  WorkflowStateValidationResult,
  WorkflowTransitionContract,
  WorkflowTransitionEvent,
} from "@/types/workflow-state-machine";

const STATE_MACHINE_VERSION = "workflow-state-machine/v1" as const;
const AUTHORIZED_COMPONENT = "workflow-state-machine";
const NOW = "2026-07-04T01:28:00.000Z";

export const WORKFLOW_STATE_MACHINE_STATES: readonly WorkflowStateMachineState[] = Object.freeze(["CREATED", "CONTEXTUALIZED", "PRIORITIZED", "GOVERNANCE_REVIEWED", "PACKAGED", "PRESENTED", "APPROVED", "REJECTED", "DEFERRED", "ESCALATED", "SUPERSEDED", "ARCHIVED"]);

const REQUIRED_PRESENTATION_SEQUENCE: readonly WorkflowStateMachineState[] = Object.freeze(["CREATED", "CONTEXTUALIZED", "PRIORITIZED", "GOVERNANCE_REVIEWED", "PACKAGED", "PRESENTED"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function transitionHash(record: Omit<WorkflowTransitionEvent, "integrity_hash"> | WorkflowTransitionEvent): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowTransitionEventHash(record: Omit<WorkflowTransitionEvent, "integrity_hash"> | WorkflowTransitionEvent): string {
  return transitionHash(record);
}

function contractHash(record: Omit<WorkflowTransitionContract, "integrity_hash"> | WorkflowTransitionContract): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowTransitionContractHash(record: Omit<WorkflowTransitionContract, "integrity_hash"> | WorkflowTransitionContract): string {
  return contractHash(record);
}

function historyHash(record: Omit<WorkflowStateHistory, "integrity_hash"> | WorkflowStateHistory): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowStateHistoryHash(record: Omit<WorkflowStateHistory, "integrity_hash"> | WorkflowStateHistory): string {
  return historyHash(record);
}

function validationHash(record: Omit<WorkflowStateValidationResult, "integrity_hash"> | WorkflowStateValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<WorkflowStateHistoryLedgerEntry, "ledger_integrity_hash"> | WorkflowStateHistoryLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

export function defineWorkflowTransitionContract(contract: OperatorWorkflowContractResult = createOperatorWorkflowContract()): WorkflowTransitionContract {
  const transitions: Readonly<Record<WorkflowStateMachineState, readonly WorkflowStateMachineState[]>> = Object.freeze({
    CREATED: Object.freeze(["CONTEXTUALIZED"] as WorkflowStateMachineState[]),
    CONTEXTUALIZED: Object.freeze(["PRIORITIZED"] as WorkflowStateMachineState[]),
    PRIORITIZED: Object.freeze(["GOVERNANCE_REVIEWED"] as WorkflowStateMachineState[]),
    GOVERNANCE_REVIEWED: Object.freeze(["PACKAGED"] as WorkflowStateMachineState[]),
    PACKAGED: Object.freeze(["PRESENTED"] as WorkflowStateMachineState[]),
    PRESENTED: Object.freeze(["APPROVED", "REJECTED", "DEFERRED", "ESCALATED", "SUPERSEDED"] as WorkflowStateMachineState[]),
    APPROVED: Object.freeze(["ARCHIVED"] as WorkflowStateMachineState[]),
    REJECTED: Object.freeze(["ARCHIVED"] as WorkflowStateMachineState[]),
    DEFERRED: Object.freeze(["PRESENTED", "ARCHIVED"] as WorkflowStateMachineState[]),
    ESCALATED: Object.freeze(["PRESENTED", "REJECTED", "ARCHIVED"] as WorkflowStateMachineState[]),
    SUPERSEDED: Object.freeze(["ARCHIVED"] as WorkflowStateMachineState[]),
    ARCHIVED: Object.freeze([] as WorkflowStateMachineState[]),
  });
  const base: Omit<WorkflowTransitionContract, "integrity_hash"> = {
    transition_contract_id: `workflow_transition_contract_${contract.workflow.workflow_id}`,
    workflow_id: contract.workflow.workflow_id,
    initial_state: "CREATED",
    terminal_states: Object.freeze(["APPROVED", "REJECTED", "ARCHIVED"]),
    legal_states: WORKFLOW_STATE_MACHINE_STATES,
    legal_transitions: transitions,
  };
  return Object.freeze({ ...base, integrity_hash: contractHash(base) });
}

export function createWorkflowTransitionEvents(
  contract: OperatorWorkflowContractResult = createOperatorWorkflowContract(),
  transitionContract: WorkflowTransitionContract = defineWorkflowTransitionContract(contract),
): readonly WorkflowTransitionEvent[] {
  const transitions = REQUIRED_PRESENTATION_SEQUENCE.slice(1).map((to_state, index) => {
    const from_state = REQUIRED_PRESENTATION_SEQUENCE[index]!;
    const base: Omit<WorkflowTransitionEvent, "integrity_hash"> = {
      transition_id: `workflow_transition_${String(index + 1).padStart(2, "0")}_${contract.workflow.workflow_id}`,
      workflow_id: contract.workflow.workflow_id,
      from_state,
      to_state,
      transition_order: index + 1,
      authorized_by: contract.workflow.operator_id,
      transition_reason: `${from_state} to ${to_state} validated by ${transitionContract.transition_contract_id}.`,
      governance_validated: contract.authority.governance_compliant,
      constitutional_validated: contract.authority.constitutional_compliant,
      replay_ref: contract.workflow.replay_ref,
      lineage_ref: contract.workflow.lineage_ref,
      transition_timestamp: NOW,
      advisory_only: true,
    };
    return Object.freeze({ ...base, integrity_hash: transitionHash(base) });
  });
  return Object.freeze(transitions);
}

function sequenceFromEvents(events: readonly WorkflowTransitionEvent[]): readonly WorkflowStateMachineState[] {
  if (events.length === 0) return Object.freeze(["CREATED"]);
  return Object.freeze([events[0]!.from_state, ...events.map((event) => event.to_state)]);
}

export function createWorkflowStateHistory(
  contract: OperatorWorkflowContractResult = createOperatorWorkflowContract(),
  events: readonly WorkflowTransitionEvent[] = createWorkflowTransitionEvents(contract),
): WorkflowStateHistory {
  const sequence = sequenceFromEvents(events);
  const base: Omit<WorkflowStateHistory, "integrity_hash"> = {
    history_id: `workflow_state_history_${contract.workflow.workflow_id}`,
    workflow_id: contract.workflow.workflow_id,
    current_state: sequence[sequence.length - 1] ?? "CREATED",
    state_sequence: sequence,
    transition_events: events,
    append_only: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: historyHash(base) });
}

function expectedTransition(from: WorkflowStateMachineState, to: WorkflowStateMachineState, contract: WorkflowTransitionContract): boolean {
  return contract.legal_transitions[from].includes(to);
}

function stateMachineFailures(input: {
  contract: OperatorWorkflowContractResult;
  transitionContract: WorkflowTransitionContract;
  events: readonly WorkflowTransitionEvent[];
  history: WorkflowStateHistory;
  authorized: boolean;
}): readonly WorkflowStateMachineFailureReason[] {
  const failures: WorkflowStateMachineFailureReason[] = [];
  const sequence = sequenceFromEvents(input.events);
  const transitionIds = new Set(input.events.map((event) => event.transition_id));
  if (!input.authorized) failures.push("UNAUTHORIZED_STATE_MACHINE_ACCESS");
  if (input.contract.contract_status !== "PASS") failures.push("WORKFLOW_CONTRACT_INVALID");
  if (input.transitionContract.initial_state !== "CREATED") failures.push("INVALID_TRANSITION");
  if (input.events.length === 0 || input.history.state_sequence.length === 0) failures.push("HIDDEN_TRANSITION_DETECTED");
  if (transitionIds.size !== input.events.length) failures.push("DUPLICATE_TRANSITION");
  if (input.events.some((event) => !expectedTransition(event.from_state, event.to_state, input.transitionContract))) failures.push("INVALID_TRANSITION");
  if (input.events.some((event, index) => event.transition_order !== index + 1)) failures.push("SKIPPED_STATE_DETECTED");
  if (input.events.some((event) => !event.authorized_by || event.authorized_by !== input.contract.workflow.operator_id)) failures.push("UNAUTHORIZED_TRANSITION");
  if (input.events.some((event) => !event.governance_validated)) failures.push("GOVERNANCE_FAILURE");
  if (input.events.some((event) => !event.constitutional_validated)) failures.push("CONSTITUTIONAL_VIOLATION");
  if (input.events.some((event) => !event.replay_ref || !event.lineage_ref)) failures.push("REPLAY_FAILURE");
  if (input.history.state_sequence.join(">") !== sequence.join(">")) failures.push("REPLAY_FAILURE");
  if (REQUIRED_PRESENTATION_SEQUENCE.some((state, index) => input.history.state_sequence[index] !== state)) failures.push("SKIPPED_STATE_DETECTED");
  if (new Set(input.history.state_sequence.filter((state) => state !== "PRESENTED")).size !== input.history.state_sequence.filter((state) => state !== "PRESENTED").length) failures.push("CIRCULAR_TRANSITION");
  if (input.history.state_sequence.includes("ARCHIVED") && input.history.current_state !== "ARCHIVED") failures.push("TERMINAL_STATE_VIOLATION");
  if (input.contract.workflow.tenant_id !== input.contract.identity.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.events.some((event) => !event.advisory_only) || !input.contract.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    contractHash(input.transitionContract) !== input.transitionContract.integrity_hash
    || input.events.some((event) => transitionHash(event) !== event.integrity_hash)
    || historyHash(input.history) !== input.history.integrity_hash
  ) failures.push("INTEGRITY_MISMATCH");
  return Object.freeze([...new Set(failures)] as WorkflowStateMachineFailureReason[]);
}

function buildValidation(workflowId: string, failures: readonly WorkflowStateMachineFailureReason[]): WorkflowStateValidationResult {
  const has = (failure: WorkflowStateMachineFailureReason) => failures.includes(failure);
  const base: Omit<WorkflowStateValidationResult, "integrity_hash"> = {
    validation_id: `workflow_state_validation_${workflowId}`,
    workflow_id: workflowId,
    legal_transition_valid: !has("INVALID_TRANSITION") && !has("SKIPPED_STATE_DETECTED") && !has("DUPLICATE_TRANSITION") && !has("CIRCULAR_TRANSITION") && !has("TERMINAL_STATE_VIOLATION"),
    deterministic_ordering_valid: !has("SKIPPED_STATE_DETECTED") && !has("HIDDEN_TRANSITION_DETECTED"),
    history_complete: !has("HIDDEN_TRANSITION_DETECTED"),
    replay_valid: !has("REPLAY_FAILURE") && !has("REPLAY_DIVERGENCE"),
    governance_valid: !has("GOVERNANCE_FAILURE"),
    constitutional_valid: !has("CONSTITUTIONAL_VIOLATION"),
    tenant_valid: !has("TENANT_MISMATCH"),
    integrity_valid: !has("INTEGRITY_MISMATCH"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(history: WorkflowStateHistory, validation: WorkflowStateValidationResult): readonly WorkflowStateHistoryLedgerEntry[] {
  const lastEvent = history.transition_events[history.transition_events.length - 1];
  const base: Omit<WorkflowStateHistoryLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `workflow_state_history_ledger_${history.workflow_id}`,
    workflow_id: history.workflow_id,
    current_state: history.current_state,
    state_sequence: history.state_sequence,
    transition_count: history.transition_events.length,
    replay_ref: lastEvent?.replay_ref ?? "",
    lineage_ref: lastEvent?.lineage_ref ?? "",
    integrity_hash: history.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<WorkflowStateMachineResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract_result: result.contract_result,
    transition_contract: result.transition_contract,
    transition_events: result.transition_events,
    history: result.history,
    validation: result.validation,
    state_history_ledger: result.state_history_ledger,
    failures: result.failures,
  });
}

export function runWorkflowStateMachine(input: WorkflowStateMachineInput = {}): WorkflowStateMachineResult {
  const contract_result = input.contract_result ?? createOperatorWorkflowContract();
  const transition_contract = input.transition_contract ?? defineWorkflowTransitionContract(contract_result);
  const transition_events = input.transition_events ?? createWorkflowTransitionEvents(contract_result, transition_contract);
  const history = input.history ?? createWorkflowStateHistory(contract_result, transition_events);
  const initialFailures = stateMachineFailures({
    contract: contract_result,
    transitionContract: transition_contract,
    events: transition_events,
    history,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(contract_result.workflow.workflow_id, initialFailures);
  const ledger = writeLedger(history, validation);
  const ledgerFailures: readonly WorkflowStateMachineFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_MISMATCH"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as WorkflowStateMachineFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(contract_result.workflow.workflow_id, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(history, finalValidation);
  const base: Omit<WorkflowStateMachineResult, "integrity_hash" | "replay_hash"> = {
    state_machine_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    contract_result,
    transition_contract,
    transition_events,
    history,
    validation: finalValidation,
    state_history_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly WorkflowStateMachineFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(contract_result.workflow.workflow_id, replayFailures);
    const replayBase: Omit<WorkflowStateMachineResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      state_machine_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      state_history_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayWorkflowStateMachine(result: WorkflowStateMachineResult): WorkflowStateMachineReplay {
  const reconstructed = resultReplayHash(result);
  const sequence = sequenceFromEvents(result.transition_events);
  const replay_valid = reconstructed === result.replay_hash
    && contractHash(result.transition_contract) === result.transition_contract.integrity_hash
    && result.transition_events.every((event) => transitionHash(event) === event.integrity_hash)
    && historyHash(result.history) === result.history.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.state_history_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash)
    && sequence.join(">") === result.history.state_sequence.join(">");
  const failures: WorkflowStateMachineFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<WorkflowStateMachineReplay, "integrity_hash"> = {
    replay_id: "replay_workflow_state_machine",
    replay_valid,
    workflow_id: result.contract_result.workflow.workflow_id,
    reconstructed_sequence: sequence,
    current_state: sequence[sequence.length - 1] ?? "CREATED",
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildWorkflowStateMachineObservability(result: WorkflowStateMachineResult): WorkflowStateMachineObservability {
  return Object.freeze({
    state_progressions_generated: result.state_machine_status === "PASS" ? 1 : 0,
    legal_transition_validation: result.validation.legal_transition_valid ? 1 : 0,
    illegal_transition_detection: result.failures.includes("INVALID_TRANSITION") ? 1 : 0,
    history_completeness: result.validation.history_complete ? 1 : 0,
    replay_fidelity: replayWorkflowStateMachine(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    hidden_transitions: result.failures.includes("HIDDEN_TRANSITION_DETECTED") ? 1 : 0,
    unauthorized_progressions: result.failures.includes("UNAUTHORIZED_TRANSITION") || result.failures.includes("UNAUTHORIZED_STATE_MACHINE_ACCESS") ? 1 : 0,
    replay_divergence: result.failures.includes("REPLAY_DIVERGENCE") ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getWorkflowStateMachineFoundation(): WorkflowStateMachineFoundation {
  const result = runWorkflowStateMachine();
  const replay = replayWorkflowStateMachine(result);
  return Object.freeze({
    state_machine_version: STATE_MACHINE_VERSION,
    workflow_states: WORKFLOW_STATE_MACHINE_STATES,
    result,
    replay,
    observability: buildWorkflowStateMachineObservability(result),
  });
}

export const WorkflowStateMachine = Object.freeze({
  run: runWorkflowStateMachine,
  replay: replayWorkflowStateMachine,
});
