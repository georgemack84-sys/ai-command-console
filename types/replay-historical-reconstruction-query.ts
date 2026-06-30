import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";
import type { DelegationOrchestrationLookupResponse } from "@/types/delegation-orchestration-lookup";
import type { PlanExecutionLookupResponse } from "@/types/plan-execution-lookup";
import type { SupervisionInterventionBoundaryLookupResponse } from "@/types/supervision-intervention-boundary-lookup";

export type ReplayHistoricalReconstructionQueryType =
  | "HISTORICAL_RECONSTRUCTION"
  | "REPLAY_QUERY"
  | "TIMELINE_RECONSTRUCTION"
  | "MISSING_RECORD_DETECTION"
  | "MISMATCH_INSPECTION"
  | "REPLAY_RESULT_VIEW";

export type ReplayLookupStatus = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";

export type HistoricalEventCategory =
  | "MISSION_OBJECTIVE"
  | "PLANNING"
  | "DECISION"
  | "DELEGATION"
  | "ORCHESTRATION"
  | "EXECUTION"
  | "SUPERVISION"
  | "INTERVENTION"
  | "OUTCOME"
  | "REPLAY"
  | "INTEGRITY_VERIFICATION";

export type ReplayHistoricalReconstructionErrorState =
  | "INVALID_RECONSTRUCTION_REQUEST"
  | "RECONSTRUCTION_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "REPLAY_RECORD_NOT_FOUND"
  | "LINEAGE_REFERENCE_INVALID"
  | "INTEGRITY_REFERENCE_INVALID"
  | "MISSING_HISTORICAL_RECORD"
  | "REPLAY_MISMATCH"
  | "ORDERING_FAILURE"
  | "HASH_MISMATCH"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "VALIDATION_FAILURE";

export type ReplayHistoricalReconstructionState = "LOOKUP_RETURNED" | "NO_RESULTS" | ReplayHistoricalReconstructionErrorState;

export type ReplayHistoricalReconstructionScenario =
  | "BASELINE"
  | "HISTORICAL_RECONSTRUCTION"
  | "REPLAY_QUERY"
  | "TIMELINE_RECONSTRUCTION"
  | "MISSING_RECORD_DETECTION"
  | "MISMATCH_INSPECTION"
  | "REPLAY_RESULT_VIEW"
  | "RECONSTRUCTION_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "REPLAY_RECORD_NOT_FOUND"
  | "LINEAGE_REFERENCE_INVALID"
  | "INTEGRITY_REFERENCE_INVALID"
  | "MISSING_HISTORICAL_RECORD"
  | "REPLAY_MISMATCH"
  | "ORDERING_FAILURE"
  | "HASH_MISMATCH"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "VALIDATION_FAILURE"
  | "MUTATION_ATTEMPT";

export type ReconstructedHistoricalEvent = Readonly<{
  event_id: string;
  tenant_id: string;
  mission_id: string;
  category: HistoricalEventCategory;
  source_record_type: string;
  source_record_id: string;
  previous_event_id: string | null;
  next_event_id: string | null;
  original_timestamp: string;
  autonomy_event_sequence: number;
  input_references: readonly string[];
  policy_references: readonly string[];
  governance_reference: string;
  constitutional_reference: string;
  authority_reference: string;
  replay_reference: string;
  lineage_reference: string;
  execution_hash: string | null;
  replay_hash: string;
  integrity_hash: string;
  event_hash: string;
}>;

export type MissingHistoricalRecord = Readonly<{
  missing_record_id: string;
  missing_record_type: "PLAN" | "EXECUTION" | "CHECKPOINT" | "LINEAGE" | "REPLAY" | "GOVERNANCE" | "INTEGRITY" | "DELEGATION" | "SUPERVISION";
  expected_reference: string;
  detection_reason: string;
  reconstruction_blocking: boolean;
  replay_reference: string;
  lineage_reference: string;
  missing_hash: string;
}>;

export type MismatchHistoricalRecord = Readonly<{
  mismatch_id: string;
  mismatch_type: "REPLAY" | "LINEAGE" | "HASH" | "ORDERING" | "INTEGRITY" | "POLICY";
  expected_reference: string;
  observed_reference: string;
  detection_reason: string;
  affected_event_id: string;
  replay_reference: string;
  lineage_reference: string;
  mismatch_hash: string;
}>;

export type HistoricalReconstructionRecord = Readonly<{
  reconstruction_id: string;
  tenant_id: string;
  mission_id: string;
  reconstruction_scope: ReplayHistoricalReconstructionQueryType;
  replay_status: ReplayLookupStatus;
  reconstructed_events: readonly ReconstructedHistoricalEvent[];
  missing_events: readonly MissingHistoricalRecord[];
  mismatch_events: readonly MismatchHistoricalRecord[];
  timeline_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  governance_reference: string;
  reconstruction_timestamp: string;
  reconstruction_hash: string;
}>;

export type ReplayResultView = Readonly<{
  replay_query_id: string;
  replay_status: ReplayLookupStatus;
  reconstructed_event_count: number;
  missing_record_count: number;
  mismatch_count: number;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  verification_timestamp: string;
  replay_result_hash: string;
}>;

export type ReplayHistoricalReconstructionAuditRecord = Readonly<{
  audit_id: string;
  reconstruction_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  replay_status: ReplayLookupStatus;
  reconstructed_event_count: number;
  missing_record_count: number;
  mismatch_count: number;
  authorization_result: "APPROVED" | "REJECTED";
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type ReplayHistoricalReconstructionResponse = Readonly<{
  phase_version: "8I.6";
  schema_version: "replay-historical-reconstruction-query/v8I.6";
  lookup_id: string;
  lookup_type: ReplayHistoricalReconstructionQueryType;
  lookup_state: ReplayHistoricalReconstructionState;
  tenant_id: string;
  mission_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  plan_execution_lookup: PlanExecutionLookupResponse | null;
  delegation_orchestration_lookup: DelegationOrchestrationLookupResponse | null;
  supervision_intervention_boundary_lookup: SupervisionInterventionBoundaryLookupResponse | null;
  reconstruction_record: HistoricalReconstructionRecord | null;
  replay_result: ReplayResultView | null;
  audit_record: ReplayHistoricalReconstructionAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Replay and historical reconstruction queries are deterministic, read-only, evidence-backed, and never infer missing history.";
}>;

export type ReplayHistoricalReconstructionInput = Readonly<{
  scenario?: ReplayHistoricalReconstructionScenario;
  lookup_type?: ReplayHistoricalReconstructionQueryType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
}>;

export type ReplayHistoricalReconstructionObservabilitySurface = Readonly<{
  lookup_id: string;
  lookup_type: ReplayHistoricalReconstructionQueryType;
  lookup_state: ReplayHistoricalReconstructionState;
  replay_status: ReplayLookupStatus | null;
  tenant_id: string;
  mission_id: string;
  reconstructed_event_count: number;
  missing_record_count: number;
  mismatch_count: number;
  errors: readonly ReplayHistoricalReconstructionErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
