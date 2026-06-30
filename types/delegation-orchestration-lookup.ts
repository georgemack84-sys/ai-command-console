import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";

export type DelegationOrchestrationLookupType =
  | "DELEGATION"
  | "ORCHESTRATION"
  | "DELEGATION_AND_ORCHESTRATION"
  | "ROUTING"
  | "DEPENDENCY"
  | "CHECKPOINT"
  | "TIMELINE";

export type DelegationTaskType = "OPERATOR" | "AGENT" | "EXTERNAL_SYSTEM" | "DEFERRED" | "BLOCKED";
export type DelegationLookupState = "REQUESTED" | "VALIDATED" | "ROUTED" | "ASSIGNED" | "DEFERRED" | "BLOCKED" | "COMPLETED";
export type OrchestrationLookupState = "CREATED" | "READY" | "SCHEDULED" | "RUNNING" | "WAITING" | "CHECKPOINTED" | "PAUSED" | "ROLLBACK_READY" | "ROLLING_BACK" | "COMPLETED" | "FAILED" | "BLOCKED";

export type DelegationOrchestrationLookupErrorState =
  | "INVALID_LOOKUP"
  | "DELEGATION_NOT_FOUND"
  | "ORCHESTRATION_EVENT_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "WORKFLOW_NOT_FOUND"
  | "CHECKPOINT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "WORKFLOW_SCOPE_VIOLATION"
  | "INVALID_AUTHORITY_REFERENCE"
  | "INVALID_DEPENDENCY_REFERENCE"
  | "INVALID_CHECKPOINT_REFERENCE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION";

export type DelegationOrchestrationLookupState = "LOOKUP_RETURNED" | "NO_RESULTS" | DelegationOrchestrationLookupErrorState;

export type DelegationOrchestrationLookupScenario =
  | "BASELINE"
  | "DELEGATION_LOOKUP"
  | "ORCHESTRATION_LOOKUP"
  | "ROUTING_VIEW"
  | "DEPENDENCY_SEARCH"
  | "CHECKPOINT_QUERY"
  | "TIMELINE_RECONSTRUCTION"
  | "DELEGATION_NOT_FOUND"
  | "ORCHESTRATION_EVENT_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "WORKFLOW_NOT_FOUND"
  | "CHECKPOINT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "WORKFLOW_SCOPE_VIOLATION"
  | "INVALID_AUTHORITY_REFERENCE"
  | "INVALID_DEPENDENCY_REFERENCE"
  | "INVALID_CHECKPOINT_REFERENCE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION"
  | "MUTATION_ATTEMPT";

export type DelegationConfidence = Readonly<{
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  confidence_score: number;
  confidence_factors: readonly string[];
  risk_score: number;
  uncertainty_reason: string | null;
}>;

export type DelegationLookupRecord = Readonly<{
  delegation_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  task_id: string;
  task_type: DelegationTaskType;
  assigned_to: string;
  assignment_type: "OPERATOR" | "CERTIFIED_AGENT" | "APPROVED_EXTERNAL_SYSTEM" | "DEFERRED_QUEUE" | "BLOCKED_QUEUE";
  delegation_state: DelegationLookupState;
  routing_decision: string;
  rejected_routes: readonly Readonly<{ route_id: string; rejection_reason: string; authority_result: string; confidence: number }>[];
  authority_validation: Readonly<{ operator_authority: string; agent_authority: string; governance_authority: string; policy_authority: string; constitutional_authority: string; tenant_scope: string }>;
  governance_validation: Readonly<{ status: "APPROVED" | "REJECTED"; governance_reference: string; policy_reference: string; constitutional_reference: string }>;
  confidence: DelegationConfidence;
  blocked_reason: "AUTHORITY_FAILURE" | "POLICY_REJECTION" | "CONSTITUTIONAL_REJECTION" | "TENANT_BOUNDARY" | "DEPENDENCY_FAILURE" | "CONFIDENCE_TOO_LOW" | null;
  deferred_reason: "WAITING_FOR_DEPENDENCY" | "WAITING_FOR_OPERATOR" | "WAITING_FOR_POLICY_CLEARANCE" | "WAITING_FOR_RESOURCE" | "WAITING_FOR_REPLAY_VALIDATION" | null;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  created_timestamp: string;
  autonomy_event_sequence: number;
  delegation_hash: string;
}>;

