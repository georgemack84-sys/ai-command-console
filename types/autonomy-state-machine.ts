import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";

export type AutonomyOperationalState =
  | "CREATED"
  | "INITIALIZED"
  | "VALIDATED"
  | "READY"
  | "MONITORING"
  | "ACTIVE"
  | "LIMITED"
  | "PAUSED"
  | "SUSPENDED"
  | "RESUMING"
  | "RETIRED"
  | "ARCHIVED";

export type AutonomyTransitionValidationState = "PASS" | "FAIL";
export type AutonomyTransitionTriggeringEvent =
  | "IDENTITY_CREATED"
  | "DEPENDENCIES_LOADED"
  | "VALIDATION_COMPLETED"
  | "OPERATOR_READY"
  | "MONITORING_STARTED"
  | "ACTIVATION_APPROVED"
  | "GOVERNANCE_LIMIT"
  | "OPERATOR_PAUSE"
  | "GOVERNANCE_SUSPENSION"
  | "RECOVERY_STARTED"
  | "RECOVERY_CLEARED"
  | "RETIREMENT_REQUESTED"
  | "ARCHIVAL_COMPLETED";
export type AutonomyTransitionScenario =
  | "BASELINE"
  | "UNKNOWN_STATE"
  | "SKIPPED_TRANSITION"
  | "CIRCULAR_TRANSITION"
  | "HIDDEN_STATE"
  | "MISSING_LEDGER"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "MISSING_OPERATOR_VISIBILITY"
  | "AUTHORITY_ESCALATION"
  | "TENANT_MISMATCH"
  | "GOVERNANCE_FORCED_LIMIT"
  | "DIRECT_SUSPENDED_ACTIVE"
  | "ARCHIVED_REACTIVATION"
  | "HASH_MISMATCH";

export type AutonomyStateFailureReason =
  | "STATE_CONTEXT_MISSING"
  | "IDENTITY_VALIDATION_FAILED"
  | "CONTRACT_VALIDATION_FAILED"
  | "UNKNOWN_STATE"
  | "SKIPPED_TRANSITION"
  | "CIRCULAR_TRANSITION"
  | "ILLEGAL_TRANSITION"
  | "ILLEGAL_RECOVERY"
  | "HIDDEN_STATE_DETECTED"
  | "UNDEFINED_LIFECYCLE"
  | "LEDGER_ENTRY_MISSING"
  | "GOVERNANCE_CONTEXT_MISSING"
  | "AUTHORITY_SCOPE_MISSING"
  | "AUTHORITY_ESCALATION"
  | "TENANT_OWNERSHIP_INVALID"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "OPERATOR_VISIBILITY_MISSING"
  | "OPERATOR_APPROVAL_MISSING"
  | "REPLAY_VALIDATION_MISSING"
  | "TERMINAL_REACTIVATION"
  | "GOVERNANCE_FORCED_TRANSITION_OVERRIDDEN"
  | "TRANSITION_ORDER_MISMATCH"
  | "STATE_RESULT_MISMATCH"
  | "GOVERNANCE_REASON_MISMATCH"
  | "TRANSITION_MISSING";

export type AutonomyStateContext = Readonly<{
  identity: AutonomyIdentityRecord;
  current_state: AutonomyOperationalState;
  previous_state: AutonomyOperationalState | null;
  hidden_state?: string;
  lifecycle_history: readonly AutonomyTransitionRecord[];
  state_hash: string;
}>;

export type AutonomyTransitionRequest = Readonly<{
  previous_state: AutonomyOperationalState;
  next_state: AutonomyOperationalState;
  transition_reason: string;
  triggering_event: AutonomyTransitionTriggeringEvent;
  governance_profile: string;
  authority_scope: AutonomyAuthorityScope;
  operator_reference: string;
  replay_reference: string;
  governance_forced?: boolean;
  operator_approved?: boolean;
  replay_validated?: boolean;
  visibility_available?: boolean;
}>;

export type AutonomyTransitionRecord = Readonly<{
  transition_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  previous_state: AutonomyOperationalState;
  next_state: AutonomyOperationalState;
  transition_reason: string;
  triggering_event: AutonomyTransitionTriggeringEvent;
  governance_profile: string;
  authority_scope: AutonomyAuthorityScope;
  operator_reference: string;
  replay_reference: string;
  governance_forced: boolean;
  operator_approved: boolean;
  replay_validated: boolean;
  visibility_available: boolean;
  integrity_hash: string;
  timestamp: string;
  validation_state: AutonomyTransitionValidationState;
  failure_reason: AutonomyStateFailureReason | null;
  ledger_recorded: true;
}>;

export type AutonomyTransitionValidationFailure = Readonly<{
  failure_id: string;
  reason: AutonomyStateFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type AutonomyTransitionValidationResult = Readonly<{
  validation_id: string;
  autonomy_id: string;
  previous_state: AutonomyOperationalState;
  next_state: AutonomyOperationalState;
  validation_state: AutonomyTransitionValidationState;
  transition_allowed: boolean;
  failures: readonly AutonomyTransitionValidationFailure[];
  governed: boolean;
  authority_validated: boolean;
  tenant_validated: boolean;
  replayable: boolean;
  operator_visible: boolean;
  recoverable: boolean;
  integrity_hash: string | null;
}>;

export type AutonomyTransitionLedger = Readonly<{
  ledger_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  transitions: readonly AutonomyTransitionRecord[];
  lifecycle_states: readonly AutonomyOperationalState[];
  replay_references: readonly string[];
  governance_profiles: readonly string[];
  ledger_hash: string;
}>;

export type AutonomyStateReplayResult = Readonly<{
  replay_id: string;
  autonomy_id: string;
  reconstructed_states: readonly AutonomyOperationalState[];
  transition_ids: readonly string[];
  transition_reasons: readonly string[];
  governance_inputs: readonly string[];
  authority_checks: readonly AutonomyAuthorityScope[];
  operator_interventions: readonly string[];
  integrity_hashes: readonly string[];
  timestamps: readonly string[];
  lifecycle_outcome: AutonomyOperationalState;
  validation_state: AutonomyTransitionValidationState;
  failure_reason: AutonomyStateFailureReason | null;
  replay_hash: string;
}>;

export type AutonomyStateVisibilitySurface = Readonly<{
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  current_state: AutonomyOperationalState;
  previous_state: AutonomyOperationalState | null;
  next_eligible_states: readonly AutonomyOperationalState[];
  blocked_transitions: readonly AutonomyOperationalState[];
  transition_reason: string | null;
  governance_influence: string;
  authority_status: "VALIDATED" | "BLOCKED";
  replay_reference: string;
  lifecycle_history: readonly AutonomyTransitionRecord[];
  integrity_status: "VALID" | "INVALID";
  recovery_status: "NOT_REQUIRED" | "RECOVERABLE" | "BLOCKED";
  hidden_state_visible: false;
}>;

export type AutonomyStateModel = Readonly<{
  states: readonly AutonomyOperationalState[];
  valid_transitions: Readonly<Record<AutonomyOperationalState, readonly AutonomyOperationalState[]>>;
  recovery_paths: readonly (readonly AutonomyOperationalState[])[];
  terminal_states: readonly AutonomyOperationalState[];
  invalid_states: readonly string[];
}>;
