import type { MemoryPermission } from "@/types/adaptive-memory-foundation";
import type { MissionMemoryIndexResult, MissionMemoryIndexEntry } from "@/types/mission-memory-index";

export type PatternMemoryRegistryStatus = "AUTHORITATIVE" | "REJECTED";

export type PatternCategory =
  | "OUTCOME_PATTERN"
  | "FAILURE_PATTERN"
  | "SUCCESS_PATTERN"
  | "GOVERNANCE_PATTERN"
  | "OPERATOR_PATTERN"
  | "SIMULATION_PATTERN"
  | "STRATEGY_PATTERN"
  | "CONFIDENCE_PATTERN"
  | "RISK_PATTERN"
  | "CERTIFICATION_PATTERN";

export type PatternLifecycleState =
  | "CANDIDATE"
  | "QUALIFIED"
  | "GOVERNANCE_REVIEW"
  | "APPROVED"
  | "REGISTERED"
  | "INDEXED"
  | "ACTIVE"
  | "REFERENCED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type PatternSimilarityDimension =
  | "OUTCOME_SIMILARITY"
  | "STRATEGY_SIMILARITY"
  | "EVIDENCE_SIMILARITY"
  | "GOVERNANCE_SIMILARITY"
  | "OPERATOR_SIMILARITY"
  | "CONFIDENCE_SIMILARITY"
  | "RISK_SIMILARITY"
  | "SIMULATION_SIMILARITY"
  | "CERTIFICATION_SIMILARITY";

export type PatternMemoryFailure =
  | "INDEX_UNAVAILABLE"
  | "UNQUALIFIED_PATTERN_REGISTERED"
  | "HISTORICAL_VERSION_OVERWRITTEN"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "NONDETERMINISTIC_SIMILARITY"
  | "TENANT_ISOLATION_VIOLATED"
  | "UNAUTHORIZED_MODIFICATION"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CERTIFICATION_DEPENDENCY_IGNORED"
  | "INSUFFICIENT_RECURRENCE"
  | "CONFIDENCE_THRESHOLD_FAILED"
  | "UNAUTHORIZED_REUSE";

export type PatternMemoryScenario =
  | "BASELINE"
  | "INDEX_UNAVAILABLE"
  | "UNQUALIFIED_PATTERN"
  | "VERSION_OVERWRITE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_EVIDENCE"
  | "GOVERNANCE_BYPASS"
  | "NONDETERMINISTIC_SIMILARITY"
  | "TENANT_BREACH"
  | "UNAUTHORIZED_MODIFICATION"
  | "INTEGRITY_FAILURE"
  | "IGNORED_CERTIFICATION"
  | "INSUFFICIENT_RECURRENCE"
  | "LOW_CONFIDENCE"
  | "UNAUTHORIZED_REUSE";

export type PatternQualificationReport = Readonly<{
  statistical_significance: boolean;
  recurrence_frequency: boolean;
  evidence_sufficiency: boolean;
  replay_completeness: boolean;
  governance_compliance: boolean;
  confidence_stability: boolean;
  certification_dependencies: boolean;
  similarity_uniqueness: boolean;
  qualified: boolean;
  integrity_hash: string;
}>;

export type PatternMemoryRecord = Readonly<{
  pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  pattern_type: PatternCategory;
  pattern_summary: string;
  recurrence_score: number;
  confidence_score: number;
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  simulation_refs: readonly string[];
  certification_refs: readonly string[];
  version: string;
  lifecycle_state: PatternLifecycleState;
  reuse_permissions: readonly MemoryPermission[];
  source_index_id: string;
  immutable_identifier: true;
  encrypted_pattern_hash: string;
  tenant_partition_hash: string;
  integrity_hash: string;
}>;

export type PatternSimilarityRelation = Readonly<{
  relation_id: string;
  pattern_id: string;
  compared_pattern_id: string;
  dimensions: readonly PatternSimilarityDimension[];
  similarity_score: number;
  explanation: string;
  deterministic_scoring: true;
  replayable_calculation: true;
  integrity_hash: string;
}>;

