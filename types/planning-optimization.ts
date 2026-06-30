import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { ObjectiveHierarchyPackage } from "@/types/objective-decomposition";

export type OptimizationCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type OptimizationConstraintClass = "HARD_CONSTRAINT" | "SOFT_PREFERENCE" | "SAFETY_REQUIREMENT" | "REPLAY_REQUIREMENT";
export type OptimizationScenario =
  | "BASELINE"
  | "UNCERTIFIED_GRAPH"
  | "MISSING_ORDERING"
  | "UNRESOLVED_BLOCKERS"
  | "MISSING_REPLAY"
  | "INVALID_TENANT"
  | "INCOMPLETE_GOVERNANCE"
  | "OUT_OF_ORDER"
  | "UNSAFE_PARALLELISM"
  | "RESOURCE_CONTENTION"
  | "GOVERNANCE_SKIP"
  | "SAFETY_MARGIN_REDUCED"
  | "NONDETERMINISTIC_REPLAY"
  | "AUTHORITY_ESCALATION"
  | "HIDDEN_OPTIMIZATION"
  | "POLICY_VIOLATION"
  | "CONDITIONAL_REPORTING_GAP";

export type OptimizationFailureReason =
  | "UNCERTIFIED_DEPENDENCY_GRAPH"
  | "MISSING_TASK_ORDERING"
  | "UNRESOLVED_BLOCKERS"
  | "REPLAY_REFERENCE_MISSING"
  | "INVALID_TENANT_CONTEXT"
  | "INCOMPLETE_GOVERNANCE_METADATA"
  | "DEPENDENCY_ORDER_VIOLATION"
  | "UNSAFE_PARALLELISM"
  | "RACE_CONDITION"
  | "AUTHORITY_OVERLAP"
  | "RESOURCE_CONTENTION"
  | "CROSS_TENANT_RESOURCE"
  | "UNAUTHORIZED_RESOURCE"
  | "GOVERNANCE_CHECK_SKIPPED"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "SAFETY_MARGIN_REDUCED"
  | "ROLLBACK_READINESS_LOST"
  | "OPERATOR_VISIBILITY_REDUCED"
  | "NONDETERMINISTIC_REPLAY"
  | "HIDDEN_OPTIMIZATION_PATH"
  | "CRITICAL_EVIDENCE_OMITTED"
  | "REPORTING_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type OptimizationIntakeRecord = Readonly<{
  optimization_intake_id: string;
  dependency_graph_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  dependency_graph: DependencyGraphPackage;
  objective_hierarchy: ObjectiveHierarchyPackage;
  critical_path: readonly string[];
  ready_tasks: readonly string[];
  blocked_tasks: readonly string[];
  governance_constraints: readonly string[];
  authority_requirements: readonly AutonomyAuthorityScope[];
  replay_reference: string;
  intake_hash: string;
}>;

export type OptimizationConstraint = Readonly<{
  constraint_id: string;
  constraint_class: OptimizationConstraintClass;
  name: string;
  required: boolean;
  satisfied: boolean;
  violation_reason: OptimizationFailureReason | null;
}>;

export type OptimizedExecutionStep = Readonly<{
  task_id: string;
  sequence_index: number;
  readiness_layer: number;
  milestone_id: string;
  required_preconditions: readonly string[];
}>;

export type OptimizedParallelGroup = Readonly<{
  group_id: string;
  tasks: readonly string[];
  safety_validation: "PASS" | "FAIL";
  resource_validation: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
}>;

export type ResourceAllocation = Readonly<{
  resource_id: string;
  assigned_tasks: readonly string[];
  usage_window: string;
  capacity_state: "AVAILABLE" | "RESERVED" | "CONTENDED" | "BLOCKED";
  tenant_scope: string;
}>;

export type GovernanceCheckpoint = Readonly<{
  checkpoint_id: string;
  required_before_task: string;
  policy_refs: readonly string[];
  compliance_refs: readonly string[];
  authority_refs: readonly string[];
}>;

export type SafetyMarginReport = Readonly<{
  rollback_window: "PRESERVED" | "REDUCED" | "LOST";
  operator_intervention_points: readonly string[];
  verification_points: readonly string[];
  safe_stop_points: readonly string[];
}>;

export type ReplayOptimizationModel = Readonly<{
  replay_order: readonly string[];
  deterministic_tie_break_rules: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
}>;

export type OptimizationScores = Readonly<{
  execution_efficiency_score: number;
  parallelism_score: number;
  resource_efficiency_score: number;
  governance_compliance_score: number;
  safety_margin_score: number;
  replay_simplicity_score: number;
  overall_optimization_score: number;
}>;

export type RejectedOptimization = Readonly<{
  optimization_id: string;
  reason_rejected: OptimizationFailureReason;
  violated_constraint: string;
}>;

export type OptimizedPlanPackage = Readonly<{
  optimized_plan_id: string;
  dependency_graph_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  execution_order: readonly OptimizedExecutionStep[];
  parallel_groups: readonly OptimizedParallelGroup[];
  resource_allocation: readonly ResourceAllocation[];
  governance_checkpoints: readonly GovernanceCheckpoint[];
  safety_margins: SafetyMarginReport;
  replay_model: ReplayOptimizationModel;
  optimization_scores: OptimizationScores;
  rejected_optimizations: readonly RejectedOptimization[];
  certification_state: OptimizationCertificationState;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type OptimizationValidationResult = Readonly<{
  validation_id: string;
  optimized_plan_id: string;
  certification_state: OptimizationCertificationState;
  failures: readonly OptimizationFailureReason[];
  dependency_graph_valid: boolean;
  optimized_order_deterministic: boolean;
  safe_parallelism_validated: boolean;
  resource_usage_safe: boolean;
  governance_compliance_preserved: boolean;
  authority_boundaries_preserved: boolean;
  safety_margin_preserved: boolean;
  replay_simplicity_preserved: boolean;
  tenant_isolation_enforced: boolean;
  policy_violation_absent: boolean;
  ready_for_alternative_planning: boolean;
  validation_hash: string;
}>;

export type OptimizationReplayResult = Readonly<{
  replay_id: string;
  optimized_plan_id: string;
  replay_order: readonly string[];
  replay_parallel_groups: readonly string[];
  replay_evidence_refs: readonly string[];
  validation_state: OptimizationCertificationState;
  failure_reason: OptimizationFailureReason | null;
  replay_hash: string;
}>;

export type OptimizationVisibilitySurface = Readonly<{
  optimized_plan_id: string;
  certification_state: OptimizationCertificationState;
  execution_order: readonly string[];
  parallel_groups: readonly (readonly string[])[];
  rejected_optimizations: readonly RejectedOptimization[];
  scores: OptimizationScores;
  governance_checkpoints: readonly string[];
  safety_margin_status: SafetyMarginReport;
  replay_order: readonly string[];
  failure_reasons: readonly OptimizationFailureReason[];
  integrity_status: "VALID" | "INVALID";
  hidden_optimizations_visible: false;
}>;

export type PlanningOptimizationFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  intake: OptimizationIntakeRecord;
  constraints: readonly OptimizationConstraint[];
  plan: OptimizedPlanPackage;
  validation: OptimizationValidationResult;
  replay: OptimizationReplayResult;
  visibility: OptimizationVisibilitySurface;
}>;
