import type { WorkflowStateMachineResult, WorkflowStateMachineState } from "@/types/workflow-state-machine";

export type OperatorActionEngineAction =
  | "APPROVE"
  | "REJECT"
  | "DEFER"
  | "REQUEST_MORE_EVIDENCE"
  | "REQUEST_SIMULATION"
  | "REQUEST_GOVERNANCE_REVIEW"
  | "REQUEST_RECOVERY_PLAN"
  | "OVERRIDE_RECOMMENDATION"
  | "ESCALATE"
  | "ARCHIVE";

export type OperatorActionAuthorityLevel =
  | "Observer"
  | "Reviewer"
  | "Operator"
  | "Supervisor"
  | "Governance Authority"
  | "Executive Authority"
  | "Certification Authority";

export type OperatorActionRequest = Readonly<{
  action_request_id: string;
  workflow_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  requested_action: OperatorActionEngineAction | string;
  action_parameters: Readonly<Record<string, string | number | boolean>>;
  workflow_state: WorkflowStateMachineState;
  authority_level: OperatorActionAuthorityLevel | string;
  justification: string;
  operator_authenticated: boolean;
  governance_authorized: boolean;
  constitutional_authorized: boolean;
  delegated_by?: string;
  request_timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorActionResult = Readonly<{
  action_result_id: string;
  action_request_id: string;
  workflow_id: string;
  previous_state: WorkflowStateMachineState;
  resulting_state: WorkflowStateMachineState;
  action_status: "EXECUTED" | "REJECTED";
  outcome_summary: string;
  lineage_ref: string;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type OperatorActionRecord = Readonly<{
  action_record_id: string;
  workflow_id: string;
  operator_id: string;
  action_type: OperatorActionEngineAction | string;
  authority_level: OperatorActionAuthorityLevel | string;
  workflow_state: WorkflowStateMachineState;
  execution_status: "EXECUTED" | "REJECTED";
  governance_status: "VALID" | "REJECTED";
  constitutional_status: "VALID" | "REJECTED";
  replay_ref: string;
  lineage_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type OperatorActionLedgerEntry = Readonly<{
  ledger_id: string;
  workflow_id: string;
  action_request_id: string;
  action_result_id: string;
  action_record_id: string;
  action_type: OperatorActionEngineAction | string;
  previous_state: WorkflowStateMachineState;
  resulting_state: WorkflowStateMachineState;
  execution_status: "EXECUTED" | "REJECTED";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type OperatorActionFailureReason =
  | "UNKNOWN_ACTION"
  | "OPERATOR_AUTHENTICATION_FAILED"
  | "AUTHORITY_INSUFFICIENT"
  | "WORKFLOW_STATE_INVALID"
  | "ACTION_NOT_PERMITTED_IN_STATE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "WORKFLOW_ARCHIVED"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_MISMATCH"
  | "MISSION_MISMATCH"
  | "JUSTIFICATION_MISSING"
  | "WORKFLOW_ENGINE_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_ACTION_ENGINE_ACCESS"
  | "REPLAY_DIVERGENCE";

export type OperatorActionValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  action_supported: boolean;
  action_parameters_valid: boolean;
  workflow_active: boolean;
  workflow_state_valid: boolean;
  action_permitted: boolean;
  authority_valid: boolean;
  tenant_valid: boolean;
  mission_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OperatorActionFailureReason[];
  integrity_hash: string;
}>;

export type OperatorActionEngineInput = Readonly<{
  workflow_result?: WorkflowStateMachineResult;
  action_request?: OperatorActionRequest;
  action_result?: OperatorActionResult;
  action_record?: OperatorActionRecord;
  action_ledger?: readonly OperatorActionLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type OperatorActionEngineResult = Readonly<{
  action_engine_status: "PASS" | "FAIL";
  fail_closed: boolean;
  workflow_result: WorkflowStateMachineResult;
  action_request: OperatorActionRequest;
  validation: OperatorActionValidationResult;
  action_result: OperatorActionResult;
  action_record: OperatorActionRecord;
  action_ledger: readonly OperatorActionLedgerEntry[];
  replay_hash: string;
  failures: readonly OperatorActionFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OperatorActionReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  action_request_id: string;
  action_type: OperatorActionEngineAction | string;
  previous_state: WorkflowStateMachineState;
  resulting_state: WorkflowStateMachineState;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OperatorActionFailureReason[];
  integrity_hash: string;
}>;

export type OperatorActionObservability = Readonly<{
  actions_processed: number;
  actions_executed: number;
  actions_rejected: number;
  authority_validation_failures: number;
  workflow_validation_failures: number;
  governance_validation_failures: number;
  constitutional_validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type OperatorActionEngineFoundation = Readonly<{
  action_engine_version: "operator-action-engine/v1";
  supported_actions: readonly OperatorActionEngineAction[];
  authority_levels: readonly OperatorActionAuthorityLevel[];
  result: OperatorActionEngineResult;
  replay: OperatorActionReplay;
  observability: OperatorActionObservability;
}>;
