import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { TaskSequencePackage, TaskSequenceValidationResult } from "@/types/task-sequencing";

export type DependencySchedulerCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DependencyCategory = "TASK" | "RESOURCE" | "GOVERNANCE" | "OPERATOR_APPROVAL" | "EXTERNAL" | "POLICY" | "SYNCHRONIZATION" | "CHECKPOINT";
export type DependencyLifecycleState = "DISCOVERED" | "REGISTERED" | "VALIDATING" | "SATISFIED" | "READY" | "BLOCKED" | "EXPIRED" | "FAILED";
export type ExecutionReadinessState = "READY" | "WAITING" | "BLOCKED" | "FAILED";
export type RecoveryRecommendationType = "WAIT_FOR_DEPENDENCY" | "RETRY_VALIDATION" | "REQUEST_OPERATOR_APPROVAL" | "SCHEDULE_ALTERNATIVE_RESOURCE" | "PAUSE_WORKFLOW" | "PREPARE_ROLLBACK" | "ESCALATE_TO_GOVERNANCE";

export type DependencySchedulerScenario =
  | "BASELINE"
  | "INVALID_TASK_SEQUENCE"
  | "MISSING_DEPENDENCY"
  | "CIRCULAR_DEPENDENCY"
  | "BLOCKED_WORKFLOW"
  | "DEPENDENCY_TIMEOUT"
  | "DEPENDENCY_VIOLATION"
  | "RESOURCE_CONFLICT"
  | "GOVERNANCE_FAILURE"
  | "APPROVAL_MISSING"
  | "EXTERNAL_PREREQUISITE_MISSING"
  | "POLICY_VIOLATION"
  | "SYNC_BARRIER_UNSATISFIED"
  | "CHECKPOINT_MISSING"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "TENANT_VIOLATION"
  | "INTEGRITY_MISMATCH"
  | "CONDITIONAL_MONITORING_GAP";

export type DependencySchedulerFailureReason =
  | "INVALID_TASK_SEQUENCE"
  | "MISSING_DEPENDENCY"
  | "CIRCULAR_DEPENDENCY"
  | "BLOCKED_WORKFLOW"
  | "DEPENDENCY_TIMEOUT"
  | "DEPENDENCY_VIOLATION"
  | "RESOURCE_CONFLICT"
  | "GOVERNANCE_FAILURE"
  | "APPROVAL_MISSING"
  | "EXTERNAL_PREREQUISITE_MISSING"
  | "POLICY_VIOLATION"
  | "SYNC_BARRIER_UNSATISFIED"
  | "CHECKPOINT_DEPENDENCY_MISSING"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "TENANT_ISOLATION_VIOLATION"
  | "MONITORING_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type DependencyRegistryEntry = Readonly<{
  dependency_id: string;
  dependency_type: DependencyCategory;
  owner_task_id: string;
  dependency_target: string;
  dependency_status: DependencyLifecycleState;
  validation_history: readonly string[];
  replay_reference: string;
  lineage_reference: string;
}>;

export type DependencyGraphEdge = Readonly<{
  edge_id: string;
  from_dependency_id: string;
  to_dependency_id: string;
  relationship: "PRECEDES" | "REQUIRES" | "SYNCHRONIZES_WITH" | "GATES" | "APPROVES";
}>;

export type TaskReadinessRecord = Readonly<{
  task_id: string;
  readiness_state: ExecutionReadinessState;
  satisfied_dependencies: readonly string[];
  waiting_dependencies: readonly string[];
  blocking_dependencies: readonly string[];
  governance_ready: boolean;
  authority_ready: boolean;
  resources_ready: boolean;
  approvals_ready: boolean;
  policy_ready: boolean;
  explanation: string;
}>;

