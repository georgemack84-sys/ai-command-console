import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { PlanningConfidenceAssessment } from "@/types/planning-confidence";

export type ExecutionCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ExecutionType = "CONTROLLED_AUTONOMY" | "HUMAN_SUPERVISED" | "GOVERNANCE_REPLAY";
export type ExecutionState = "CREATED" | "VALIDATED" | "REGISTERED" | "READY" | "RUNNING" | "WAITING" | "PAUSED" | "COMPLETED" | "FAILED" | "ROLLED_BACK" | "ARCHIVED";
export type StepStatus = "PENDING" | "READY" | "RUNNING" | "WAITING" | "PAUSED" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
export type ExecutionEnvironment = "SIMULATION" | "STAGING" | "PRODUCTION_REVIEW";
export type ExecutionClassification = "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
export type MissionPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ExecutionContractScenario =
  | "BASELINE"
  | "UNAPPROVED_PLAN"
  | "MISSING_GOVERNANCE"
  | "MISSING_AUTHORITY"
  | "INVALID_TENANT"
  | "MISSING_OPERATOR"
  | "INVALID_DEPENDENCY_GRAPH"
  | "MISSING_CHECKPOINT"
  | "MISSING_ROLLBACK"
  | "MISSING_REPLAY"
  | "INTEGRITY_MISMATCH"
  | "ILLEGAL_TRANSITION"
  | "SKIPPED_LIFECYCLE"
  | "DUPLICATE_TRANSITION"
  | "INVALID_ROLLBACK_STATE"
  | "CONDITIONAL_WARNING";

export type ExecutionFailureReason =
  | "SCHEMA_INCOMPLETE"
  | "IDENTITY_NOT_UNIQUE"
  | "PLAN_NOT_APPROVED"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "AUTHORITY_REFERENCE_MISSING"
  | "TENANT_ISOLATION_VIOLATION"
  | "OPERATOR_AUTHORIZATION_MISSING"
  | "WORKFLOW_INCONSISTENT"
  | "DEPENDENCY_GRAPH_INVALID"
  | "CHECKPOINT_STRUCTURE_INVALID"
  | "ROLLBACK_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "ILLEGAL_STATE_TRANSITION"
  | "LIFECYCLE_STAGE_SKIPPED"
  | "DUPLICATE_STATE_TRANSITION"
  | "INVALID_ROLLBACK_STATE"
  | "GOVERNANCE_STATE_INCONSISTENT"
  | "WARNING_ONLY";

export type ExecutionIdentity = Readonly<{
  execution_id: string;
  execution_version: string;
  execution_name: string;
  execution_type: ExecutionType;
}>;

export type WorkflowIdentity = Readonly<{
  workflow_id: string;
  workflow_version: string;
  workflow_template: string;
  workflow_revision: string;
}>;

export type PlanAssociation = Readonly<{
  plan_id: string;
  objective_id: string;
  planning_reference: string;
  planning_version: string;
}>;

export type TenantInformation = Readonly<{
  tenant_id: string;
  organization_id: string;
  environment: ExecutionEnvironment;
  classification: ExecutionClassification;
}>;

export type MissionAssociation = Readonly<{
  mission_id: string;
  mission_phase: string;
  mission_state: string;
  mission_priority: MissionPriority;
}>;

export type OperatorInformation = Readonly<{
  operator_id: string;
  approval_reference: string;
  approval_timestamp: string;
  operator_role: string;
}>;

export type ExecutionAuthorityScope = Readonly<{
  authority_scope: readonly string[];
  authority_level: string;
  authority_policy: string;
  authority_validation_reference: string;
}>;

export type ExecutionGovernanceReferences = Readonly<{
  governance_state: string;
  policy_snapshot: readonly string[];
  compliance_snapshot: readonly string[];
  risk_snapshot: string;
  recommendation_reference: string;
}>;

export type ExecutionCurrentStep = Readonly<{
  step_id: string;
  step_name: string;
  step_sequence: number;
  step_status: StepStatus;
}>;

export type ExecutionDependencyGraph = Readonly<{
  predecessor_tasks: readonly string[];
  successor_tasks: readonly string[];
  synchronization_points: readonly string[];
  external_dependencies: readonly string[];
  governance_dependencies: readonly string[];
  acyclic: boolean;
  deterministic_hash: string;
}>;

