import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ObjectiveAtomicTask, ObjectiveHierarchyPackage } from "@/types/objective-decomposition";

export type DependencyType = "TASK" | "DATA" | "AUTHORITY" | "GOVERNANCE" | "RESOURCE" | "TEMPORAL";
export type DependencyReadinessState =
  | "UNANALYZED"
  | "ANALYZING"
  | "WAITING_ON_TASK"
  | "WAITING_ON_DATA"
  | "WAITING_ON_AUTHORITY"
  | "WAITING_ON_GOVERNANCE"
  | "WAITING_ON_RESOURCE"
  | "WAITING_ON_TIME"
  | "READY"
  | "BLOCKED"
  | "INVALID";
export type DependencyValidationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DependencyAnalysisScenario =
  | "BASELINE"
  | "MISSING_TASK_ID"
  | "DUPLICATE_TASK"
  | "ORPHAN_TASK"
  | "INVALID_TENANT"
  | "MISSING_REPLAY"
  | "MISSING_DATA"
  | "AUTHORITY_GAP"
  | "GOVERNANCE_UNRESOLVED"
  | "RESOURCE_UNAVAILABLE"
  | "TEMPORAL_CONFLICT"
  | "CYCLIC_DEPENDENCY"
  | "NONDETERMINISTIC_ORDERING"
  | "HIDDEN_EDGE"
  | "CRITICAL_PATH_MISSING"
  | "UNEXPLAINED_BLOCKER";

export type DependencyFailureReason =
  | "INTAKE_SCHEMA_INVALID"
  | "MISSING_TASK_ID"
  | "DUPLICATE_TASK_ID"
  | "ORPHAN_TASK"
  | "INVALID_TENANT_REFERENCE"
  | "REPLAY_METADATA_MISSING"
  | "MISSING_DATA"
  | "CORRUPTED_DATA_REFERENCE"
  | "CROSS_TENANT_DATA_REFERENCE"
  | "MISSING_AUTHORITY"
  | "AUTHORITY_MISMATCH"
  | "PRIVILEGE_ESCALATION"
  | "MISSING_POLICY_VALIDATION"
  | "UNRESOLVED_COMPLIANCE"
  | "UNRESOLVED_ESCALATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS_PATH"
  | "HIDDEN_GOVERNANCE_DEPENDENCY"
  | "RESOURCE_UNAVAILABLE"
  | "RESOURCE_CONFLICT"
  | "UNAUTHORIZED_TOOL_USE"
  | "TEMPORAL_CONFLICT"
  | "IMPOSSIBLE_DEADLINE"
  | "UNSAFE_ROLLBACK_WINDOW"
  | "CYCLIC_DEPENDENCY"
  | "IMPOSSIBLE_ORDERING"
  | "MUTUALLY_BLOCKING_TASKS"
  | "NONDETERMINISTIC_ORDERING"
  | "HIDDEN_DEPENDENCY_EDGE"
  | "CRITICAL_PATH_MISSING"
  | "UNEXPLAINED_BLOCKER"
  | "INTEGRITY_HASH_MISMATCH";

export type DependencyIntakeRecord = Readonly<{
  intake_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  hierarchy: ObjectiveHierarchyPackage;
  normalized_tasks: readonly ObjectiveAtomicTask[];
  task_identity_map: Readonly<Record<string, string>>;
  replay_reference: string;
  lineage_reference: string;
  intake_hash: string;
}>;

export type DependencyGraphNode = Readonly<{
  task_id: string;
  task_type: "ATOMIC";
  parent_objective_id: string;
  milestone_id: string;
  readiness_state: DependencyReadinessState;
  authority_required: AutonomyAuthorityScope;
  governance_required: readonly string[];
  resources_required: readonly string[];
  data_required: readonly string[];
  temporal_constraints: readonly string[];
  blocker_reasons: readonly DependencyFailureReason[];
  replay_reference: string;
  lineage_reference: string;
}>;

export type DependencyGraphEdge = Readonly<{
  edge_id: string;
  from_task_id: string;
  to_task_id: string;
  dependency_type: DependencyType;
  reason: string;
  required_condition: string;
  governance_reference: string;
  authority_reference: string;
  data_reference: string;
  replay_reference: string;
  hidden: boolean;
}>;

export type DependencyGraphPackage = Readonly<{
  dependency_graph_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  nodes: readonly DependencyGraphNode[];
  edges: readonly DependencyGraphEdge[];
  ready_tasks: readonly string[];
  blocked_tasks: readonly string[];
  parallel_groups: readonly (readonly string[])[];
  critical_path: readonly string[];
  dependency_chains: readonly (readonly string[])[];
  validation_state: DependencyValidationState;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type DependencyValidationResult = Readonly<{
  validation_id: string;
  dependency_graph_id: string;
  validation_state: DependencyValidationState;
  failures: readonly DependencyFailureReason[];
  graph_complete: boolean;
  graph_deterministic: boolean;
  ordering_reproducible: boolean;
  dependencies_classified: boolean;
  cycle_free: boolean;
  hidden_edges_absent: boolean;
  blockers_explainable: boolean;
  tenant_isolated: boolean;
  governance_enforced: boolean;
  authority_enforced: boolean;
  replay_complete: boolean;
  ready_for_optimization: boolean;
  validation_hash: string;
}>;

export type DependencyReplayResult = Readonly<{
  replay_id: string;
  dependency_graph_id: string;
  reconstructed_ordering: readonly string[];
  reconstructed_edges: readonly string[];
  reconstructed_ready_tasks: readonly string[];
  reconstructed_blocked_tasks: readonly string[];
  validation_state: DependencyValidationState;
  failure_reason: DependencyFailureReason | null;
  replay_hash: string;
}>;

export type DependencyVisibilitySurface = Readonly<{
  dependency_graph_id: string;
  objective_id: string;
  ready_tasks: readonly string[];
  blocked_tasks: readonly string[];
  parallel_groups: readonly (readonly string[])[];
  critical_path: readonly string[];
  dependency_chains: readonly (readonly string[])[];
  failure_reasons: readonly DependencyFailureReason[];
  governance_dependency_report: readonly string[];
  authority_dependency_report: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
  hidden_edges_visible: false;
}>;

export type DependencyAnalysisFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  intake: DependencyIntakeRecord;
  graph: DependencyGraphPackage;
  validation: DependencyValidationResult;
  replay: DependencyReplayResult;
  visibility: DependencyVisibilitySurface;
}>;