export type DependencyEvent = Readonly<{
  dependency_event_id: string;
  event_order: number;
  dependency_id: string;
  event_type: "DEPENDENCY_REGISTERED" | "DEPENDENCY_VALIDATED" | "READINESS_EVALUATED" | "BLOCKING_DETECTED" | "RECOVERY_RECOMMENDED" | "SCHEDULE_PUBLISHED";
  dependency_status: DependencyLifecycleState;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type BlockingReason = Readonly<{
  blocking_reason_id: string;
  task_id: string;
  dependency_id: string;
  reason: DependencySchedulerFailureReason;
  owner: string;
  impact_assessment: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expected_resolution: string;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  task_id: string;
  dependency_id: string;
  recommendation_type: RecoveryRecommendationType;
  rationale: string;
  advisory_only: true;
  governance_reference: string;
  replay_reference: string;
}>;

export type DependencyMonitorRecord = Readonly<{
  monitor_id: string;
  dependency_id: string;
  health_state: "HEALTHY" | "DEGRADED" | "TIMED_OUT" | "FAILED";
  latency_state: "NORMAL" | "SLOW" | "TIMEOUT";
  governance_valid: boolean;
  readiness_valid: boolean;
  last_observed_event: string;
}>;

export type DependencySchedulePackage = Readonly<{
  dependency_schedule_id: string;
  execution_id: string;
  workflow_id: string;
  sequence_id: string;
  tenant_id: string;
  dependency_registry: readonly DependencyRegistryEntry[];
  dependency_graph: readonly DependencyGraphEdge[];
  task_dependencies: readonly DependencyRegistryEntry[];
  resource_dependencies: readonly DependencyRegistryEntry[];
  governance_dependencies: readonly DependencyRegistryEntry[];
  operator_dependencies: readonly DependencyRegistryEntry[];
  external_dependencies: readonly DependencyRegistryEntry[];
  policy_dependencies: readonly DependencyRegistryEntry[];
  dependency_status: ExecutionReadinessState;
  ready_tasks: readonly string[];
  blocked_tasks: readonly string[];
  waiting_tasks: readonly string[];
  readiness_records: readonly TaskReadinessRecord[];
  dependency_events: readonly DependencyEvent[];
  monitoring_records: readonly DependencyMonitorRecord[];
  blocking_reasons: readonly BlockingReason[];
  recovery_recommendations: readonly RecoveryRecommendation[];
  governance_reference: string;
  authority_reference: string;
  lineage_reference: string;
  replay_reference: string;
  source_sequence: TaskSequencePackage;
  integrity_hash: string;
}>;

export type DependencyScheduleValidationResult = Readonly<{
  validation_id: string;
  dependency_schedule_id: string;
  certification_state: DependencySchedulerCertificationState;
  failures: readonly DependencySchedulerFailureReason[];
  warnings: readonly DependencySchedulerFailureReason[];
  registry_complete: boolean;
  graph_complete: boolean;
  graph_acyclic: boolean;
  readiness_deterministic: boolean;
  governance_enforced: boolean;
  authority_enforced: boolean;
  approvals_enforced: boolean;
  resources_available: boolean;
  replay_consistent: boolean;
  lineage_complete: boolean;
  recovery_recommendations_advisory: boolean;
  ready_for_execution_monitor: boolean;
  validation_hash: string;
}>;

export type DependencyScheduleReplayResult = Readonly<{
  replay_id: string;
  dependency_schedule_id: string;
  replay_dependency_order: readonly string[];
  replay_ready_tasks: readonly string[];
  replay_blocked_tasks: readonly string[];
  replay_event_order: readonly string[];
  validation_state: DependencySchedulerCertificationState;
  failure_reason: DependencySchedulerFailureReason | null;
  replay_hash: string;
}>;

export type DependencyScheduleVisibilitySurface = Readonly<{
  dependency_schedule_id: string;
  execution_id: string;
  workflow_id: string;
  dependency_status: ExecutionReadinessState;
  ready_tasks: readonly string[];
  blocked_tasks: readonly string[];
  waiting_tasks: readonly string[];
  blocking_reasons: readonly DependencySchedulerFailureReason[];
  recovery_recommendations: readonly RecoveryRecommendationType[];
  dependency_count: number;
  integrity_status: "VALID" | "INVALID";
}>;

export type DependencySchedulerFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  sequence_validation: TaskSequenceValidationResult;
  schedule: DependencySchedulePackage;
  validation: DependencyScheduleValidationResult;
  replay: DependencyScheduleReplayResult;
  visibility: DependencyScheduleVisibilitySurface;
}>;