export type ExecutionCheckpoint = Readonly<{
  checkpoint_id: string;
  checkpoint_number: number;
  execution_state: ExecutionState;
  workflow_state: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ExecutionRollbackPlan = Readonly<{
  rollback_id: string;
  rollback_strategy: string;
  rollback_boundary: string;
  rollback_steps: readonly string[];
  rollback_validation: string;
  rollback_reference: string;
}>;

export type ExecutionConstraint = Readonly<{
  constraint_id: string;
  constraint_type: "TIME" | "RESOURCE" | "GOVERNANCE" | "AUTHORITY" | "TENANT" | "POLICY" | "RETRY";
  description: string;
  enforced: boolean;
}>;

export type ExecutionTimestamps = Readonly<{
  created_at: string;
  validated_at: string | null;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  rollback_at: string | null;
  archived_at: string | null;
}>;

export type ExecutionReplayReference = Readonly<{
  replay_reference: string;
  replay_version: string;
  replay_hash: string;
  reconstruction_reference: string;
}>;

export type ExecutionStateTransition = Readonly<{
  from_state: ExecutionState;
  to_state: ExecutionState;
  transition_reference: string;
  timestamp: string;
}>;

export type ExecutionContract = Readonly<{
  execution_identity: ExecutionIdentity;
  workflow_identity: WorkflowIdentity;
  plan_association: PlanAssociation;
  tenant_information: TenantInformation;
  mission_association: MissionAssociation;
  operator_information: OperatorInformation;
  authority_scope: ExecutionAuthorityScope;
  governance_references: ExecutionGovernanceReferences;
  execution_state: ExecutionState;
  current_step: ExecutionCurrentStep;
  dependency_graph: ExecutionDependencyGraph;
  checkpoint_list: readonly ExecutionCheckpoint[];
  rollback_plan: ExecutionRollbackPlan;
  execution_constraints: readonly ExecutionConstraint[];
  timestamps: ExecutionTimestamps;
  replay_reference: ExecutionReplayReference;
  lineage_reference: string;
  state_transition_history: readonly ExecutionStateTransition[];
  planning_confidence: PlanningConfidenceAssessment;
  integrity_hash: string;
}>;

export type ExecutionContractValidationResult = Readonly<{
  validation_id: string;
  execution_id: string;
  certification_state: ExecutionCertificationState;
  failures: readonly ExecutionFailureReason[];
  warnings: readonly ExecutionFailureReason[];
  schema_complete: boolean;
  identity_valid: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  tenant_isolation_valid: boolean;
  dependency_graph_valid: boolean;
  checkpoints_valid: boolean;
  rollback_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  ready_for_workflow_orchestrator: boolean;
  validation_hash: string;
}>;

export type ExecutionStateValidationResult = Readonly<{
  state_validation_id: string;
  execution_id: string;
  certification_state: ExecutionCertificationState;
  failures: readonly ExecutionFailureReason[];
  current_state: ExecutionState;
  allowed_next_states: readonly ExecutionState[];
  transition_history_valid: boolean;
  rollback_eligible: boolean;
  completion_eligible: boolean;
  validation_hash: string;
}>;

export type ExecutionReplayResult = Readonly<{
  replay_id: string;
  execution_id: string;
  replay_state_order: readonly ExecutionState[];
  replay_checkpoint_ids: readonly string[];
  replay_reconstruction_reference: string;
  validation_state: ExecutionCertificationState;
  failure_reason: ExecutionFailureReason | null;
  replay_hash: string;
}>;

export type ExecutionContractVisibilitySurface = Readonly<{
  execution_id: string;
  workflow_id: string;
  plan_id: string;
  tenant_id: string;
  mission_id: string;
  execution_state: ExecutionState;
  current_step: string;
  checkpoint_ids: readonly string[];
  rollback_reference: string;
  governance_state: string;
  authority_scope: readonly string[];
  failure_reasons: readonly ExecutionFailureReason[];
  integrity_status: "VALID" | "INVALID";
}>;

export type ExecutionContractFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  execution_contract: ExecutionContract;
  contract_validation: ExecutionContractValidationResult;
  state_validation: ExecutionStateValidationResult;
  replay: ExecutionReplayResult;
  visibility: ExecutionContractVisibilitySurface;
}>;
