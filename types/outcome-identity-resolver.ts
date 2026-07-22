import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeNormalizationAdapterResult } from "@/types/outcome-normalization-adapter";

export type OutcomeIdentityState = "PENDING" | "RESOLVED" | "CANONICAL" | "DUPLICATE" | "SUPERSEDED" | "ARCHIVED";

export type DuplicateCategory = "EXACT_DUPLICATE" | "REPLAY_DUPLICATE" | "IMPORT_DUPLICATE" | "INVALID_DUPLICATE" | "NONE";

export type OutcomeIdentityCheck =
  | "NORMALIZATION_VALIDATION"
  | "IDENTITY_INPUT_VALIDATION"
  | "IDENTITY_GENERATION"
  | "DUPLICATE_DETECTION"
  | "CANONICAL_RESOLUTION"
  | "IDENTITY_REGISTRY"
  | "IDENTITY_LINEAGE"
  | "VERSION_TRACKING"
  | "REPLAY_RECONSTRUCTION"
  | "REGISTRY_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "INTEGRITY_VALIDATION";

export type OutcomeIdentityFailure =
  | "NORMALIZED_OUTCOME_NOT_VALIDATED"
  | "MISSING_IDENTIFIERS_REJECTED"
  | "INVALID_NORMALIZATION_VERSION_REJECTED"
  | "MALFORMED_TIMESTAMP_REJECTED"
  | "INCOMPLETE_OUTCOME_REFERENCE_REJECTED"
  | "CROSS_TENANT_REFERENCE_REJECTED"
  | "AMBIGUOUS_IDENTITY_REJECTED"
  | "RANDOM_IDENTITY_GENERATION_REJECTED"
  | "DUPLICATE_RESOLUTION_NONDETERMINISTIC"
  | "INVALID_DUPLICATE_MERGE_REJECTED"
  | "REGISTRY_APPEND_ONLY_VIOLATED"
  | "CANONICAL_IDENTITY_MUTATION_REJECTED"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_DIFFERED"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "TENANT_ISOLATION_VIOLATED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_IDENTITY_RESOLUTION_BEHAVIOR";

export type OutcomeIdentity = Readonly<{
  normalized_outcome_id: string;
  canonical_identity_id: string;
  source_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  normalized_outcome_type: string;
  normalization_version: string;
  identity_version: "10.2.2";
  identity_state: OutcomeIdentityState;
  duplicate_group_id: string;
  canonical_reference: string;
  lineage_root_id: string;
  parent_identity_refs: readonly string[];
  child_identity_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type IdentityLineageRecord = Readonly<{
  lineage_id: string;
  canonical_identity_id: string;
  lineage_root_id: string;
  parent_identity_id: string;
  child_identity_id: string;
  lineage_event: "ROOT_CREATED" | "CANONICAL_RESOLVED" | "DUPLICATE_BOUND" | "VERSION_RECORDED";
  event_timestamp: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DuplicateResolutionRecord = Readonly<{
  duplicate_group_id: string;
  candidate_identity_refs: readonly string[];
  canonical_identity_id: string;
  duplicate_reason: DuplicateCategory;
  resolution_rule: string;
  resolution_timestamp: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type IdentityInputValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  tenant_id_valid: boolean;
  mission_id_valid: boolean;
  decision_id_valid: boolean;
  outcome_type_valid: boolean;
  source_outcome_ref_valid: boolean;
  normalization_version_valid: boolean;
  timestamp_valid: boolean;
  tenant_isolated: boolean;
  failures: readonly OutcomeIdentityFailure[];
  integrity_hash: string;
}>;

export type IdentityRegistryRecord = Readonly<{
  registry_id: string;
  canonical_identity_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  identity_version: "10.2.2";
  canonical_reference: string;
  duplicate_group_id: string;
  lineage_root_id: string;
  replay_refs: readonly string[];
  ledger_sequence: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type IdentityApiSurface = Readonly<{
  api_id: string;
  generate_identity: "POST /identity/generate";
  resolve_identity: "POST /identity/resolve";
  detect_duplicates: "POST /identity/duplicates";
  lookup_identity: "GET /identity/{normalized_outcome_id}";
  retrieve_lineage: "GET /identity/{normalized_outcome_id}/lineage";
  deterministic_access: true;
  update_supported: false;
  delete_supported: false;
  integrity_hash: string;
}>;

export type IdentityReplayReport = Readonly<{
  replay_report_id: string;
  identity_hash: string;
  registry_hashes: readonly string[];
  lineage_hashes: readonly string[];
  duplicate_resolution_hash: string;
  replay_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  integrity_hash: string;
}>;

export type IdentityMetrics = Readonly<{
  metrics_id: string;
  identities_generated: number;
  duplicate_detections: number;
  duplicate_resolution_rate: number;
  registry_growth: number;
  lineage_depth: number;
  replay_consistency: number;
  identity_validation_failures: number;
  tenant_isolation_violations: number;
  canonical_lookup_latency_ms: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type IdentityAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeIdentityCheck[];
  identity_generator_operational: boolean;
  identity_registry_operational: boolean;
  duplicate_detector_operational: boolean;
  canonical_identity_rules_enforced: boolean;
  lineage_complete: boolean;
  version_tracking_preserved: boolean;
  registry_append_only: boolean;
  cross_tenant_resolution_blocked: boolean;
  replay_reconstruction_identical: boolean;
  failure_analysis: readonly OutcomeIdentityFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type OutcomeIdentityResolverInput = Readonly<{
  normalization_adapter?: OutcomeNormalizationAdapterResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "EXACT_DUPLICATE"
    | "REPLAY_DUPLICATE"
    | "IMPORT_DUPLICATE"
    | "INVALID_DUPLICATE"
    | "MISSING_IDENTIFIER"
    | "INVALID_NORMALIZATION_VERSION"
    | "MALFORMED_TIMESTAMP"
    | "INCOMPLETE_OUTCOME_REF"
    | "CROSS_TENANT_REFERENCE"
    | "AMBIGUOUS_IDENTITY"
    | "RANDOM_IDENTITY"
    | "NONDETERMINISTIC_DUPLICATE"
    | "APPEND_ONLY_VIOLATION"
    | "IDENTITY_MUTATION"
    | "LINEAGE_INCOMPLETE"
    | "REPLAY_MISMATCH"
    | "HASH_MISMATCH"
    | "INVALID_NORMALIZATION"
    | "FAIL_OPEN";
}>;

export type OutcomeIdentityResolverResult = Readonly<{
  outcome_identity_resolver_version: "outcome-identity-resolver/v1";
  normalization_adapter: OutcomeNormalizationAdapterResult;
  api_surface: IdentityApiSurface;
  input_validation: IdentityInputValidation;
  outcome_identity: OutcomeIdentity;
  duplicate_resolution: DuplicateResolutionRecord;
  identity_registry: readonly IdentityRegistryRecord[];
  lineage_records: readonly IdentityLineageRecord[];
  replay_report: IdentityReplayReport;
  metrics: IdentityMetrics;
  audit_report: IdentityAuditReport;
  deterministic: true;
  replayable: true;
  identity_only: true;
  creates_new_meaning: false;
  modifies_outcome_data: false;
  uses_randomness: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeIdentityResolverFoundation = Readonly<{
  outcome_identity_resolver_version: "outcome-identity-resolver/v1";
  checks: readonly OutcomeIdentityCheck[];
  api_surface: IdentityApiSurface;
  result: OutcomeIdentityResolverResult;
}>;
