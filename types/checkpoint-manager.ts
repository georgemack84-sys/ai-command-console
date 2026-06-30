import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ExecutionMonitorPackage, ExecutionMonitorValidationResult } from "@/types/execution-monitor";

export type CheckpointCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CheckpointLifecycleState = "REQUESTED" | "CAPTURING" | "VALIDATING" | "CERTIFIED" | "REGISTERED" | "AVAILABLE" | "INVALID" | "CORRUPTED" | "ARCHIVED";
export type CheckpointTrigger = "WORKFLOW_MILESTONE" | "EXECUTION_STAGE_COMPLETED" | "GOVERNANCE_APPROVAL" | "OPERATOR_REQUEST" | "PRE_ROLLBACK_PREPARATION" | "EXECUTION_COMPLETION" | "SCHEDULED_INTERVAL";

export type CheckpointManagerScenario =
  | "BASELINE"
  | "INVALID_MONITOR"
  | "MISSING_EXECUTION_STATE"
  | "MISSING_WORKFLOW_STATE"
  | "MISSING_DEPENDENCY_STATE"
  | "MISSING_RESOURCE_STATE"
  | "MISSING_GOVERNANCE_SNAPSHOT"
  | "MISSING_AUTHORITY_SNAPSHOT"
  | "MISSING_APPROVAL_SNAPSHOT"
  | "MISSING_ROLLBACK_REFERENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "LINEAGE_BROKEN"
  | "TENANT_VIOLATION"
  | "CHECKPOINT_CORRUPTION"
  | "INTEGRITY_MISMATCH"
  | "REPLAY_INCOMPATIBLE"
  | "DUPLICATE_CHECKPOINT"
  | "CHECKPOINT_ORDER_VIOLATION"
  | "CONDITIONAL_RETENTION_GAP";

export type CheckpointFailureReason =
  | "INVALID_EXECUTION_MONITOR"
  | "EXECUTION_STATE_INCOMPLETE"
  | "WORKFLOW_STATE_INCOMPLETE"
  | "DEPENDENCY_STATE_INCOMPLETE"
  | "RESOURCE_STATE_INCOMPLETE"
  | "GOVERNANCE_SNAPSHOT_MISSING"
  | "AUTHORITY_SNAPSHOT_MISSING"
  | "APPROVAL_SNAPSHOT_INCOMPLETE"
  | "ROLLBACK_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "REPLAY_INCOMPATIBLE"
  | "LINEAGE_BROKEN"
  | "TENANT_ISOLATION_VIOLATION"
  | "DUPLICATE_CHECKPOINT"
  | "CHECKPOINT_ORDER_VIOLATION"
  | "CHECKPOINT_CORRUPTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "RETENTION_POLICY_GAP";

export type CheckpointTimestamp = Readonly<{
  requested_at: string;
  captured_at: string;
  certified_at: string | null;
  registered_at: string | null;
}>;

export type ExecutionStateSnapshot = Readonly<{
  execution_id: string;
  execution_status: string;
  progress_percentage: number;
  active_tasks: readonly string[];
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  execution_timing_ms: number;
  orchestration_metadata_ref: string;
}>;

export type WorkflowStateSnapshot = Readonly<{
  workflow_id: string;
  workflow_state: string;
  execution_stage: string;
  current_task: string | null;
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  synchronization_state: string;
  execution_ordering: readonly string[];
}>;

export type DependencyStateSnapshot = Readonly<{
  dependency_graph_ref: string;
  satisfied_dependencies: readonly string[];
  pending_dependencies: readonly string[];
  blocked_dependencies: readonly string[];
  synchronization_barriers: readonly string[];
  dependency_validation_ref: string;
}>;

export type ResourceStateSnapshot = Readonly<{
  compute_utilization: number;
  storage_allocation: number;
  network_status: string;
  execution_resources: readonly string[];
  service_availability: string;
}>;

export type GovernanceStateSnapshot = Readonly<{
  governance_state: string;
  policy_snapshot_ref: string;
  constitutional_validation: boolean;
  compliance_status: boolean;
  risk_assessment_ref: string;
  recommendation_refs: readonly string[];
}>;

export type AuthorityStateSnapshot = Readonly<{
  authority_scope: string;
  operator_authority: string;
  delegated_authority: readonly string[];
  approval_status: string;
  authorization_refs: readonly string[];
}>;

export type ApprovalStateSnapshot = Readonly<{
  completed_approvals: readonly string[];
  pending_approvals: readonly string[];
  rejected_approvals: readonly string[];
  approval_timestamps: readonly string[];
  approval_lineage: readonly string[];
}>;

