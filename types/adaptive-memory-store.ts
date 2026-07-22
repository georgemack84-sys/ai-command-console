import type {
  AdaptiveMemoryFoundationResult,
  MemoryClassification,
  MemoryOwner,
  MemoryPermission,
  MemoryType,
} from "@/types/adaptive-memory-foundation";

export type AdaptiveMemoryStoreStatus = "AUTHORITATIVE" | "REJECTED";

export type StorageLifecycleState =
  | "CANDIDATE"
  | "VALIDATED"
  | "APPROVED"
  | "PERSISTED"
  | "INDEXED"
  | "AVAILABLE"
  | "REUSED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "ARCHIVED";

export type StorageCategory =
  | "OUTCOME_MEMORY"
  | "RECOMMENDATION_MEMORY"
  | "STRATEGY_MEMORY"
  | "GOVERNANCE_MEMORY"
  | "SIMULATION_MEMORY"
  | "CERTIFICATION_MEMORY"
  | "RISK_MEMORY"
  | "CONFIDENCE_MEMORY"
  | "PATTERN_MEMORY"
  | "ROLLBACK_MEMORY"
  | "OPERATOR_MEMORY";

export type StorageValidationStage =
  | "SCHEMA_VALIDATION"
  | "IDENTITY_VALIDATION"
  | "OWNERSHIP_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VERIFICATION"
  | "TENANT_ISOLATION_VALIDATION"
  | "CERTIFICATION_DEPENDENCY_VALIDATION"
  | "LEDGER_RECORDING";

export type RetrievalIndex =
  | "MEMORY_ID"
  | "TENANT"
  | "MISSION"
  | "STRATEGY"
  | "RECOMMENDATION"
  | "GOVERNANCE"
  | "SIMULATION"
  | "CONFIDENCE"
  | "RISK"
  | "CERTIFICATION"
  | "REPLAY_REFERENCE"
  | "EVIDENCE_REFERENCE";

export type AdaptiveMemoryStoreFailure =
  | "FOUNDATION_UNAVAILABLE"
  | "SCHEMA_INVALID"
  | "DUPLICATE_IDENTITY"
  | "OWNERSHIP_UNDEFINED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "CERTIFICATION_DEPENDENCY_INVALID"
  | "LEDGER_RECORDING_FAILED"
  | "UNAUTHORIZED_WRITE"
  | "UNAUTHORIZED_READ"
  | "OVERWRITE_ATTEMPTED"
  | "DELETE_ATTEMPTED"
  | "EVIDENCE_REWRITE_ATTEMPTED"
  | "GOVERNANCE_HISTORY_MUTATION_ATTEMPTED"
  | "REPLAY_REFERENCE_MUTATION_ATTEMPTED"
  | "CORRUPTION_UNDETECTED"
  | "DETERMINISTIC_PERSISTENCE_FAILED";

export type AdaptiveMemoryStoreScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "INVALID_SCHEMA"
  | "DUPLICATE_IDENTITY"
  | "UNDEFINED_OWNERSHIP"
  | "INCOMPLETE_EVIDENCE"
  | "BYPASSED_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INTEGRITY_FAILURE"
  | "TENANT_BREACH"
  | "INVALID_CERTIFICATION"
  | "LEDGER_FAILURE"
  | "UNAUTHORIZED_WRITE"
  | "UNAUTHORIZED_READ"
  | "OVERWRITE_ATTEMPT"
  | "DELETE_ATTEMPT"
  | "EVIDENCE_REWRITE"
  | "GOVERNANCE_MUTATION"
  | "REPLAY_MUTATION"
  | "UNDETECTED_CORRUPTION"
  | "NONDETERMINISTIC_PERSISTENCE";

export type MemoryIdentity = Readonly<{
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  memory_type: MemoryType;
  creation_timestamp: string;
  version: string;
  source_integrity_hash: string;
  global_identity: string;
  collision_resistant: true;
  replay_reproducible: true;
  lineage_traceable: true;
  integrity_hash: string;
}>;

export type StoredAdaptiveMemoryRecord = Readonly<{
  memory_id: string;
  tenant_id: string;
  mission_scope: string;
  memory_type: MemoryType;
  classification: MemoryClassification;
  storage_category: StorageCategory;
  memory_summary: string;
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  pattern_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  reuse_permissions: readonly MemoryPermission[];
  lifecycle_state: StorageLifecycleState;
  expiration_policy: "NO_DELETE_SUPERSEDE_EXPIRE_ARCHIVE";
  owner: MemoryOwner;
  version: string;
  identity: MemoryIdentity;
  encrypted_payload_hash: string;
  tenant_partition_hash: string;
  previous_version_id?: string;
  integrity_hash: string;
}>;

