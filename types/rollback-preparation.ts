import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { CheckpointManagerPackage, CheckpointValidationResult } from "@/types/checkpoint-manager";

export type RollbackCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RollbackLifecycleState = "REQUESTED" | "ANALYZING" | "BOUNDARY_IDENTIFIED" | "PLAN_GENERATED" | "VALIDATED" | "READY_FOR_APPROVAL" | "NOT_REVERSIBLE" | "BLOCKED" | "REJECTED";
export type RollbackConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type RecoveryRecommendationType = "ROLLBACK_TO_CHECKPOINT" | "RETRY_FAILED_TASK" | "RESUME_EXECUTION" | "OPERATOR_INTERVENTION" | "GOVERNANCE_REVIEW" | "DEPENDENCY_REVALIDATION" | "RESOURCE_REALLOCATION" | "EXECUTION_PAUSE";

export type RollbackPreparationScenario =
  | "BASELINE"
  | "INVALID_CHECKPOINT_MANAGER"
  | "NO_ELIGIBLE_CHECKPOINT"
  | "BOUNDARY_UNSAFE"
  | "IRREVERSIBLE_TASK"
  | "DEPENDENCY_NOT_REVERSIBLE"
  | "RESOURCE_RESTORATION_FAILURE"
  | "WORKFLOW_INCONSISTENT"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "TENANT_VIOLATION"
  | "INTEGRITY_MISMATCH"
  | "AUTONOMOUS_RECOVERY_ATTEMPT"
  | "CONDITIONAL_LOW_CONFIDENCE";

export type RollbackFailureReason =
  | "INVALID_CHECKPOINT_MANAGER"
  | "NO_ELIGIBLE_CHECKPOINT"
  | "ROLLBACK_BOUNDARY_UNSAFE"
  | "IRREVERSIBLE_TASK"
  | "DEPENDENCY_NOT_REVERSIBLE"
  | "RESOURCE_RESTORATION_FAILURE"
  | "WORKFLOW_INCONSISTENT"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_VIOLATION"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_BROKEN"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTONOMOUS_RECOVERY_ATTEMPT"
  | "INTEGRITY_HASH_MISMATCH"
  | "LOW_CONFIDENCE";

export type RollbackBoundary = Readonly<{
  boundary_id: string;
  checkpoint_id: string;
  recovery_boundary: string;
  rollback_scope: readonly string[];
  synchronization_points: readonly string[];
  governance_transition_refs: readonly string[];
  operator_intervention_refs: readonly string[];
  rollback_eligible: boolean;
}>;

export type RecoveryCheckpointSelection = Readonly<{
  selected_checkpoint_id: string;
  selected_checkpoint_rank: number;
  alternative_checkpoint_ids: readonly string[];
  checkpoint_ranking: readonly string[];
  selection_criteria: readonly string[];
  integrity_verified: boolean;
  replay_compatible: boolean;
  governance_valid: boolean;
  authority_continuous: boolean;
  dependency_consistent: boolean;
}>;

export type ReversibilityStatus = Readonly<{
  reversible: boolean;
  task_reversibility: boolean;
  dependency_reversibility: boolean;
  resource_restoration: boolean;
  workflow_consistency: boolean;
  governance_continuity: boolean;
  authority_validity: boolean;
  rejection_reasons: readonly RollbackFailureReason[];
}>;

export type RollbackDependencyAnalysis = Readonly<{
  dependency_graph_ref: string;
  impacted_dependencies: readonly string[];
  restoration_dependencies: readonly string[];
  blocked_dependencies: readonly string[];
  synchronization_boundaries: readonly string[];
  dependency_impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}>;

export type RollbackGraphNode = Readonly<{
  node_id: string;
  node_type: "ROLLBACK_START" | "CHECKPOINT" | "DEPENDENCY_RESTORE" | "GOVERNANCE_VALIDATION" | "AUTHORITY_VALIDATION" | "OPERATOR_APPROVAL" | "ROLLBACK_READY";
  reference: string;
}>;

export type RollbackGraphEdge = Readonly<{
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  relationship: "PRECEDES" | "RESTORES" | "VALIDATES" | "APPROVES" | "GATES";
}>;

export type RollbackGraph = Readonly<{
  graph_id: string;
  nodes: readonly RollbackGraphNode[];
  edges: readonly RollbackGraphEdge[];
  checkpoint_transitions: readonly string[];
  governance_checkpoints: readonly string[];
  deterministic: true;
  replay_reference: string;
  integrity_hash: string;
}>;

export type RollbackSequenceStep = Readonly<{
  step_id: string;
  step_order: number;
  stage: "ANALYZE" | "SELECT_CHECKPOINT" | "RESTORE_DEPENDENCIES" | "VALIDATE_GOVERNANCE" | "VALIDATE_AUTHORITY" | "REQUEST_APPROVAL" | "PUBLISH_PLAN";
  action: string;
  checkpoint_reference: string | null;
  dependency_reference: string | null;
  governance_gate: string | null;
  operator_approval_required: boolean;
  replay_reference: string;
}>;

