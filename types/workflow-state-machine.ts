import type { OperatorWorkflowContractResult } from "@/types/operator-workflow-contract";

export type WorkflowStateMachineState =
  | "CREATED"
  | "CONTEXTUALIZED"
  | "PRIORITIZED"
  | "GOVERNANCE_REVIEWED"
  | "PACKAGED"
  | "PRESENTED"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "ESCALATED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type WorkflowTransitionEvent = Readonly<{
  transition_id: string;
  workflow_id: string;
  from_state: WorkflowStateMachineState;
  to_state: WorkflowStateMachineState;
  transition_order: number;
  authorized_by: string;
  transition_reason: string;
  governance_validated: boolean;
  constitutional_validated: boolean;
  replay_ref: string;
  lineage_ref: string;
  transition_timestamp: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type WorkflowStateHistory = Readonly<{
  history_id: string;
  workflow_id: string;
  current_state: WorkflowStateMachineState;
  state_sequence: readonly WorkflowStateMachineState[];
  transition_events: readonly WorkflowTransitionEvent[];
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type WorkflowTransitionContract = Readonly<{
  transition_contract_id: string;
  workflow_id: string;
  initial_state: WorkflowStateMachineState;
  terminal_states: readonly WorkflowStateMachineState[];
  legal_states: readonly WorkflowStateMachineState[];
  legal_transitions: Readonly<Record<WorkflowStateMachineState, readonly WorkflowStateMachineState[]>>;
  integrity_hash: string;
}>;

export type WorkflowStateValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  legal_transition_valid: boolean;
  deterministic_ordering_valid: boolean;
  history_complete: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  tenant_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly WorkflowStateMachineFailureReason[];
  integrity_hash: string;
}>;

export type WorkflowStateHistoryLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  current_state: WorkflowStateMachineState;
  state_sequence: readonly WorkflowStateMachineState[];
  transition_count: number;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type WorkflowStateMachineFailureReason =
  | "SKIPPED_STATE_DETECTED"
  | "INVALID_TRANSITION"
  | "UNAUTHORIZED_TRANSITION"
  | "REPLAY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "INTEGRITY_MISMATCH"
  | "DUPLICATE_TRANSITION"
  | "CIRCULAR_TRANSITION"
  | "TERMINAL_STATE_VIOLATION"
  | "WORKFLOW_CONTRACT_INVALID"
  | "TENANT_MISMATCH"
  | "HIDDEN_TRANSITION_DETECTED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_STATE_MACHINE_ACCESS"
  | "REPLAY_DIVERGENCE";

export type WorkflowStateMachineInput = Readonly<{
  contract_result?: OperatorWorkflowContractResult;
  transition_contract?: WorkflowTransitionContract;
  transition_events?: readonly WorkflowTransitionEvent[];
  history?: WorkflowStateHistory;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type WorkflowStateMachineResult = Readonly<{
  state_machine_status: "PASS" | "FAIL";
  fail_closed: boolean;
  contract_result: OperatorWorkflowContractResult;
  transition_contract: WorkflowTransitionContract;
  transition_events: readonly WorkflowTransitionEvent[];
  history: WorkflowStateHistory;
  validation: WorkflowStateValidationResult;
  state_history_ledger: readonly WorkflowStateHistoryLedgerEntry[];
  replay_hash: string;
  failures: readonly WorkflowStateMachineFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type WorkflowStateMachineReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  reconstructed_sequence: readonly WorkflowStateMachineState[];
  current_state: WorkflowStateMachineState;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly WorkflowStateMachineFailureReason[];
  integrity_hash: string;
}>;

export type WorkflowStateMachineObservability = Readonly<{
  state_progressions_generated: number;
  legal_transition_validation: number;
  illegal_transition_detection: number;
  history_completeness: number;
  replay_fidelity: number;
  integrity_verification_success: number;
  hidden_transitions: number;
  unauthorized_progressions: number;
  replay_divergence: number;
  fail_closed_activations: number;
}>;

export type WorkflowStateMachineFoundation = Readonly<{
  state_machine_version: "workflow-state-machine/v1";
  workflow_states: readonly WorkflowStateMachineState[];
  result: WorkflowStateMachineResult;
  replay: WorkflowStateMachineReplay;
  observability: WorkflowStateMachineObservability;
}>;