export type IntegrityValidationReport = Readonly<{
  hash_validation: boolean;
  duplicate_detection: boolean;
  corruption_detection: boolean;
  lineage_verification: boolean;
  replay_verification: boolean;
  schema_consistency: boolean;
  ownership_verified: boolean;
  governance_references_verified: boolean;
  certification_references_verified: boolean;
  write_authorized: boolean;
  read_authorized: boolean;
  persistence_allowed: boolean;
  integrity_hash: string;
}>;

export type MemoryStorageLedgerEntry = Readonly<{
  ledger_id: string;
  memory_id: string;
  tenant_id: string;
  storage_event:
    | "MEMORY_CREATION"
    | "IDENTITY_ASSIGNMENT"
    | "INTEGRITY_VALIDATION"
    | "GOVERNANCE_APPROVAL"
    | "REPLAY_VALIDATION"
    | "PERSISTENCE_EVENT"
    | "INDEXING_EVENT"
    | "AVAILABILITY_EVENT"
    | "ARCHIVAL_EVENT"
    | "EXPIRATION_EVENT"
    | "STORAGE_FAILURE";
  version: string;
  lifecycle_state: StorageLifecycleState;
  validation_stage: StorageValidationStage;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemoryStoreContract = Readonly<{
  contract_id: "adaptive-memory-store-contract";
  version: "adaptive-memory-store/v1";
  architecture: readonly string[];
  lifecycle: readonly StorageLifecycleState[];
  categories: readonly StorageCategory[];
  validation_pipeline: readonly StorageValidationStage[];
  retrieval_indexes: readonly RetrievalIndex[];
  storage_rules: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  system_of_record: true;
  deterministic_persistence_required: true;
  immutable_records_required: true;
  tenant_isolation_required: true;
  encryption_required: true;
  autonomous_learning_repository: false;
  overwrite_supported: false;
  deletion_supported: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryStoreMetrics = Readonly<{
  total_memories_stored: number;
  storage_growth_records: number;
  write_latency_ms: number;
  validation_failures: number;
  duplicate_rejections: number;
  integrity_failures: number;
  corruption_detections: number;
  replay_success_rate: number;
  tenant_isolation_violations: number;
  storage_utilization_units: number;
  failures: readonly AdaptiveMemoryStoreFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryStoreApiSurface = Readonly<{
  api_id: string;
  establish_store: "POST /adaptive-memory-store/establish";
  retrieve_contract: "GET /adaptive-memory-store/contract";
  retrieve_records: "POST /adaptive-memory-store/records";
  retrieve_identity: "POST /adaptive-memory-store/identity";
  retrieve_integrity: "POST /adaptive-memory-store/integrity";
  retrieve_ledger: "POST /adaptive-memory-store/ledger";
  retrieve_retrieval_readiness: "POST /adaptive-memory-store/retrieval";
  retrieve_metrics: "POST /adaptive-memory-store/metrics";
  replay_store: "POST /adaptive-memory-store/replay";
  inspect_store: "POST /adaptive-memory-store/inspect";
  unauthorized_write_supported: false;
  unauthorized_read_supported: false;
  overwrite_supported: false;
  deletion_supported: false;
  cross_tenant_storage_supported: false;
  autonomous_learning_repository: false;
  integrity_hash: string;
}>;

export type AdaptiveMemoryStoreInput = Readonly<{
  scenario?: AdaptiveMemoryStoreScenario;
  foundation_result?: AdaptiveMemoryFoundationResult;
}>;

export type AdaptiveMemoryStoreResult = Readonly<{
  adaptive_memory_store_version: "adaptive-memory-store/v1";
  store_identifier: "AdaptiveMemoryStore";
  status: AdaptiveMemoryStoreStatus;
  api_surface: AdaptiveMemoryStoreApiSurface;
  foundation_result: AdaptiveMemoryFoundationResult;
  contract: AdaptiveMemoryStoreContract;
  storage_engine: readonly StoredAdaptiveMemoryRecord[];
  identity_registry: readonly MemoryIdentity[];
  integrity_report: IntegrityValidationReport;
  storage_ledger: readonly MemoryStorageLedgerEntry[];
  retrieval_indexes: readonly RetrievalIndex[];
  validation_pipeline: readonly StorageValidationStage[];
  metrics: AdaptiveMemoryStoreMetrics;
  failures: readonly AdaptiveMemoryStoreFailure[];
  deterministic: boolean;
  replayable: boolean;
  immutable: boolean;
  append_only: boolean;
  tenant_isolated: boolean;
  governed_retrieval_ready: boolean;
  encryption_enforced: boolean;
  unauthorized_mutation_prevented: boolean;
  system_of_record: true;
  autonomous_learning_repository: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryStore = Readonly<{
  adaptive_memory_store_version: "adaptive-memory-store/v1";
  supported_categories: readonly StorageCategory[];
  supported_lifecycle: readonly StorageLifecycleState[];
  api_surface: AdaptiveMemoryStoreApiSurface;
  result: AdaptiveMemoryStoreResult;
}>;