export type PatternVersionRecord = Readonly<{
  version_id: string;
  pattern_id: string;
  version: string;
  supersedes_version_id?: string;
  qualification_hash: string;
  governance_hash: string;
  certification_hash: string;
  immutable: true;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type PatternLedgerEntry = Readonly<{
  ledger_id: string;
  pattern_id: string;
  tenant_id: string;
  event:
    | "PATTERN_DISCOVERY"
    | "QUALIFICATION_DECISION"
    | "GOVERNANCE_APPROVAL"
    | "REGISTRATION"
    | "VERSION_CREATION"
    | "SIMILARITY_UPDATE"
    | "REPLAY_VALIDATION"
    | "REUSE_EVENT"
    | "ARCHIVAL"
    | "INTEGRITY_VERIFICATION"
    | "REGISTRATION_FAILURE";
  lifecycle_state: PatternLifecycleState;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type PatternMemoryRegistryContract = Readonly<{
  contract_id: "pattern-memory-registry-contract";
  version: "pattern-memory-registry/v1";
  architecture: readonly string[];
  supported_categories: readonly PatternCategory[];
  lifecycle: readonly PatternLifecycleState[];
  similarity_dimensions: readonly PatternSimilarityDimension[];
  qualification_rules: readonly string[];
  reuse_rules: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  authoritative_pattern_registry: true;
  predictive_truth_supported: false;
  execution_logic_supported: false;
  overwrite_supported: false;
  unauthorized_reuse_supported: false;
  integrity_hash: string;
}>;

export type PatternMemoryRegistryMetrics = Readonly<{
  registered_patterns: number;
  qualification_success_rate: number;
  qualification_failures: number;
  similarity_calculations: number;
  pattern_reuse_frequency: number;
  replay_success: number;
  governance_approval_rate: number;
  version_growth: number;
  integrity_failures: number;
  tenant_isolation_violations: number;
  failures: readonly PatternMemoryFailure[];
  integrity_hash: string;
}>;

export type PatternMemoryRegistryApiSurface = Readonly<{
  api_id: string;
  establish_registry: "POST /pattern-memory-registry/establish";
  retrieve_contract: "GET /pattern-memory-registry/contract";
  retrieve_records: "POST /pattern-memory-registry/records";
  retrieve_qualification: "POST /pattern-memory-registry/qualification";
  retrieve_similarity: "POST /pattern-memory-registry/similarity";
  retrieve_versions: "POST /pattern-memory-registry/versions";
  retrieve_ledger: "POST /pattern-memory-registry/ledger";
  retrieve_metrics: "POST /pattern-memory-registry/metrics";
  replay_registry: "POST /pattern-memory-registry/replay";
  inspect_registry: "POST /pattern-memory-registry/inspect";
  unauthorized_modification_supported: false;
  unauthorized_reuse_supported: false;
  overwrite_supported: false;
  predictive_truth_supported: false;
  execution_logic_supported: false;
  integrity_hash: string;
}>;

export type PatternMemoryRegistryInput = Readonly<{
  scenario?: PatternMemoryScenario;
  index_result?: MissionMemoryIndexResult;
}>;

export type PatternMemoryRegistryResult = Readonly<{
  pattern_memory_registry_version: "pattern-memory-registry/v1";
  registry_identifier: "PatternMemoryRegistry";
  status: PatternMemoryRegistryStatus;
  api_surface: PatternMemoryRegistryApiSurface;
  index_result: MissionMemoryIndexResult;
  contract: PatternMemoryRegistryContract;
  source_index_entries: readonly MissionMemoryIndexEntry[];
  qualification_report: PatternQualificationReport;
  pattern_records: readonly PatternMemoryRecord[];
  similarity_catalog: readonly PatternSimilarityRelation[];
  version_history: readonly PatternVersionRecord[];
  pattern_ledger: readonly PatternLedgerEntry[];
  metrics: PatternMemoryRegistryMetrics;
  failures: readonly PatternMemoryFailure[];
  deterministic: boolean;
  replayable: boolean;
  governed: boolean;
  tenant_isolated: boolean;
  immutable_history: boolean;
  reuse_governed: boolean;
  authoritative_pattern_registry: true;
  predictive_truth_supported: false;
  execution_logic_supported: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternMemoryRegistry = Readonly<{
  pattern_memory_registry_version: "pattern-memory-registry/v1";
  supported_categories: readonly PatternCategory[];
  supported_similarity_dimensions: readonly PatternSimilarityDimension[];
  api_surface: PatternMemoryRegistryApiSurface;
  result: PatternMemoryRegistryResult;
}>;
