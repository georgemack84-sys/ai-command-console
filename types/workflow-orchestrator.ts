import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ExecutionContract, ExecutionContractValidationResult } from "@/types/execution-contract";

export type WorkflowCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type WorkflowState = "REGISTERED" | "ACTIVATED" | "READY" | "RUNNING" | "WAITING" | "SYNCHRONIZING" | "PAUSED" | "RESUMED" | "COMPLETED" | "FAILED" | "ROLLED_BACK" | "TERMINATED";
export type WorkflowEventType =
  | "WORKFLOW_ACTIVATED"
  | "TASK_STARTED"
  | "TASK_COMPLETED"
  | "WORKFLOW_PAUSED"
  | "WORKFLOW_RESUMED"
  | "DEPENDENCY_SATISFIED"
  | "SYNCHRONIZATION_COMPLETED"
  | "CHECKPOINT_CREATED"
  | "FAILURE_DETECTED"
  | "ROLLBACK_PREPARED"
  | "WORKFLOW_COMPLETED";

export type WorkflowOrchestratorScenario =
  | "BASELINE"
  | "UNAUTHORIZED_WORKFLOW"
  | "INVALID_EXECUTION_CONTRACT"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "INCOMPLETE_DEPENDENCIES"
  | "INVALID_AUTHORITY_SCOPE"
  | "ILLEGAL_TRANSITION"
  | "SKIPPED_STATE"
  | "DUPLICATE_TRANSITION"
  | "SYNCHRONIZATION_CONFLICT"
  | "DEADLOCK"
  | "RACE_CONDITION"
  | "MISSING_EVENT"
  | "REPLAY_DIVERGENCE"
  | "HIDDEN_ORCHESTRATION"
  | "COMPLETION_INCOMPLETE"
  | "LINEAGE_BROKEN"
  | "TENANT_VIOLATION"
  | "CONDITIONAL_TELEMETRY_GAP";

export type WorkflowFailureReason =
  | "UNAUTHORIZED_WORKFLOW"
  | "INVALID_EXECUTION_CONTRACT"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "INCOMPLETE_DEPENDENCIES"
  | "INVALID_AUTHORITY_SCOPE"
  | "ILLEGAL_STATE_TRANSITION"
  | "WORKFLOW_STATE_SKIPPED"
  | "DUPLICATE_STATE_TRANSITION"
  | "SYNCHRONIZATION_CONFLICT"
  | "DEADLOCK_DETECTED"
  | "RACE_CONDITION"
  | "MISSING_DEPENDENCY"
  | "TIMING_VIOLATION"
  | "MISSING_ORCHESTRATION_EVENT"
  | "REPLAY_DIVERGENCE"
  | "HIDDEN_ORCHESTRATION_PATH"
  | "COMPLETION_CRITERIA_UNMET"
  | "LINEAGE_BROKEN"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "TELEMETRY_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type WorkflowActivationRecord = Readonly<{
  activation_id: string;
  workflow_id: string;
  execution_id: string;
  activation_state: "ACTIVATED" | "REJECTED";
  activation_timestamp: string;
  governance_reference: string;
  authority_reference: string;
  dependency_readiness: "READY" | "INCOMPLETE";
  activation_lineage: string;
}>;

export type WorkflowTransition = Readonly<{
  transition_id: string;
  from_state: WorkflowState;
  to_state: WorkflowState;
  triggering_event: WorkflowEventType;
  responsible_component: string;
  authority_reference: string;
  governance_validation: string;
  replay_reference: string;
  timestamp: string;
}>;

export type WorkflowSynchronizationPoint = Readonly<{
  synchronization_id: string;
  dependent_tasks: readonly string[];
  synchronization_state: "READY" | "WAITING" | "CONFLICT" | "DEADLOCK";
  governance_gate: string;
  checkpoint_reference: string;
  recovery_recommendation: string | null;
}>;

export type OrchestrationEvent = Readonly<{
  event_id: string;
  event_type: WorkflowEventType;
  event_order: number;
  workflow_state: WorkflowState;
  task_id: string | null;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type WorkflowLineageRecord = Readonly<{
  lineage_id: string;
  workflow_id: string;
  transition_refs: readonly string[];
  event_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type WorkflowCompletionSummary = Readonly<{
  completion_id: string;
  completion_status: "PENDING" | "COMPLETE" | "FAILED" | "ROLLED_BACK" | "TERMINATED";
  all_tasks_completed: boolean;
  dependencies_satisfied: boolean;
  governance_maintained: boolean;
  checkpoints_finalized: boolean;
  replay_generated: boolean;
  execution_statistics: Readonly<{
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    synchronization_points: number;
  }>;
}>;

export type OrchestratedWorkflow = Readonly<{
  workflow_id: string;
  execution_id: string;
  plan_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_version: string;
  workflow_state: WorkflowState;
  activation_record: WorkflowActivationRecord;
  current_stage: string;
  current_task: string | null;
  transition_history: readonly WorkflowTransition[];
  active_dependencies: readonly string[];
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  synchronization_points: readonly WorkflowSynchronizationPoint[];
  orchestration_events: readonly OrchestrationEvent[];
  checkpoints: readonly string[];
  rollback_reference: string;
  completion_summary: WorkflowCompletionSummary;
  governance_reference: string;
  authority_reference: string;
  lineage: WorkflowLineageRecord;
  replay_reference: string;
  hidden_orchestration_paths: boolean;
  execution_contract: ExecutionContract;
  integrity_hash: string;
}>;

export type WorkflowOrchestrationValidationResult = Readonly<{
  validation_id: string;
  workflow_id: string;
  certification_state: WorkflowCertificationState;
  failures: readonly WorkflowFailureReason[];
  warnings: readonly WorkflowFailureReason[];
  execution_contract_valid: boolean;
  workflow_consistent: boolean;
  state_consistent: boolean;
  dependency_integrity_valid: boolean;
  synchronization_integrity_valid: boolean;
  governance_compliance_preserved: boolean;
  authority_compliance_preserved: boolean;
  replay_consistency_preserved: boolean;
  lineage_complete: boolean;
  tenant_isolation_enforced: boolean;
  ready_for_task_sequencing: boolean;
  validation_hash: string;
}>;

export type WorkflowReplayResult = Readonly<{
  replay_id: string;
  workflow_id: string;
  replay_transition_order: readonly WorkflowState[];
  replay_event_order: readonly WorkflowEventType[];
  replay_lineage_reference: string;
  validation_state: WorkflowCertificationState;
  failure_reason: WorkflowFailureReason | null;
  replay_hash: string;
}>;

export type WorkflowVisibilitySurface = Readonly<{
  workflow_id: string;
  execution_id: string;
  workflow_state: WorkflowState;
  current_task: string | null;
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  synchronization_states: readonly string[];
  event_count: number;
  governance_reference: string;
  authority_reference: string;
  failure_reasons: readonly WorkflowFailureReason[];
  integrity_status: "VALID" | "INVALID";
}>;

export type WorkflowOrchestratorFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  execution_contract_validation: ExecutionContractValidationResult;
  workflow: OrchestratedWorkflow;
  validation: WorkflowOrchestrationValidationResult;
  replay: WorkflowReplayResult;
  visibility: WorkflowVisibilitySurface;
}>;
