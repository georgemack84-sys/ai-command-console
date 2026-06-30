import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";

export type ObjectivePlanningState =
  | "RECEIVED"
  | "VALIDATING"
  | "INTERPRETING"
  | "DECOMPOSING"
  | "BUILDING_HIERARCHY"
  | "GENERATING_MILESTONES"
  | "GENERATING_TASKS"
  | "VALIDATING_STRUCTURE"
  | "VALIDATING_GOVERNANCE"
  | "READY"
  | "REJECTED";

export type ObjectiveMilestoneType = "PLANNING_COMPLETE" | "VALIDATION_COMPLETE" | "PREPARATION_COMPLETE" | "EXECUTION_READY" | "EXECUTION_COMPLETE" | "VERIFICATION_COMPLETE";
export type ObjectiveValidationState = "PASS" | "FAIL";
export type ObjectiveDecompositionScenario =
  | "BASELINE"
  | "MISSING_APPROVAL"
  | "DUPLICATE_OBJECTIVE"
  | "INVALID_AUTHORITY"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AMBIGUOUS_OBJECTIVE"
  | "CYCLIC_HIERARCHY"
  | "DUPLICATE_TASK"
  | "ORPHAN_TASK"
  | "MISSING_MILESTONE"
  | "NONDETERMINISTIC_ORDERING"
  | "CROSS_TENANT"
  | "HIDDEN_TASK";

export type ObjectiveFailureReason =
  | "OBJECTIVE_SCHEMA_INVALID"
  | "OBJECTIVE_APPROVAL_MISSING"
  | "DUPLICATE_OBJECTIVE"
  | "UNAUTHORIZED_OBJECTIVE"
  | "EXPIRED_OBJECTIVE"
  | "INVALID_AUTHORITY"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "MISSION_CONTEXT_INVALID"
  | "AMBIGUOUS_OBJECTIVE"
  | "CYCLIC_HIERARCHY"
  | "DUPLICATE_TASK_ID"
  | "ORPHAN_TASK"
  | "MILESTONE_MISSING"
  | "NONDETERMINISTIC_ORDERING"
  | "HIDDEN_TASK"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_METADATA_MISSING"
  | "INTEGRITY_HASH_MISMATCH";

export type MissionObjective = Readonly<{
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  title: string;
  description: string;
  approved: boolean;
  approval_reference: string;
  authority_scope: AutonomyAuthorityScope;
  governance_profile: string;
  constitutional_profile: string;
  mission_context: string;
  available_capabilities: readonly string[];
  environmental_assumptions: readonly string[];
  risk_profile: "LOW" | "MEDIUM" | "HIGH";
  created_timestamp: string;
}>;

export type InterpretedObjective = Readonly<{
  normalized_objective: string;
  mission_intent: string;
  desired_outcomes: readonly string[];
  planning_scope: readonly string[];
  completion_definition: string;
  mission_constraints: readonly string[];
  planning_boundaries: readonly string[];
  interpretation_hash: string;
}>;

export type ObjectiveSubObjective = Readonly<{
  sub_objective_id: string;
  parent_objective_id: string;
  title: string;
  completion_criteria: readonly string[];
  governance_references: readonly string[];
  authority_requirement: AutonomyAuthorityScope;
  lineage_reference: string;
  deterministic_order: number;
}>;

export type ObjectiveMilestone = Readonly<{
  milestone_id: string;
  objective_id: string;
  sub_objective_id: string;
  milestone_type: ObjectiveMilestoneType;
  title: string;
  completion_criteria: readonly string[];
  replay_reference: string;
  deterministic_order: number;
}>;

export type ObjectiveAtomicTask = Readonly<{
  task_id: string;
  parent_objective_id: string;
  parent_sub_objective_id: string;
  milestone_id: string;
  title: string;
  action: string;
  required_authority: AutonomyAuthorityScope;
  governance_references: readonly string[];
  completion_criteria: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  explanation: string;
  deterministic_order: number;
  hidden_subactions: false;
}>;

export type ObjectiveHierarchyPackage = Readonly<{
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  objective: MissionObjective;
  parent_objective: string | null;
  interpreted_objective: InterpretedObjective;
  sub_objectives: readonly ObjectiveSubObjective[];
  milestones: readonly ObjectiveMilestone[];
  tasks: readonly ObjectiveAtomicTask[];
  authority_requirements: readonly AutonomyAuthorityScope[];
  governance_constraints: readonly string[];
  completion_criteria: readonly string[];
  planning_state: ObjectivePlanningState;
  replay_reference: string;
  lineage_reference: string;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type ObjectiveValidationResult = Readonly<{
  validation_id: string;
  objective_id: string;
  validation_state: ObjectiveValidationState;
  failures: readonly ObjectiveFailureReason[];
  schema_valid: boolean;
  approval_valid: boolean;
  authority_valid: boolean;
  governance_valid: boolean;
  constitution_valid: boolean;
  tenant_isolated: boolean;
  hierarchy_valid: boolean;
  deterministic: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  ready_for_dependency_analysis: boolean;
  validation_hash: string;
}>;

export type ObjectiveDecompositionReplayResult = Readonly<{
  replay_id: string;
  objective_id: string;
  reconstructed_sub_objectives: readonly string[];
  reconstructed_milestones: readonly string[];
  reconstructed_tasks: readonly string[];
  deterministic_order: readonly string[];
  validation_state: ObjectiveValidationState;
  failure_reason: ObjectiveFailureReason | null;
  replay_hash: string;
}>;

export type ObjectiveDecompositionVisibilitySurface = Readonly<{
  objective_id: string;
  planning_state: ObjectivePlanningState;
  sub_objective_count: number;
  milestone_count: number;
  task_count: number;
  failure_reasons: readonly ObjectiveFailureReason[];
  lineage_reference: string;
  replay_reference: string;
  governance_constraints: readonly string[];
  authority_requirements: readonly AutonomyAuthorityScope[];
  task_explanations: readonly string[];
  integrity_status: "VALID" | "INVALID";
  hidden_tasks_visible: false;
}>;

export type ObjectiveDecompositionFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  package: ObjectiveHierarchyPackage;
  validation: ObjectiveValidationResult;
  replay: ObjectiveDecompositionReplayResult;
  visibility: ObjectiveDecompositionVisibilitySurface;
}>;
