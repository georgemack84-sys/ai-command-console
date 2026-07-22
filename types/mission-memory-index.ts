import type { MemoryPermission, MemoryType } from "@/types/adaptive-memory-foundation";
import type { AdaptiveMemoryStoreResult, StorageCategory, StoredAdaptiveMemoryRecord } from "@/types/adaptive-memory-store";

export type MissionMemoryIndexStatus = "AUTHORITATIVE" | "REJECTED";

export type MemoryIndexFamily =
  | "MISSION_INDEX"
  | "CONTEXT_INDEX"
  | "STRATEGY_INDEX"
  | "RISK_INDEX"
  | "CONFIDENCE_INDEX"
  | "OPERATOR_INDEX"
  | "GOVERNANCE_INDEX"
  | "EVIDENCE_INDEX"
  | "REPLAY_INDEX"
  | "CERTIFICATION_INDEX";

export type IndexGenerationStage =
  | "VALIDATED_MEMORY"
  | "SCHEMA_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "ATTRIBUTE_EXTRACTION"
  | "DETERMINISTIC_INDEX_GENERATION"
  | "INDEX_VALIDATION"
  | "MEMORY_INDEX_LEDGER";

export type SearchCapability =
  | "MISSION"
  | "OBJECTIVE"
  | "OPERATOR"
  | "STRATEGY"
  | "EVIDENCE"
  | "GOVERNANCE"
  | "CONFIDENCE"
  | "RISK"
  | "SIMULATION"
  | "CERTIFICATION"
  | "REPLAY"
  | "PATTERN"
  | "RECOMMENDATION";

export type RankingInput =
  | "MISSION_SIMILARITY"
  | "EVIDENCE_QUALITY"
  | "GOVERNANCE_RELEVANCE"
  | "CONFIDENCE_CALIBRATION"
  | "RISK_SIMILARITY"
  | "STRATEGIC_ALIGNMENT"
  | "REPLAY_COMPLETENESS"
  | "CERTIFICATION_STATUS"
  | "RECENCY"
  | "HISTORICAL_EFFECTIVENESS";

export type MissionMemoryIndexFailure =
  | "STORE_UNAVAILABLE"
  | "NONDETERMINISTIC_INDEX_GENERATION"
  | "UNAUTHORIZED_MEMORY_SEARCHABLE"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATED"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "INDEX_CORRUPTION"
  | "DUPLICATE_INDEX_CREATED"
  | "NONDETERMINISTIC_LOOKUP_RESULTS"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "UNAUTHORIZED_INDEXING"
  | "UNAUTHORIZED_SEARCH"
  | "HIDDEN_INDEX_CREATED"
  | "INACTIVE_MEMORY_INDEXED";

export type MissionMemoryIndexScenario =
  | "BASELINE"
  | "STORE_UNAVAILABLE"
  | "NONDETERMINISTIC_INDEX"
  | "UNAUTHORIZED_MEMORY"
  | "MISSING_REPLAY"
  | "INCOMPLETE_EVIDENCE"
  | "TENANT_BREACH"
  | "GOVERNANCE_BYPASS"
  | "INDEX_CORRUPTION"
  | "DUPLICATE_INDEX"
  | "NONDETERMINISTIC_LOOKUP"
  | "INTEGRITY_FAILURE"
  | "UNAUTHORIZED_INDEXING"
  | "UNAUTHORIZED_SEARCH"
  | "HIDDEN_INDEX"
  | "INACTIVE_MEMORY";

export type MissionMemoryIndexEntry = Readonly<{
  index_id: string;
  index_family: MemoryIndexFamily;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  memory_type: MemoryType;
  storage_category: StorageCategory;
  indexed_attributes: Readonly<Record<string, string>>;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  confidence_score: number;
  retrieval_permissions: readonly MemoryPermission[];
  lifecycle_state: "INDEXED" | "SEARCHABLE" | "REJECTED";
  source_record_hash: string;
  encrypted_metadata_hash: string;
  tenant_partition_hash: string;
  integrity_hash: string;
}>;

export type MissionMemorySearchResult = Readonly<{
  result_id: string;
  index_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  ranking_score: number;
  ranking_inputs: readonly RankingInput[];
  matched_capabilities: readonly SearchCapability[];
  explanation: string;
  governance_authorized: boolean;
  replay_available: boolean;
  evidence_traceable: boolean;
  deterministic_rank: true;
  integrity_hash: string;
}>;

