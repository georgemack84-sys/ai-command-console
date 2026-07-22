import type { LearningPermissionRegistryResult } from "@/types/learning-permission-registry";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type AdaptationLifecycleState =
  | "PROPOSED"
  | "VALIDATED"
  | "SIMULATED"
  | "GOVERNANCE_REVIEW"
  | "OPERATOR_REVIEW"
  | "APPROVED"
  | "CERTIFIED"
  | "AVAILABLE"
  | "REJECTED"
  | "ROLLED_BACK";

export type AdaptationTransitionDecision = "ALLOW" | "REJECT";
export type AdaptationValidationState = "PASS" | "FAIL";

export type AdaptationStateCheck =
  | "PERMISSION_REGISTRY"
  | "CURRENT_STATE"
  | "TRANSITION_MATRIX"
  | "GOVERNANCE_ORDER"
  | "OPERATOR_ORDER"
  | "CERTIFICATION_ORDER"
  | "REPLAY"
  | "ROLLBACK"
  | "INTEGRITY"
  | "LEDGER"
  | "OBSERVABILITY"
  | "ADVISORY_ONLY";

export type AdaptationStateFailure =
  | "LEARNING_PERMISSION_INVALID"
  | "HIDDEN_LIFECYCLE_STATE"
  | "SKIPPED_TRANSITION"
  | "REVERSED_TRANSITION"
  | "DUPLICATE_APPROVAL"
  | "CERTIFICATION_BEFORE_APPROVAL"
  | "OPERATOR_REVIEW_BEFORE_GOVERNANCE"
  | "AVAILABILITY_BEFORE_CERTIFICATION"
  | "REPLAY_OMISSION"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "UNAUTHORIZED_APPROVAL"
  | "UNAUTHORIZED_ROLLBACK"
  | "INVALID_ROLLBACK_TARGET"
  | "SIMULATION_FAILURE"
  | "VALIDATION_FAILURE"
  | "STATE_FORGERY"
  | "LIFECYCLE_TAMPERING"
  | "INTEGRITY_HASH_MISMATCH"
  | "FAIL_OPEN_STATE_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type AdaptationStateRecord = Readonly<{
  adaptation_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  current_state: AdaptationLifecycleState;
  previous_state: AdaptationLifecycleState | "NONE";
  transition_reason: string;
  transition_timestamp: string;
  transition_initiator: string;
  governance_required: boolean;
  governance_status: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  operator_review_required: boolean;
  operator_review_status: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  certification_required: boolean;
  certification_status: "NOT_REQUIRED" | "PENDING" | "CERTIFIED" | "FAILED";
  replay_reference: string;
  rollback_available: boolean;
  integrity_hash: string;
}>;

export type AdaptationTransitionRequest = Readonly<{
  request_id: string;
  adaptation_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  from_state: AdaptationLifecycleState;
  to_state: AdaptationLifecycleState;
  transition_reason: string;
  transition_initiator: string;
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  rollback_refs: readonly string[];
}>;

export type AdaptationTransitionResult = Readonly<{
  transition_result_id: string;
  adaptation_id: string;
  proposal_id: string;
  previous_state: AdaptationLifecycleState;
  current_state: AdaptationLifecycleState;
  validation_result: AdaptationTransitionDecision;
  transition_allowed: boolean;
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  rollback_refs: readonly string[];
  reason: string;
  integrity_hash: string;
}>;

export type AdaptationStateReplayModel = Readonly<{
  replay_model_id: string;
  adaptation_id: string;
  previous_state: AdaptationLifecycleState;
  new_state: AdaptationLifecycleState;
  transition_reason: string;
  initiating_actor: string;
  validation_evidence: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  deterministic_reconstruction: boolean;
  integrity_reproducible: boolean;
  integrity_hash: string;
}>;

export type AdaptationStateCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly AdaptationStateCheck[];
  transition_matrix_valid: boolean;
  no_hidden_states: boolean;
  no_skipped_transitions: boolean;
  governance_order_valid: boolean;
  operator_order_valid: boolean;
  certification_order_valid: boolean;
  rollback_valid: boolean;
  replay_verified: boolean;
  ledger_immutable: boolean;
  observability_complete: boolean;
  advisory_only_preserved: boolean;
  integrity_verified: boolean;
  failure_analysis: readonly AdaptationStateFailure[];
  certification_decision: AdaptationValidationState;
  integrity_hash: string;
}>;

export type AdaptationStateLedgerRecord = Readonly<{
  record_id: string;
  adaptation_id: string;
  proposal_id: string;
  previous_state: AdaptationLifecycleState;
  current_state: AdaptationLifecycleState;
  transition_reason: string;
  validation_result: AdaptationTransitionDecision;
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type AdaptationStateValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  learning_permission_valid: boolean;
  current_state_valid: boolean;
  transition_allowed: boolean;
  governance_order_valid: boolean;
  operator_order_valid: boolean;
  certification_order_valid: boolean;
  replay_present: boolean;
  rollback_valid: boolean;
  ledger_immutable: boolean;
  no_hidden_states: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly AdaptationStateFailure[];
  integrity_hash: string;
}>;

export type AdaptationStateMachineInput = Readonly<{
  learning_permission?: LearningPermissionRegistryResult;
  role?: VisibilityRole;
  from_state?: AdaptationLifecycleState;
  to_state?: AdaptationLifecycleState;
  scenario?:
    | "BASELINE"
    | "PERMISSION_INVALID"
    | "HIDDEN_STATE"
    | "SKIPPED_TRANSITION"
    | "REVERSED_TRANSITION"
    | "DUPLICATE_APPROVAL"
    | "CERTIFICATION_BEFORE_APPROVAL"
    | "OPERATOR_BEFORE_GOVERNANCE"
    | "AVAILABLE_BEFORE_CERTIFICATION"
    | "REPLAY_OMISSION"
    | "GOVERNANCE_BYPASS"
    | "OPERATOR_BYPASS"
    | "CERTIFICATION_BYPASS"
    | "UNAUTHORIZED_APPROVAL"
    | "UNAUTHORIZED_ROLLBACK"
    | "INVALID_ROLLBACK_TARGET"
    | "SIMULATION_FAILURE"
    | "VALIDATION_FAILURE"
    | "STATE_FORGERY"
    | "LIFECYCLE_TAMPERING"
    | "HASH_MISMATCH"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type AdaptationStateMachineResult = Readonly<{
  state_machine_version: "adaptation-state-machine/v1";
  learning_permission: LearningPermissionRegistryResult;
  state_record: AdaptationStateRecord;
  transition_request: AdaptationTransitionRequest;
  transition_result: AdaptationTransitionResult;
  replay_model: AdaptationStateReplayModel;
  certification_report: AdaptationStateCertificationReport;
  state_ledger: readonly AdaptationStateLedgerRecord[];
  validation: AdaptationStateValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  proposal_available: boolean;
  permits_execution: false;
  mutates_adaptive_behavior: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationStateMachineFoundation = Readonly<{
  state_machine_version: "adaptation-state-machine/v1";
  checks: readonly AdaptationStateCheck[];
  states: readonly AdaptationLifecycleState[];
  result: AdaptationStateMachineResult;
}>;