export type RoutingDecisionView = Readonly<{
  routing_view_id: string;
  task_id: string;
  selected_route: string;
  rejected_routes: readonly string[];
  routing_rationale: string;
  fallback_route: string;
  routing_confidence: number;
  authority_validation: string;
  governance_constraints: readonly string[];
  routing_hash: string;
}>;

export type DependencySearchRecord = Readonly<{
  dependency_id: string;
  parent_task_id: string;
  child_task_id: string;
  dependency_type: "PREREQUISITE" | "RESOURCE" | "POLICY_CLEARANCE" | "REPLAY_VALIDATION" | "CHECKPOINT";
  dependency_status: "SATISFIED" | "WAITING" | "FAILED" | "BLOCKING";
  blocking_status: "NOT_BLOCKING" | "BLOCKING_CHILD" | "BLOCKING_WORKFLOW";
  critical_path: boolean;
  integrity_hash: string;
  dependency_hash: string;
}>;

export type CheckpointQueryRecord = Readonly<{
  checkpoint_id: string;
  workflow_id: string;
  execution_id: string;
  created_after_task: string;
  checkpoint_state: "CREATED" | "VERIFIED" | "ROLLBACK_ELIGIBLE" | "INVALID";
  rollback_eligible: boolean;
  integrity_hash: string;
  replay_reference: string;
  checkpoint_hash: string;
}>;

export type OrchestrationLookupRecord = Readonly<{
  orchestration_event_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  execution_id: string;
  task_id: string;
  orchestration_state: OrchestrationLookupState;
  task_sequence: number;
  dependency_references: readonly string[];
  checkpoint_reference: string | null;
  rollback_reference: string | null;
  supervision_reference: string;
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_timestamp: string;
  autonomy_event_sequence: number;
  orchestration_hash: string;
}>;

export type OrchestrationTimelineEvent = Readonly<{
  event_id: string;
  state: OrchestrationLookupState;
  workflow_id: string;
  task_id: string;
  task_sequence: number;
  event_timestamp: string;
  summary: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_hash: string;
}>;

export type DelegationOrchestrationLookupAuditRecord = Readonly<{
  audit_id: string;
  lookup_id: string;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  operator_id: string;
  lookup_type: DelegationOrchestrationLookupType;
  target_reference: string;
  authorization_result: "APPROVED" | "REJECTED";
  returned_record_count: number;
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type DelegationOrchestrationLookupResponse = Readonly<{
  phase_version: "8I.4";
  schema_version: "delegation-orchestration-lookup/v8I.4";
  lookup_id: string;
  lookup_type: DelegationOrchestrationLookupType;
  lookup_state: DelegationOrchestrationLookupState;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  delegation_records: readonly DelegationLookupRecord[];
  orchestration_records: readonly OrchestrationLookupRecord[];
  routing_view: RoutingDecisionView | null;
  dependency_records: readonly DependencySearchRecord[];
  checkpoint_records: readonly CheckpointQueryRecord[];
  timeline: readonly OrchestrationTimelineEvent[];
  audit_record: DelegationOrchestrationLookupAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Delegation and orchestration lookup is deterministic, read-only, replayable, and audit-backed.";
}>;

export type DelegationOrchestrationLookupInput = Readonly<{
  scenario?: DelegationOrchestrationLookupScenario;
  lookup_type?: DelegationOrchestrationLookupType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
  workflow_id?: string;
}>;

export type DelegationOrchestrationLookupObservabilitySurface = Readonly<{
  lookup_id: string;
  lookup_type: DelegationOrchestrationLookupType;
  lookup_state: DelegationOrchestrationLookupState;
  tenant_id: string;
  mission_id: string;
  workflow_id: string;
  delegation_records: number;
  orchestration_records: number;
  dependencies: number;
  checkpoints: number;
  timeline_events: number;
  errors: readonly DelegationOrchestrationLookupErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