export type RollbackGovernanceValidation = Readonly<{
  constitutional_compliant: boolean;
  governance_policy_compliant: boolean;
  authority_scope_valid: boolean;
  operator_approval_required: boolean;
  operator_approval_present: boolean;
  execution_constraints_preserved: boolean;
  validation_refs: readonly string[];
}>;

export type RollbackConfidenceReport = Readonly<{
  confidence_score: number;
  confidence_level: RollbackConfidenceLevel;
  confidence_factors: readonly string[];
  identified_risks: readonly RollbackFailureReason[];
  uncertainty_analysis: readonly string[];
  recovery_probability: number;
}>;

export type RecoveryRecommendation = Readonly<{
  recommendation_id: string;
  recommendation_type: RecoveryRecommendationType;
  rationale: string;
  operator_action_required: boolean;
  governance_review_required: boolean;
  dependency_correction_required: boolean;
  resource_recommendation: string | null;
  advisory_only: true;
  replay_reference: string;
}>;

export type RollbackLineageRecord = Readonly<{
  lineage_id: string;
  rollback_request_ref: string;
  analysis_refs: readonly string[];
  selected_checkpoint_refs: readonly string[];
  boundary_decision_refs: readonly string[];
  confidence_refs: readonly string[];
  governance_validation_refs: readonly string[];
  recommendation_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RollbackPlan = Readonly<{
  rollback_plan_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  rollback_state: RollbackLifecycleState;
  rollback_boundary: RollbackBoundary;
  selected_checkpoint: RecoveryCheckpointSelection;
  alternative_checkpoints: readonly string[];
  rollback_graph: RollbackGraph;
  rollback_sequence: readonly RollbackSequenceStep[];
  reversibility_status: ReversibilityStatus;
  dependency_analysis: RollbackDependencyAnalysis;
  governance_validation: RollbackGovernanceValidation;
  authority_validation: RollbackGovernanceValidation;
  rollback_confidence: RollbackConfidenceReport;
  recovery_recommendations: readonly RecoveryRecommendation[];
  estimated_recovery_time_ms: number;
  lineage_reference: RollbackLineageRecord;
  replay_reference: string;
  advisory_only: true;
  rollback_executed: false;
  workflow_modified: false;
  authority_escalated: false;
  governance_bypassed: false;
  integrity_hash: string;
  timestamp: string;
}>;

export type RollbackPreparationPackage = Readonly<{
  preparation_id: string;
  execution_id: string;
  workflow_id: string;
  tenant_id: string;
  rollback_state: RollbackLifecycleState;
  plans: readonly RollbackPlan[];
  source_checkpoint_manager: CheckpointManagerPackage;
  advisory_only: true;
  rollback_executed: false;
  execution_restarted: false;
  workflow_modified: false;
  authority_escalated: false;
  governance_bypassed: false;
  integrity_hash: string;
}>;

export type RollbackPreparationValidationResult = Readonly<{
  validation_id: string;
  preparation_id: string;
  certification_state: RollbackCertificationState;
  failures: readonly RollbackFailureReason[];
  warnings: readonly RollbackFailureReason[];
  rollback_boundary_safe: boolean;
  recovery_checkpoint_certified: boolean;
  reversibility_valid: boolean;
  dependency_impact_valid: boolean;
  governance_ready: boolean;
  authority_ready: boolean;
  replay_compatible: boolean;
  lineage_complete: boolean;
  advisory_only_enforced: boolean;
  ready_for_orchestration_certification: boolean;
  validation_hash: string;
}>;

export type RollbackPreparationReplayResult = Readonly<{
  replay_id: string;
  preparation_id: string;
  replay_plan_order: readonly string[];
  replay_checkpoint_order: readonly string[];
  replay_recommendation_order: readonly RecoveryRecommendationType[];
  validation_state: RollbackCertificationState;
  failure_reason: RollbackFailureReason | null;
  replay_hash: string;
}>;

export type RollbackPreparationVisibilitySurface = Readonly<{
  preparation_id: string;
  execution_id: string;
  workflow_id: string;
  rollback_state: RollbackLifecycleState;
  plan_count: number;
  selected_checkpoint_ids: readonly string[];
  confidence_level: RollbackConfidenceLevel;
  recommendation_types: readonly RecoveryRecommendationType[];
  failure_reasons: readonly RollbackFailureReason[];
  integrity_status: "VALID" | "INVALID";
  rollback_enabled: false;
}>;

export type RollbackPreparationFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  checkpoint_validation: CheckpointValidationResult;
  preparation: RollbackPreparationPackage;
  validation: RollbackPreparationValidationResult;
  replay: RollbackPreparationReplayResult;
  visibility: RollbackPreparationVisibilitySurface;
}>;
