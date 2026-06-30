import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";

export type PlanExecutionLookupType = "PLAN" | "EXECUTION" | "PLAN_AND_EXECUTION" | "TIMELINE" | "FAILURE";
export type ExecutionLookupState = "PLANNED" | "READY" | "RUNNING" | "WAITING" | "PAUSED" | "COMPLETED" | "FAILED" | "ROLLED_BACK" | "BLOCKED";

export type PlanExecutionLookupErrorState =
  | "INVALID_LOOKUP"
  | "PLAN_NOT_FOUND"
  | "EXECUTION_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "INVALID_EXECUTION_STATE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION";

export type PlanExecutionLookupState = "LOOKUP_RETURNED" | "NO_RESULTS" | PlanExecutionLookupErrorState;

export type PlanExecutionLookupScenario =
  | "BASELINE"
  | "PLAN_LOOKUP"
  | "EXECUTION_LOOKUP"
  | "TIMELINE_LOOKUP"
  | "FAILURE_INSPECTION"
  | "PLAN_NOT_FOUND"
  | "EXECUTION_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "INVALID_EXECUTION_STATE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION"
  | "MUTATION_ATTEMPT";

export type PlanLookupRecord = Readonly<{
  plan_id: string;
  tenant_id: string;
  mission_id: string;
  objective_id: string;
  planning_state: "SELECTED" | "REJECTED" | "BRANCHED" | "FALLBACK_READY" | "CONTINGENCY_READY";
  original_mission_objective: string;
  decomposed_objectives: readonly string[];
  generated_subtasks: readonly string[];
  dependency_hierarchy: readonly Readonly<{ from: string; to: string; dependency_type: string }>[];
  planning_assumptions: readonly string[];
  selected_plan: string;
  planning_rationale: string;
  optimization_decisions: readonly string[];
  alternative_plans: readonly Readonly<{ plan_id: string; rejection_reason: string; confidence: number; risk: string }>[];
  branch_plans: readonly Readonly<{ branch_id: string; activation_condition: string; expected_outcome: string; replay_reference: string }>[];
  fallback_plans: readonly Readonly<{ fallback_id: string; activation_trigger: string; recovery_sequence: readonly string[]; confidence: number; governance_approval: string }>[];
  contingency_plans: readonly Readonly<{ scenario: string; actions: readonly string[]; rollback_option: string; escalation_path: string; safe_stop: string }>[];
  dependency_graph: readonly string[];
  confidence: Readonly<{ overall: number; objective_clarity: number; dependency_completeness: number; policy_certainty: number; authority_certainty: number; historical_confidence: number; resource_availability: number }>;
  risk_score: number;
  governance_result: Readonly<{ constitutional_validation: string; policy_compliance: string; governance_approval: string; validation_timestamp: string; evidence_references: readonly string[] }>;
  authority_validation: Readonly<{ authority_verified: boolean; authority_reference: string; validation_result: string }>;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  created_timestamp: string;
  plan_hash: string;
}>;

export type ExecutionTimelineEvent = Readonly<{
  event_id: string;
  execution_state: ExecutionLookupState;
  timestamp: string;
  event_sequence: number;
  summary: string;
  checkpoint_reference: string | null;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_hash: string;
}>;

export type ExecutionLookupRecord = Readonly<{
  execution_id: string;
  tenant_id: string;
  mission_id: string;
  plan_id: string;
  execution_state: ExecutionLookupState;
  execution_sequence: number;
  checkpoint_reference: string;
  runtime_health: "HEALTHY" | "DEGRADED" | "FAILED";
  confidence: number;
  failure_reason: string | null;
  rollback_status: "NOT_REQUIRED" | "PREPARED" | "IN_PROGRESS" | "COMPLETED";
  governance_validation: string;
  authority_validation: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  execution_timestamp: string;
  timeline: readonly ExecutionTimelineEvent[];
  execution_hash: string;
}>;

export type FailureInspection = Readonly<{
  failure_id: string;
  execution_id: string;
  failure_point: string;
  failure_reason: string;
  failure_classification: "DEPENDENCY_FAILURE" | "POLICY_BLOCK" | "AUTHORITY_BLOCK" | "RUNTIME_FAILURE" | "NONE";
  affected_tasks: readonly string[];
  dependency_impact: readonly string[];
  recommended_recovery: string;
  rollback_readiness: "READY" | "NOT_REQUIRED" | "BLOCKED";
  governance_influence: string;
  policy_influence: string;
  evidence_references: readonly string[];
  inspection_hash: string;
}>;

export type PlanExecutionLookupAuditRecord = Readonly<{
  lookup_audit_id: string;
  lookup_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  lookup_type: PlanExecutionLookupType;
  target_reference: string;
  returned_record_count: number;
  authorization_result: "APPROVED" | "REJECTED";
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  execution_duration: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type PlanExecutionLookupResponse = Readonly<{
  phase_version: "8I.3";
  schema_version: "plan-execution-lookup/v8I.3";
  lookup_id: string;
  lookup_type: PlanExecutionLookupType;
  lookup_state: PlanExecutionLookupState;
  tenant_id: string;
  mission_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  plan_record: PlanLookupRecord | null;
  execution_record: ExecutionLookupRecord | null;
  timeline: readonly ExecutionTimelineEvent[];
  failure_inspection: FailureInspection | null;
  audit_record: PlanExecutionLookupAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Plan and execution lookup is deterministic, read-only, replayable, and audit-backed.";
}>;

export type PlanExecutionLookupInput = Readonly<{
  scenario?: PlanExecutionLookupScenario;
  lookup_type?: PlanExecutionLookupType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
}>;

export type PlanExecutionLookupObservabilitySurface = Readonly<{
  lookup_id: string;
  lookup_type: PlanExecutionLookupType;
  lookup_state: PlanExecutionLookupState;
  tenant_id: string;
  mission_id: string;
  has_plan: boolean;
  has_execution: boolean;
  timeline_events: number;
  errors: readonly PlanExecutionLookupErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
