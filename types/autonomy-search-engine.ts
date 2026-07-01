import type {
  AutonomyQueryAuditRecord,
  AutonomyQueryContract,
  AutonomyQueryType,
  AutonomyQueryValidationIssue,
  AutonomyQueryValidationResult,
} from "@/types/autonomy-query-contract";

export type AutonomySearchDomain =
  | "PLANNING"
  | "EXECUTION"
  | "DELEGATION"
  | "ORCHESTRATION"
  | "SUPERVISION"
  | "GOVERNANCE"
  | "INTERVENTION"
  | "REPLAY"
  | "INTEGRITY"
  | "BOUNDARY";

export type AutonomySearchRecordType =
  | "PLAN"
  | "EXECUTION"
  | "DELEGATION"
  | "ORCHESTRATION"
  | "SUPERVISION"
  | "INTERVENTION"
  | "POLICY"
  | "BOUNDARY_EVENT"
  | "REPLAY"
  | "INTEGRITY";

export type AutonomySearchErrorState =
  | "INVALID_QUERY"
  | "INVALID_FILTER"
  | "INVALID_SCOPE"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "OBJECT_NOT_FOUND"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INDEX_CORRUPTION"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION";

export type AutonomySearchResultState = "RESULTS_GENERATED" | "NO_RESULTS" | AutonomySearchErrorState;

export type AutonomySearchScenario =
  | "BASELINE"
  | "IDENTITY_SEARCH"
  | "EXECUTION_SEARCH"
  | "GOVERNANCE_SEARCH"
  | "REPLAY_SEARCH"
  | "LINEAGE_SEARCH"
  | "NO_MATCHES"
  | "INVALID_QUERY"
  | "INVALID_FILTER"
  | "INVALID_SCOPE"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "OBJECT_NOT_FOUND"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INDEX_CORRUPTION"
  | "ORDERING_FAILURE"
  | "POLICY_REJECTION"
  | "CONSTITUTIONAL_REJECTION"
  | "MUTATION_ATTEMPT";

export type AutonomySearchIndexState = "VERIFIED" | "CORRUPTED";

export type AutonomySearchRecord = Readonly<{
  search_record_id: string;
  tenant_id: string;
  mission_id: string;
  domain: AutonomySearchDomain;
  record_type: AutonomySearchRecordType;
  record_id: string;
  object_reference: string;
  object_state: string;
  timestamp: string;
  autonomy_event_sequence: number;
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  policy_reference: string;
  confidence_level: number;
  health_state: string;
  execution_state: string;
  intervention_type: string | null;
  integrity_hash: string;
  tags: readonly string[];
  summary: string;
  payload_hash: string;
}>;

export type AutonomySearchRequest = Readonly<{
  search_id: string;
  query_contract: AutonomyQueryContract;
  search_terms: readonly string[];
  immutable_identifier?: string;
  requested_domains: readonly AutonomySearchDomain[];
  requested_record_types: readonly AutonomySearchRecordType[];
  created_timestamp: string;
}>;

export type AutonomySearchExecutionPlan = Readonly<{
  plan_id: string;
  normalized_query_hash: string | null;
  index_version: "autonomy-search-index/v8I.2";
  selected_domains: readonly AutonomySearchDomain[];
  filter_strategy: "CANONICAL_FILTER_SCAN" | "IMMUTABLE_IDENTIFIER_LOOKUP" | "HISTORICAL_RECONSTRUCTION" | "LINEAGE_TRAVERSAL" | "REPLAY_REFERENCE_LOOKUP" | "CROSS_REFERENCE_SCAN";
  filter_evaluation_order: readonly ["Tenant", "Mission", "Authorization", "Record Type", "Time Range", "Execution State", "Policy", "Confidence", "Health", "Remaining Filters"];
  deterministic_ordering: readonly ["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"];
  replay_safe: boolean;
  read_only: true;
  plan_hash: string;
}>;

export type AutonomySearchIndexManifest = Readonly<{
  index_id: string;
  index_version: "autonomy-search-index/v8I.2";
  state: AutonomySearchIndexState;
  domains: readonly AutonomySearchDomain[];
  record_types: readonly AutonomySearchRecordType[];
  record_count: number;
  index_hash: string;
  verified_at: string;
}>;

export type AutonomySearchResult = Readonly<{
  query_id: string;
  search_record_id: string;
  record_type: AutonomySearchRecordType;
  record_id: string;
  summary: string;
  timestamp: string;
  confidence: number;
  governance_state: string;
  policy_reference: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  deterministic_score: number;
  explanation: string;
  result_hash: string;
}>;

export type AutonomySearchReplaySupport = Readonly<{
  replay_reference: string;
  reconstruction_hash: string;
  source_query_hash: string;
  result_hashes: readonly string[];
  ranking_stable: boolean;
  replay_safe: boolean;
}>;

export type AutonomySearchAuditRecord = AutonomyQueryAuditRecord & Readonly<{
  search_id: string;
  search_hash: string;
  index_hash: string;
  plan_hash: string;
  result_state: AutonomySearchResultState;
}>;

export type AutonomySearchResponse = Readonly<{
  phase_version: "8I.2";
  schema_version: "autonomy-search-engine/v8I.2";
  search_id: string;
  query_id: string | null;
  query_hash: string | null;
  tenant_id: string;
  mission_id: string;
  query_type: AutonomyQueryType;
  result_state: AutonomySearchResultState;
  result_count: number;
  results: readonly AutonomySearchResult[];
  validation: AutonomyQueryValidationResult;
  optimizer_plan: AutonomySearchExecutionPlan;
  index_manifest: AutonomySearchIndexManifest;
  replay_support: AutonomySearchReplaySupport;
  audit_record: AutonomySearchAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  search_hash: string;
  read_only: true;
  advisory_only_notice: "Autonomy search is deterministic, read-only, replayable, tenant-isolated, and audit-backed.";
}>;

export type AutonomySearchInput = Readonly<{
  scenario?: AutonomySearchScenario;
  query_contract?: AutonomyQueryContract;
  records?: readonly AutonomySearchRecord[];
  search_terms?: readonly string[];
  immutable_identifier?: string;
  requested_domains?: readonly AutonomySearchDomain[];
  requested_record_types?: readonly AutonomySearchRecordType[];
}>;

export type AutonomySearchObservabilitySurface = Readonly<{
  search_id: string;
  query_id: string | null;
  result_state: AutonomySearchResultState;
  result_count: number;
  errors: readonly AutonomySearchErrorState[];
  index_state: AutonomySearchIndexState;
  ranking_stable: boolean;
  replay_safe: boolean;
  search_hash: string;
}>;
