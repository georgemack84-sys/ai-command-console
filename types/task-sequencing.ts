import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { OrchestratedWorkflow, WorkflowOrchestrationValidationResult } from "@/types/workflow-orchestrator";

export type TaskSequencingCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type SequencedTaskType = "SEQUENTIAL" | "PARALLEL" | "GATED" | "CONDITIONAL" | "APPROVAL" | "SYNCHRONIZATION" | "RECOVERY" | "CHECKPOINT";
export type TaskEligibilityState = "ELIGIBLE" | "WAITING" | "BLOCKED";
export type SequenceState = "GENERATED" | "VALIDATED" | "PUBLISHED" | "REJECTED";

export type TaskSequencingScenario =
  | "BASELINE"
  | "INVALID_WORKFLOW"
  | "MISSING_TASK_CLASSIFICATION"
  | "NONDETERMINISTIC_ORDERING"
  | "DEPENDENCY_VIOLATION"
  | "DUPLICATE_SCHEDULING"
  | "MISSING_TASK"
  | "SKIPPED_GATE"
  | "MISSING_APPROVAL"
  | "INVALID_AUTHORITY"
  | "GOVERNANCE_VIOLATION"
  | "CONDITIONAL_BLOCKED"
  | "SYNCHRONIZATION_FAILURE"
  | "RACE_CONDITION"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISMATCH"
  | "CONDITIONAL_LEDGER_GAP";

export type TaskSequencingFailureReason =
  | "INVALID_WORKFLOW"
  | "TASK_CLASSIFICATION_MISSING"
  | "NONDETERMINISTIC_ORDERING"
  | "DEPENDENCY_ORDER_VIOLATION"
  | "DUPLICATE_TASK_SCHEDULING"
  | "MISSING_TASK"
  | "GATE_SKIPPED"
  | "APPROVAL_MISSING"
  | "INVALID_AUTHORITY"
  | "GOVERNANCE_VIOLATION"
  | "CONDITIONAL_RULE_UNSATISFIED"
  | "SYNCHRONIZATION_FAILURE"
  | "RACE_CONDITION"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "LEDGER_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type TaskClassification = Readonly<{
  task_id: string;
  task_type: SequencedTaskType;
  execution_stage: number;
  dependency_profile: readonly string[];
  governance_requirements: readonly string[];
  authority_requirements: readonly string[];
  scheduling_metadata: readonly string[];
}>;

export type SequencedTask = Readonly<{
  sequence_task_id: string;
  task_id: string;
  sequence_index: number;
  execution_stage: number;
  task_type: SequencedTaskType;
  eligibility_state: TaskEligibilityState;
  dependency_refs: readonly string[];
  gate_refs: readonly string[];
  approval_refs: readonly string[];
  lineage_reference: string;
  replay_reference: string;
}>;

export type SequencingParallelGroup = Readonly<{
  parallel_group_id: string;
  branch_id: string;
  task_ids: readonly string[];
  synchronization_barrier: string;
  deterministic_order: readonly string[];
  conflict_state: "CLEAR" | "CONFLICT" | "RACE";
}>;

export type GateRequirement = Readonly<{
  gate_id: string;
  gate_type: "GOVERNANCE" | "AUTHORITY" | "COMPLIANCE" | "DEPENDENCY" | "OPERATOR_APPROVAL" | "POLICY";
  task_id: string;
  validation_reference: string;
  satisfied: boolean;
}>;

export type ConditionalRule = Readonly<{
  rule_id: string;
  task_id: string;
  condition: string;
  evaluation_state: TaskEligibilityState;
  evidence_ref: string;
}>;

export type ApprovalRequirement = Readonly<{
  approval_id: string;
  task_id: string;
  approval_type: "OPERATOR" | "GOVERNANCE" | "POLICY";
  approval_reference: string;
  approval_state: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  approval_lineage: string;
}>;

export type SequenceEvent = Readonly<{
  sequence_event_id: string;
  event_order: number;
  event_type: "TASK_CLASSIFIED" | "DEPENDENCY_RESOLVED" | "GATE_VALIDATED" | "TASK_SCHEDULED" | "PARALLEL_GROUP_FORMED" | "APPROVAL_SCHEDULED" | "SEQUENCE_VALIDATED" | "SEQUENCE_PUBLISHED";
  task_id: string | null;
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type SchedulingLedgerEntry = Readonly<{
  ledger_entry_id: string;
  decision: string;
  task_id: string | null;
  sequence_reference: string;
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
}>;

export type TaskSequencePackage = Readonly<{
  sequence_id: string;
  execution_id: string;
  workflow_id: string;
  sequence_version: string;
  task_classifications: readonly TaskClassification[];
  task_order: readonly SequencedTask[];
  parallel_groups: readonly SequencingParallelGroup[];
  dependency_graph: readonly string[];
  gate_requirements: readonly GateRequirement[];
  conditional_rules: readonly ConditionalRule[];
  approval_requirements: readonly ApprovalRequirement[];
  current_sequence_state: SequenceState;
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  blocked_tasks: readonly string[];
  synchronization_points: readonly string[];
  sequence_events: readonly SequenceEvent[];
  scheduling_ledger: readonly SchedulingLedgerEntry[];
  governance_reference: string;
  authority_reference: string;
  lineage_reference: string;
  replay_reference: string;
  source_workflow: OrchestratedWorkflow;
  integrity_hash: string;
}>;

export type TaskSequenceValidationResult = Readonly<{
  validation_id: string;
  sequence_id: string;
  certification_state: TaskSequencingCertificationState;
  failures: readonly TaskSequencingFailureReason[];
  warnings: readonly TaskSequencingFailureReason[];
  task_classification_complete: boolean;
  deterministic_ordering_valid: boolean;
  dependency_preservation_valid: boolean;
  governance_gates_enforced: boolean;
  approvals_scheduled: boolean;
  synchronization_valid: boolean;
  replay_consistency_valid: boolean;
  ledger_complete: boolean;
  ready_for_dependency_scheduler: boolean;
  validation_hash: string;
}>;

export type TaskSequenceReplayResult = Readonly<{
  replay_id: string;
  sequence_id: string;
  replay_task_order: readonly string[];
  replay_parallel_groups: readonly string[];
  replay_event_order: readonly string[];
  validation_state: TaskSequencingCertificationState;
  failure_reason: TaskSequencingFailureReason | null;
  replay_hash: string;
}>;

export type TaskSequenceVisibilitySurface = Readonly<{
  sequence_id: string;
  workflow_id: string;
  execution_id: string;
  sequence_state: SequenceState;
  task_order: readonly string[];
  eligible_tasks: readonly string[];
  blocked_tasks: readonly string[];
  pending_tasks: readonly string[];
  parallel_groups: readonly (readonly string[])[];
  gate_count: number;
  approval_count: number;
  failure_reasons: readonly TaskSequencingFailureReason[];
  integrity_status: "VALID" | "INVALID";
}>;

export type TaskSequencingFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  workflow_validation: WorkflowOrchestrationValidationResult;
  sequence: TaskSequencePackage;
  validation: TaskSequenceValidationResult;
  replay: TaskSequenceReplayResult;
  visibility: TaskSequenceVisibilitySurface;
}>;
