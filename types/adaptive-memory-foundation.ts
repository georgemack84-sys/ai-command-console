import type { DriftDefenseArchitectureResult } from "@/types/drift-defense-architecture";

export type AdaptiveMemoryStatus = "AUTHORITATIVE" | "FAIL_CLOSED";

export type MemoryLifecycleStage =
  | "DISCOVERED"
  | "CANDIDATE"
  | "VALIDATED"
  | "GOVERNANCE_REVIEW"
  | "APPROVED"
  | "INDEXED"
  | "ACTIVE"
  | "REUSED"
  | "SUPERSEDED"
  | "EXPIRED"
  | "ARCHIVED";

export type MemoryOwner =
  | "MISSION"
  | "TENANT"
  | "RECOMMENDATION"
  | "PATTERN"
  | "STRATEGY"
  | "RISK_ANALYSIS"
  | "CONFIDENCE_ANALYSIS"
  | "GOVERNANCE_DECISION"
  | "SIMULATION"
  | "CERTIFICATION";

export type MemoryClassification =
  | "OUTCOME_MEMORY"
  | "RECOMMENDATION_MEMORY"
  | "RISK_MEMORY"
  | "CONFIDENCE_MEMORY"
  | "GOVERNANCE_MEMORY"
  | "OPERATOR_MEMORY"
  | "STRATEGY_MEMORY"
  | "PATTERN_MEMORY"
  | "SIMULATION_MEMORY"
  | "ROLLBACK_MEMORY"
  | "CERTIFICATION_MEMORY";

export type MemoryType =
  | "EVIDENCE_OBSERVATION"
  | "VALIDATED_OUTCOME"
  | "CERTIFIED_PATTERN"
  | "GOVERNANCE_HISTORY"
  | "REPLAY_REFERENCE"
  | "SIMULATION_HISTORY"
  | "OPERATOR_DECISION"
  | "CERTIFICATION_HISTORY";

export type MemoryPermission =
  | "READ"
  | "REUSE"
  | "REPLAY"
  | "GOVERNANCE_REVIEW"
  | "CERTIFICATION_REVIEW"
  | "ARCHIVE";

export type MemoryAuthorityLevel = "ADVISORY_ONLY";
export type MemoryVisibility = "TENANT_PRIVATE" | "MISSION_SCOPED" | "GOVERNANCE_RESTRICTED" | "CERTIFICATION_RESTRICTED";
export type MemoryReusePolicy = "GOVERNANCE_APPROVED_REUSE" | "REPLAY_REQUIRED_REUSE" | "CERTIFICATION_REQUIRED_REUSE" | "REUSE_PROHIBITED";

export type AdaptiveMemoryFailure =
  | "DRIFT_DEFENSE_UNAVAILABLE"
  | "EVIDENCE_VALIDATION_MISSING"
  | "REPLAY_VALIDATION_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "INTEGRITY_VALIDATION_FAILED"
  | "CLASSIFICATION_MISSING"
  | "OWNERSHIP_AMBIGUOUS"
  | "TENANT_ISOLATION_BREACH"
  | "REUSE_AUTHORIZATION_MISSING"
  | "CERTIFICATION_INVALID"
  | "DELETE_ATTEMPTED"
  | "PRODUCTION_MUTATION_ATTEMPTED"
  | "AUTHORITY_EXPANSION_ATTEMPTED"
  | "AUTONOMOUS_LEARNING_ATTEMPTED"
  | "HIDDEN_MEMORY_ATTEMPTED"
  | "HISTORY_REWRITE_ATTEMPTED"
  | "RESTRICTED_INFORMATION_EXPOSURE";

export type AdaptiveMemoryScenario =
  | "BASELINE"
  | "DRIFT_DEFENSE_UNAVAILABLE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "INTEGRITY_FAILURE"
  | "MISSING_CLASSIFICATION"
  | "AMBIGUOUS_OWNER"
  | "TENANT_MISMATCH"
  | "MISSING_REUSE_AUTHORIZATION"
  | "INVALID_CERTIFICATION"
  | "DELETE_ATTEMPT"
  | "PRODUCTION_MUTATION"
  | "AUTHORITY_EXPANSION"
  | "AUTONOMOUS_LEARNING"
  | "HIDDEN_MEMORY"
  | "HISTORY_REWRITE"
  | "RESTRICTED_EXPOSURE";

export type AdaptiveMemoryContractField =
  | "memory_id"
  | "tenant_id"
  | "mission_scope"
  | "memory_type"
  | "memory_summary"
  | "evidence_references"
  | "outcome_references"
  | "pattern_references"
  | "governance_references"
  | "replay_references"
  | "reuse_policy"
  | "authority_level"
  | "classification"
  | "visibility"
  | "expiration_policy"
  | "integrity_hash";

export type AdaptiveMemoryContract = Readonly<{
  contract_id: "adaptive-memory-foundation-contract";
  version: "adaptive-memory-foundation/v1";
  definition: string;
  required_fields: readonly AdaptiveMemoryContractField[];
  allowed_types: readonly MemoryType[];
  allowed_owners: readonly MemoryOwner[];
  allowed_classifications: readonly MemoryClassification[];
  lifecycle: readonly MemoryLifecycleStage[];
  permissions: readonly MemoryPermission[];
  authority_level: MemoryAuthorityLevel;
  advisory_only: true;
  autonomous_learning_supported: false;
  production_mutation_supported: false;
  cross_tenant_reuse_supported_by_default: false;
  deletion_supported: false;
  integrity_hash: string;
}>;

