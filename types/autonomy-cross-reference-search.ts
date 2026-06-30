import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";
import type { AutonomyLineageSearchResponse } from "@/types/autonomy-lineage-search";

export type CrossReferenceSearchType = "CROSS_REFERENCE_SEARCH" | "REFERENCE_RESOLUTION" | "CONFLICT_DETECTION" | "MISSING_REFERENCE_DETECTION" | "CROSS_LEDGER_VIEW";
export type CrossReferenceRecordType = "PLAN" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "INTERVENTION" | "REPLAY" | "INTEGRITY" | "POLICY" | "BOUNDARY" | "CONFIDENCE" | "OUTCOME" | "FAILURE" | "ROLLBACK_RECOMMENDATION";
export type CrossReferenceRelationshipType = "LINKED_TO" | "DERIVED_FROM" | "CAUSED_BY" | "VALIDATED_BY" | "BLOCKED_BY" | "AUTHORIZED_BY" | "REJECTED_BY" | "SUPERVISED_BY" | "INTERVENED_BY" | "REPLAYED_BY" | "VERIFIED_BY" | "ROLLBACK_RECOMMENDED_BY" | "OUTCOME_INFLUENCED_BY";
export type CrossReferenceStatus = "VALID" | "STALE" | "MISSING" | "CONFLICTING" | "UNAUTHORIZED" | "INVALID";
export type AutonomyLedgerName = "PLANNING" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "SUPERVISION" | "INTERVENTION" | "REPLAY" | "INTEGRITY" | "GOVERNANCE" | "BOUNDARY" | "CONFIDENCE" | "OUTCOME" | "RECOVERY";

export type AutonomyCrossReferenceErrorState =
  | "INVALID_CROSS_REFERENCE_QUERY"
  | "SOURCE_RECORD_NOT_FOUND"
  | "TARGET_RECORD_NOT_FOUND"
  | "STALE_REFERENCE"
  | "MISSING_REFERENCE"
  | "CONFLICTING_REFERENCE"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "CROSS_TENANT_LINK_REJECTED"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INTEGRITY_REFERENCE_INVALID"
  | "ORDERING_FAILURE";

export type AutonomyCrossReferenceSearchState = "LOOKUP_RETURNED" | "NO_RESULTS" | AutonomyCrossReferenceErrorState;

export type AutonomyCrossReferenceScenario =
  | "BASELINE"
  | "CROSS_REFERENCE_SEARCH"
  | "REFERENCE_RESOLUTION"
  | "CONFLICT_DETECTION"
  | "MISSING_REFERENCE_DETECTION"
  | "CROSS_LEDGER_VIEW"
  | "SOURCE_RECORD_NOT_FOUND"
  | "TARGET_RECORD_NOT_FOUND"
  | "STALE_REFERENCE"
  | "MISSING_REFERENCE"
  | "CONFLICTING_REFERENCE"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "CROSS_TENANT_LINK_REJECTED"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INTEGRITY_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "MUTATION_ATTEMPT";

export type CrossReferenceRecord = Readonly<{
  cross_reference_id: string;
  tenant_id: string;
  mission_id: string;
  source_record_id: string;
  source_record_type: CrossReferenceRecordType;
  target_record_id: string;
  target_record_type: CrossReferenceRecordType;
  relationship_type: CrossReferenceRelationshipType;
  ledger_source: AutonomyLedgerName;
  ledger_target: AutonomyLedgerName;
  reference_status: CrossReferenceStatus;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  governance_reference: string;
  conflict_reason: string | null;
  missing_reference_reason: string | null;
  stale_reference_reason: string | null;
  created_timestamp: string;
  cross_reference_hash: string;
}>;

export type CrossReferenceIndexEntry = Readonly<{
  index_id: string;
  source_key: string;
  target_key: string;
  relationship_type: CrossReferenceRelationshipType;
  ledger_pair: string;
  reference_status: CrossReferenceStatus;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  index_hash: string;
}>;