export type RollbackReference = Readonly<{
  rollback_identifier: string;
  recovery_boundary: string;
  rollback_sequence: readonly string[];
  recovery_eligibility: boolean;
}>;

export type CheckpointLineageReference = Readonly<{
  lineage_id: string;
  parent_checkpoint_id: string | null;
  child_checkpoint_ids: readonly string[];
  execution_sequence: number;
  workflow_progression: readonly string[];
  rollback_refs: readonly string[];
  replay_lineage: readonly string[];
}>;

export type CertifiedCheckpoint = Readonly<{
  checkpoint_id: string;
  checkpoint_version: string;
  trigger: CheckpointTrigger;
  lifecycle_state: CheckpointLifecycleState;
  tenant_id: string;
  execution_id: string;
  workflow_id: string;
  workflow_state: WorkflowStateSnapshot;
  execution_state: ExecutionStateSnapshot;
  completed_tasks: readonly string[];
  pending_tasks: readonly string[];
  active_tasks: readonly string[];
  resource_state: ResourceStateSnapshot;
  dependency_state: DependencyStateSnapshot;
  governance_snapshot: GovernanceStateSnapshot;
  authority_snapshot: AuthorityStateSnapshot;
  operator_approvals: ApprovalStateSnapshot;
  rollback_reference: RollbackReference;
  replay_reference: string;
  lineage_reference: CheckpointLineageReference;
  immutable: true;
  recovery_executed: false;
  timestamp: CheckpointTimestamp;
  integrity_hash: string;
}>;

export type CheckpointRegistryRecord = Readonly<{
  registry_id: string;
  checkpoint_id: string;
  checkpoint_version: string;
  checkpoint_status: CheckpointLifecycleState;
  lineage_reference: string;
  replay_reference: string;
  rollback_reference: string;
  integrity_hash: string;
}>;

export type CheckpointRegistry = Readonly<{
  registry_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  checkpoint_catalog: readonly CheckpointRegistryRecord[];
  version_history: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  recovery_refs: readonly string[];
  immutable_storage: true;
  integrity_hash: string;
}>;

export type RecoverySnapshot = Readonly<{
  recovery_snapshot_id: string;
  execution_id: string;
  workflow_id: string;
  checkpoint_refs: readonly string[];
  recovery_starting_points: readonly string[];
  rollback_boundaries: readonly string[];
  execution_continuation_context: readonly string[];
  replay_references: readonly string[];
  recovery_enabled: false;
  integrity_hash: string;
}>;

export type CheckpointManagerPackage = Readonly<{
  manager_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  lifecycle_state: CheckpointLifecycleState;
  checkpoints: readonly CertifiedCheckpoint[];
  registry: CheckpointRegistry;
  recovery_snapshot: RecoverySnapshot;
  source_monitor: ExecutionMonitorPackage;
  advisory_only: true;
  recovery_executed: false;
  rollback_executed: false;
  integrity_hash: string;
}>;

export type CheckpointValidationResult = Readonly<{
  validation_id: string;
  manager_id: string;
  certification_state: CheckpointCertificationState;
  failures: readonly CheckpointFailureReason[];
  warnings: readonly CheckpointFailureReason[];
  state_complete: boolean;
  workflow_consistent: boolean;
  dependency_integrity_preserved: boolean;
  governance_integrity_preserved: boolean;
  authority_integrity_preserved: boolean;
  replay_compatible: boolean;
  lineage_complete: boolean;
  immutable_storage_verified: boolean;
  recovery_not_executed: boolean;
  ready_for_rollback_preparation: boolean;
  validation_hash: string;
}>;

export type CheckpointReplayResult = Readonly<{
  replay_id: string;
  manager_id: string;
  replay_checkpoint_order: readonly string[];
  replay_workflow_states: readonly string[];
  replay_dependency_refs: readonly string[];
  validation_state: CheckpointCertificationState;
  failure_reason: CheckpointFailureReason | null;
  replay_hash: string;
}>;

export type CheckpointVisibilitySurface = Readonly<{
  manager_id: string;
  execution_id: string;
  workflow_id: string;
  checkpoint_count: number;
  lifecycle_state: CheckpointLifecycleState;
  certified_checkpoint_ids: readonly string[];
  available_replay_refs: readonly string[];
  failure_reasons: readonly CheckpointFailureReason[];
  integrity_status: "VALID" | "INVALID";
  recovery_enabled: false;
}>;

export type CheckpointManagerFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  execution_monitor_validation: ExecutionMonitorValidationResult;
  manager: CheckpointManagerPackage;
  validation: CheckpointValidationResult;
  replay: CheckpointReplayResult;
  visibility: CheckpointVisibilitySurface;
}>;
