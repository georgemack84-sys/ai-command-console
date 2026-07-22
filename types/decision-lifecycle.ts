import type { DecisionClassificationResult } from "@/types/decision-classification";

export type DecisionLifecycleState =
  | "CREATED"
  | "VALIDATING"
  | "INPUT_ACCEPTED"
  | "EVIDENCE_READY"
  | "GOVERNANCE_REVIEW"
  | "CONSTITUTION_REVIEW"
  | "AUTHORITY_VALIDATION"
  | "READY_FOR_ORCHESTRATION"
  | "ORCHESTRATED"
  | "OPERATOR_VISIBLE"
  | "PENDING_DECISION"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "AWAITING_INPUT"
  | "COMPLETED"
  | "ARCHIVED";

export type DecisionFailureState =
  | "VALIDATION_FAILED"
  | "GOVERNANCE_FAILED"
  | "CONSTITUTION_FAILED"
  | "AUTHORITY_FAILED"
  | "REPLAY_FAILED"
  | "INTEGRITY_FAILED"
  | "TENANT_ISOLATION_FAILED"
  | "SERIALIZATION_FAILED"
  | "UNKNOWN_STATE";

export type DecisionLifecycleAnyState = DecisionLifecycleState | DecisionFailureState;
export type DecisionLifecycleActorType = "SYSTEM" | "OPERATOR" | "GOVERNANCE" | "CONSTITUTION" | "REPLAY" | "CERTIFICATION";
export type DecisionLifecycleStatus = "VALID" | "FAILED_CLOSED";

export type DecisionLifecycleRecord = Readonly<{
  lifecycle_id: string;
  orchestration_id: string;
  previous_state: DecisionLifecycleAnyState | null;
  current_state: DecisionLifecycleAnyState;
  transition_reason: string;
  transition_timestamp: string;
  actor_type: DecisionLifecycleActorType;
  actor_id?: string;
  governance_status: "PASSED" | "FAILED";
  constitutional_status: "PASSED" | "FAILED";
  authority_status: "PASSED" | "FAILED";
  replay_reference: string;
  tenant_id: string;
  mission_id: string;
  append_only: true;
  advisory_only: true;
  execution_authorized: false;
  integrity_hash: string;
}>;

export type DecisionLifecycleRepository = Readonly<{
  lifecycle_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  classification: DecisionClassificationResult;
  current_state: DecisionLifecycleAnyState;
  history: readonly DecisionLifecycleRecord[];
  failures: readonly DecisionLifecycleFailure[];
  terminal: boolean;
  archived: boolean;
  advisory_only: true;
  execution_authorized: false;
  integrity_hash: string;
}>;

export type DecisionLifecycleFailure =
  | "INVALID_STATE"
  | "INVALID_TRANSITION"
  | "TERMINAL_STATE_IMMUTABLE"
  | "ARCHIVED_STATE_IMMUTABLE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "AUTHORITY_ESCALATION"
  | "REPLAY_REFERENCE_MISSING"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "SERIALIZATION_NONDETERMINISTIC"
  | "ADVISORY_ONLY_VIOLATION";

export type DecisionLifecycleTransitionInput = Readonly<{
  lifecycle: DecisionLifecycleRepository;
  next_state: DecisionLifecycleState;
  transition_reason?: string;
  actor_type?: DecisionLifecycleActorType;
  actor_id?: string;
  governance_status?: "PASSED" | "FAILED";
  constitutional_status?: "PASSED" | "FAILED";
  authority_status?: "PASSED" | "FAILED";
  replay_reference?: string;
  tenant_id?: string;
  execution_authorized?: boolean;
  transition_timestamp?: string;
}>;

export type DecisionLifecycleValidationResult = Readonly<{
  validation_status: DecisionLifecycleStatus;
  lifecycle_id: string;
  current_state: DecisionLifecycleAnyState;
  failures: readonly DecisionLifecycleFailure[];
  checks: Readonly<{
    state_known: boolean;
    transition_allowed: boolean;
    terminal_immutable: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    authority_valid: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only_enforced: boolean;
    append_only_history: boolean;
  }>;
}>;

export type DecisionLifecycleReplayResult = Readonly<{
  lifecycle_id: string;
  replay_valid: boolean;
  state_sequence: readonly DecisionLifecycleAnyState[];
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly DecisionLifecycleFailure[];
}>;

export type DecisionLifecycleObservability = Readonly<{
  active_lifecycle_states: Readonly<Record<string, number>>;
  transition_count: number;
  transition_failures: number;
  invalid_transition_attempts: number;
  average_state_duration_ms: number;
  replay_mismatches: number;
  lifecycle_completion_rate: number;
  failure_state_frequency: Readonly<Record<string, number>>;
  deferred_decision_count: number;
  archived_decision_count: number;
}>;