export type ReferenceResolverResult = Readonly<{
  resolver_id: string;
  source_record_id: string;
  target_record_id: string;
  source_valid: boolean;
  target_valid: boolean;
  tenant_match: boolean;
  mission_match: boolean;
  immutable_id_format_valid: boolean;
  lifecycle_state: "ACTIVE" | "SUPERSEDED" | "ARCHIVED" | "MISSING" | "INVALID";
  reference_status: CrossReferenceStatus;
  resolver_hash: string;
}>;

export type CrossReferenceConflict = Readonly<{
  conflict_id: string;
  conflict_type: "TENANT_MISMATCH" | "MISSION_MISMATCH" | "REPLAY_HASH_MISMATCH" | "LINEAGE_MISMATCH" | "POLICY_BOUNDARY_CONTRADICTION" | "CONFIDENCE_OUTCOME_CONTRADICTION" | "FAILURE_ROLLBACK_CONTRADICTION";
  source_record_id: string;
  target_record_id: string;
  conflict_reason: string;
  replay_reference: string;
  lineage_reference: string;
  conflict_hash: string;
}>;

export type MissingReferenceFinding = Readonly<{
  missing_reference_id: string;
  missing_type: "SOURCE_RECORD" | "TARGET_RECORD" | "REPLAY_REFERENCE" | "LINEAGE_REFERENCE" | "INTEGRITY_RECORD" | "GOVERNANCE_EVIDENCE" | "ROLLBACK_RECOMMENDATION";
  expected_reference: string;
  detection_reason: string;
  repair_attempted: false;
  replay_reference: string;
  lineage_reference: string;
  missing_hash: string;
}>;

export type CrossLedgerViewerRow = Readonly<{
  viewer_row_id: string;
  source_record: string;
  target_record: string;
  relationship_type: CrossReferenceRelationshipType;
  reference_status: CrossReferenceStatus;
  ledger_source: AutonomyLedgerName;
  ledger_target: AutonomyLedgerName;
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  conflict_reason: string | null;
  missing_reference_reason: string | null;
  row_hash: string;
}>;

export type AutonomyCrossReferenceSearchAuditRecord = Readonly<{
  audit_id: string;
  query_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  source_record_id: string;
  source_record_type: CrossReferenceRecordType;
  returned_reference_count: number;
  stale_reference_count: number;
  missing_reference_count: number;
  conflicting_reference_count: number;
  authorization_result: "APPROVED" | "REJECTED";
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type AutonomyCrossReferenceSearchResponse = Readonly<{
  phase_version: "8I.8";
  schema_version: "autonomy-cross-reference-search/v8I.8";
  query_id: string;
  search_type: CrossReferenceSearchType;
  search_state: AutonomyCrossReferenceSearchState;
  tenant_id: string;
  mission_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  lineage_response: AutonomyLineageSearchResponse | null;
  cross_reference_records: readonly CrossReferenceRecord[];
  cross_reference_index: readonly CrossReferenceIndexEntry[];
  resolver_results: readonly ReferenceResolverResult[];
  conflicts: readonly CrossReferenceConflict[];
  missing_references: readonly MissingReferenceFinding[];
  viewer_rows: readonly CrossLedgerViewerRow[];
  audit_record: AutonomyCrossReferenceSearchAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Cross-reference search is deterministic, read-only, replay-compatible, and never repairs references or rewrites ledgers.";
}>;

export type AutonomyCrossReferenceSearchInput = Readonly<{
  scenario?: AutonomyCrossReferenceScenario;
  search_type?: CrossReferenceSearchType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
}>;

export type AutonomyCrossReferenceSearchObservabilitySurface = Readonly<{
  query_id: string;
  search_type: CrossReferenceSearchType;
  search_state: AutonomyCrossReferenceSearchState;
  tenant_id: string;
  mission_id: string;
  reference_count: number;
  stale_reference_count: number;
  missing_reference_count: number;
  conflicting_reference_count: number;
  viewer_rows: number;
  errors: readonly AutonomyCrossReferenceErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
