import type {
  GovernanceQueryAuditRecord,
  GovernanceQueryContract,
  GovernanceQueryErrorState,
  GovernanceQueryTargetObject,
  GovernanceQueryType,
  GovernanceQueryValidationIssue,
  GovernanceQueryValidationResult,
} from "@/types/governance-query-contract";

export type GovernanceSearchDomain =
  | "POLICY"
  | "RECOMMENDATION"
  | "VIOLATION"
  | "ESCALATION"
  | "RISK"
  | "COMPLIANCE"
  | "EVIDENCE"
  | "REPLAY"
  | "LINEAGE"
  | "CERTIFICATION"
  | "AUDIT"
  | "TRUTH_LEDGER";

export type GovernanceSearchErrorState =
  | "SEARCH_TARGET_NOT_FOUND"
  | "INVALID_QUERY"
  | "INVALID_FILTER"
  | "INVALID_SCOPE"
  | "UNAUTHORIZED"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INDEX_INCONSISTENT";

export type GovernanceSearchResultState =
  | "RESULTS_GENERATED"
  | "NO_RESULTS"
  | GovernanceSearchErrorState;

export type GovernanceSearchScenario =
  | "BASELINE"
  | "EXACT_IDENTIFIER_LOOKUP"
  | "HISTORICAL_SEARCH"
  | "LINEAGE_SEARCH"
  | "REPLAY_SEARCH"
  | "NO_MATCHES"
  | "SEARCH_TARGET_NOT_FOUND"
  | "INVALID_QUERY"
  | "INVALID_FILTER"
  | "INVALID_SCOPE"
  | "UNAUTHORIZED"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "INDEX_INCONSISTENT"
  | "NON_DETERMINISTIC_ORDERING"
  | "MUTATION_ATTEMPT";

export type GovernanceSearchIndexState = "VERIFIED" | "INCONSISTENT";

export type GovernanceSearchRecord = Readonly<{
  immutable_identifier: string;
  tenant_id: string;
  mission_id: string;
  domain: GovernanceSearchDomain;
  object_type: GovernanceQueryTargetObject;
  query_type: GovernanceQueryType;
  title: string;
  summary: string;
  governance_timestamp: string;
  ledger_sequence: number;
  lineage_hierarchy: string;
  object_version: string;
  policy_refs: readonly string[];
  authority_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  tags: readonly string[];
  state: string;
  severity: string;
  confidence: number;
  integrity_state: "VALID" | "DEGRADED" | "CORRUPTED";
  restricted: boolean;
  payload_hash: string;
}>;

export type GovernanceSearchRequest = Readonly<{
  search_id: string;
  query_contract: GovernanceQueryContract;
  lookup_type: GovernanceQueryType;
  target_object: GovernanceQueryTargetObject;
  search_terms: readonly string[];
  immutable_identifier?: string;
  requested_domains: readonly GovernanceSearchDomain[];
  include_evidence: boolean;
  include_lineage: boolean;
  include_replay: boolean;
  historical_timestamp?: string;
  created_timestamp: string;
}>;

export type GovernanceSearchExecutionPlan = Readonly<{
  plan_id: string;
  normalized_query_hash: string | null;
  index_version: "governance-search-index/v7J.2";
  selected_indexes: readonly GovernanceSearchDomain[];
  filter_strategy: "CANONICAL_FILTER_SCAN" | "IMMUTABLE_IDENTIFIER_LOOKUP" | "HISTORICAL_RECONSTRUCTION" | "LINEAGE_TRAVERSAL" | "REPLAY_REFERENCE_LOOKUP";
  deterministic_ordering: readonly ["TENANT", "MISSION", "GOVERNANCE_TIMESTAMP", "LEDGER_SEQUENCE", "LINEAGE_HIERARCHY", "IMMUTABLE_IDENTIFIER", "OBJECT_VERSION"];
  replay_safe: boolean;
  plan_hash: string;
}>;

export type GovernanceSearchIndexManifest = Readonly<{
  index_id: string;
  index_version: "governance-search-index/v7J.2";
  state: GovernanceSearchIndexState;
  domains: readonly GovernanceSearchDomain[];
  record_count: number;
  index_hash: string;
  verified_at: string;
}>;

export type GovernanceSearchResult = Readonly<{
  result_id: string;
  immutable_identifier: string;
  domain: GovernanceSearchDomain;
  object_type: GovernanceQueryTargetObject;
  title: string;
  summary: string;
  governance_timestamp: string;
  ledger_sequence: number;
  lineage_hierarchy: string;
  object_version: string;
  deterministic_score: number;
  ranking_inputs: Readonly<{
    exact_identifier_match: boolean;
    tenant_match: boolean;
    mission_match: boolean;
    term_match_count: number;
    evidence_count: number;
    lineage_depth: number;
  }>;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  explanation: string;
  result_hash: string;
}>;

export type GovernanceSearchReplaySupport = Readonly<{
  replay_id: string;
  reconstruction_hash: string;
  source_query_hash: string;
  result_hashes: readonly string[];
  ranking_stable: boolean;
  replay_safe: boolean;
}>;

export type GovernanceSearchAuditRecord = GovernanceQueryAuditRecord & Readonly<{
  search_id: string;
  search_hash: string;
  index_hash: string;
  plan_hash: string;
  result_state: GovernanceSearchResultState;
}>;

export type GovernanceSearchResponse = Readonly<{
  phase_version: "7J.2";
  schema_version: "governance-search-engine/v7J.2";
  search_id: string;
  query_id: string | null;
  query_hash: string | null;
  tenant_id: string;
  mission_id: string;
  lookup_type: GovernanceQueryType;
  target_object: GovernanceQueryTargetObject;
  result_state: GovernanceSearchResultState;
  result_count: number;
  results: readonly GovernanceSearchResult[];
  validation: GovernanceQueryValidationResult;
  optimizer_plan: GovernanceSearchExecutionPlan;
  index_manifest: GovernanceSearchIndexManifest;
  replay_support: GovernanceSearchReplaySupport;
  audit_record: GovernanceSearchAuditRecord;
  failures: readonly GovernanceQueryValidationIssue[];
  search_hash: string;
  read_only: true;
  advisory_only_notice: "Governance search is deterministic, read-only, replayable, and audit-backed.";
}>;

export type GovernanceSearchInput = Readonly<{
  scenario?: GovernanceSearchScenario;
  query_contract?: GovernanceQueryContract;
  query_scenario?: string;
  records?: readonly GovernanceSearchRecord[];
  search_terms?: readonly string[];
  immutable_identifier?: string;
  requested_domains?: readonly GovernanceSearchDomain[];
}>;

export type GovernanceSearchObservabilitySurface = Readonly<{
  search_id: string;
  query_id: string | null;
  result_state: GovernanceSearchResultState;
  result_count: number;
  errors: readonly GovernanceSearchErrorState[];
  index_state: GovernanceSearchIndexState;
  ranking_stable: boolean;
  replay_safe: boolean;
  search_hash: string;
}>;