export type MemoryRecord = Readonly<{
  memory_id: string;
  tenant_id: string;
  mission_scope: string;
  memory_type: MemoryType;
  memory_summary: string;
  evidence_references: readonly string[];
  outcome_references: readonly string[];
  pattern_references: readonly string[];
  governance_references: readonly string[];
  replay_references: readonly string[];
  reuse_policy: MemoryReusePolicy;
  authority_level: MemoryAuthorityLevel;
  classification: MemoryClassification;
  secondary_classifications: readonly MemoryClassification[];
  visibility: MemoryVisibility;
  expiration_policy: "SUPERSEDE_EXPIRE_ARCHIVE_ONLY";
  owner: MemoryOwner;
  creator: string;
  lifecycle_stage: MemoryLifecycleStage;
  evidence_validated: boolean;
  replay_validated: boolean;
  governance_approved: boolean;
  integrity_verified: boolean;
  certification_valid: boolean;
  reuse_authorized: boolean;
  created_at: string;
  supersedes_memory_id?: string;
  integrity_hash: string;
}>;

export type MemoryPermissionRegistryEntry = Readonly<{
  owner: MemoryOwner;
  visibility: MemoryVisibility;
  permissions: readonly MemoryPermission[];
  governance_policy: string;
  reuse_permissions: readonly MemoryReusePolicy[];
  replay_required: boolean;
  archival_policy: "APPEND_ONLY_ARCHIVE";
  expiration_policy: "NO_DELETE_SUPERSEDE_EXPIRE_ARCHIVE";
  integrity_hash: string;
}>;

export type AdaptiveMemoryGovernanceValidation = Readonly<{
  constitutional_compliance: boolean;
  governance_policy: boolean;
  tenant_boundaries: boolean;
  mission_scope: boolean;
  authority_limits: boolean;
  replay_availability: boolean;
  evidence_lineage: boolean;
  certification_dependencies: boolean;
  reuse_authorization: boolean;
  available_for_reuse: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemoryLedgerEntry = Readonly<{
  ledger_id: string;
  memory_id: string;
  transition: string;
  lifecycle_stage: MemoryLifecycleStage;
  tenant_id: string;
  owner: MemoryOwner;
  classification: MemoryClassification;
  governance_validated: boolean;
  replay_validated: boolean;
  authority_validated: boolean;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type AdaptiveMemoryMetrics = Readonly<{
  lifecycle_stage_count: number;
  classification_count: number;
  owner_count: number;
  permission_count: number;
  ledger_entry_count: number;
  active_memory_count: number;
  deterministic_replay_guaranteed: boolean;
  governance_before_reuse_enforced: boolean;
  tenant_isolation_preserved: boolean;
  advisory_only_enforced: boolean;
  deletion_blocked: boolean;
  failures: readonly AdaptiveMemoryFailure[];
  integrity_hash: string;
}>;

export type AdaptiveMemoryApiSurface = Readonly<{
  api_id: string;
  establish_foundation: "POST /adaptive-memory-foundation/establish";
  retrieve_contract: "GET /adaptive-memory-foundation/contract";
  retrieve_lifecycle: "POST /adaptive-memory-foundation/lifecycle";
  retrieve_classifications: "POST /adaptive-memory-foundation/classifications";
  retrieve_permissions: "POST /adaptive-memory-foundation/permissions";
  retrieve_governance: "POST /adaptive-memory-foundation/governance";
  retrieve_ledger: "POST /adaptive-memory-foundation/ledger";
  replay_foundation: "POST /adaptive-memory-foundation/replay";
  inspect_foundation: "POST /adaptive-memory-foundation/inspect";
  autonomous_learning_supported: false;
  production_mutation_supported: false;
  cross_tenant_reuse_supported_by_default: false;
  deletion_supported: false;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AdaptiveMemoryInput = Readonly<{
  scenario?: AdaptiveMemoryScenario;
  drift_defense_result?: DriftDefenseArchitectureResult;
}>;

export type AdaptiveMemoryFoundationResult = Readonly<{
  adaptive_memory_foundation_version: "adaptive-memory-foundation/v1";
  foundation_identifier: "AdaptiveMemoryFoundation";
  status: AdaptiveMemoryStatus;
  api_surface: AdaptiveMemoryApiSurface;
  drift_defense_result: DriftDefenseArchitectureResult;
  contract: AdaptiveMemoryContract;
  lifecycle: readonly MemoryLifecycleStage[];
  classification_taxonomy: readonly MemoryClassification[];
  ownership_model: readonly MemoryOwner[];
  permission_registry: readonly MemoryPermissionRegistryEntry[];
  governance_validation: AdaptiveMemoryGovernanceValidation;
  memory_records: readonly MemoryRecord[];
  foundation_ledger: readonly AdaptiveMemoryLedgerEntry[];
  replay_requirements: readonly string[];
  reuse_rules: readonly string[];
  prohibited_behaviors: readonly string[];
  constitutional_guarantees: readonly string[];
  metrics: AdaptiveMemoryMetrics;
  failures: readonly AdaptiveMemoryFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_visibility_preserved: boolean;
  tenant_isolated: boolean;
  immutable_lineage: true;
  advisory_only: true;
  authorizes_actions: false;
  authorizes_production_mutation: false;
  authorizes_governance_override: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptiveMemoryFoundation = Readonly<{
  adaptive_memory_foundation_version: "adaptive-memory-foundation/v1";
  supported_classifications: readonly MemoryClassification[];
  supported_lifecycle: readonly MemoryLifecycleStage[];
  api_surface: AdaptiveMemoryApiSurface;
  result: AdaptiveMemoryFoundationResult;
}>;