export type MemoryIndexLedgerEntry = Readonly<{
  ledger_id: string;
  index_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "INDEX_CREATION"
    | "ATTRIBUTE_EXTRACTION"
    | "INDEX_UPDATE"
    | "DETERMINISTIC_REBUILD"
    | "GOVERNANCE_APPROVAL"
    | "REPLAY_VALIDATION"
    | "RETRIEVAL_AUTHORIZATION"
    | "INTEGRITY_VALIDATION"
    | "SEARCH_FAILURE"
    | "ARCHIVAL_EVENT";
  stage: IndexGenerationStage;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type MissionMemoryIndexContract = Readonly<{
  contract_id: "mission-memory-index-contract";
  version: "mission-memory-index/v1";
  architecture: readonly string[];
  index_families: readonly MemoryIndexFamily[];
  generation_pipeline: readonly IndexGenerationStage[];
  search_capabilities: readonly SearchCapability[];
  ranking_inputs: readonly RankingInput[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  performance_requirements: readonly string[];
  discovery_structure_only: true;
  store_remains_authoritative: true;
  deterministic_indexing_required: true;
  governance_before_visibility_required: true;
  explainable_retrieval_required: true;
  hidden_indexes_supported: false;
  unauthorized_search_supported: false;
  authority_expansion_supported: false;
  integrity_hash: string;
}>;

export type MissionMemoryIndexMetrics = Readonly<{
  indexed_memories: number;
  indexing_throughput: number;
  lookup_latency_ms: number;
  rebuild_duration_ms: number;
  deterministic_replay_success: number;
  duplicate_index_prevention: boolean;
  retrieval_accuracy: number;
  authorization_failures: number;
  tenant_isolation_violations: number;
  index_growth: number;
  failures: readonly MissionMemoryIndexFailure[];
  integrity_hash: string;
}>;

export type MissionMemoryIndexApiSurface = Readonly<{
  api_id: string;
  establish_index: "POST /mission-memory-index/establish";
  retrieve_contract: "GET /mission-memory-index/contract";
  retrieve_entries: "POST /mission-memory-index/entries";
  search_index: "POST /mission-memory-index/search";
  retrieve_ranking: "POST /mission-memory-index/ranking";
  retrieve_ledger: "POST /mission-memory-index/ledger";
  retrieve_metrics: "POST /mission-memory-index/metrics";
  replay_index: "POST /mission-memory-index/replay";
  inspect_index: "POST /mission-memory-index/inspect";
  hidden_indexes_supported: false;
  unauthorized_indexing_supported: false;
  unauthorized_search_supported: false;
  cross_tenant_search_supported: false;
  system_of_record: false;
  integrity_hash: string;
}>;

export type MissionMemoryIndexInput = Readonly<{
  scenario?: MissionMemoryIndexScenario;
  store_result?: AdaptiveMemoryStoreResult;
}>;

export type MissionMemoryIndexResult = Readonly<{
  mission_memory_index_version: "mission-memory-index/v1";
  index_identifier: "MissionMemoryIndex";
  status: MissionMemoryIndexStatus;
  api_surface: MissionMemoryIndexApiSurface;
  store_result: AdaptiveMemoryStoreResult;
  contract: MissionMemoryIndexContract;
  source_records: readonly StoredAdaptiveMemoryRecord[];
  index_entries: readonly MissionMemoryIndexEntry[];
  search_results: readonly MissionMemorySearchResult[];
  index_ledger: readonly MemoryIndexLedgerEntry[];
  generation_pipeline: readonly IndexGenerationStage[];
  search_capabilities: readonly SearchCapability[];
  ranking_inputs: readonly RankingInput[];
  metrics: MissionMemoryIndexMetrics;
  failures: readonly MissionMemoryIndexFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  governed_visibility: boolean;
  governed_search_ready: boolean;
  store_remains_authoritative: true;
  discovery_structure_only: true;
  authority_expansion: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MissionMemoryIndex = Readonly<{
  mission_memory_index_version: "mission-memory-index/v1";
  supported_index_families: readonly MemoryIndexFamily[];
  supported_search_capabilities: readonly SearchCapability[];
  api_surface: MissionMemoryIndexApiSurface;
  result: MissionMemoryIndexResult;
}>;
