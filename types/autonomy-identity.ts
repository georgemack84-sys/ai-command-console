import type { AutonomyAuthorityScope, AutonomyContract, AutonomyType } from "@/types/autonomy-contract";

export type AutonomyIdentityLifecycleState = "GENERATED" | "REGISTERED" | "VALIDATED" | "CERTIFIED" | "ACTIVE" | "RETIRED" | "ARCHIVED";
export type AutonomyIdentityCertificationState = "UNCERTIFIED" | "VALIDATED" | "CERTIFIED" | "REJECTED";
export type AutonomyIdentityValidationState = "PASS" | "FAIL";
export type AutonomyIdentityScenario =
  | "BASELINE"
  | "DUPLICATE_AUTONOMY_ID"
  | "DUPLICATE_INSTANCE_ID"
  | "REUSED_IDENTIFIER"
  | "MISSING_TENANT"
  | "INVALID_MISSION"
  | "UNSUPPORTED_VERSION"
  | "DEPRECATED_VERSION"
  | "BROKEN_LINEAGE"
  | "CIRCULAR_LINEAGE"
  | "CROSS_TENANT_IDENTITY"
  | "AUTHORITY_MISMATCH"
  | "HASH_MISMATCH"
  | "IMMUTABLE_MUTATION";

export type AutonomyIdentityFailureReason =
  | "IDENTITY_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_AUTONOMY_ID"
  | "DUPLICATE_INSTANCE_ID"
  | "IDENTIFIER_REUSE_DETECTED"
  | "TENANT_MISSING"
  | "TENANT_NOT_FOUND"
  | "TENANT_OWNERSHIP_INVALID"
  | "CROSS_TENANT_IDENTITY"
  | "MISSION_MISSING"
  | "MISSION_NOT_FOUND"
  | "MISSION_TENANT_MISMATCH"
  | "ROOT_IDENTITY_MISSING"
  | "PARENT_IDENTITY_MISSING"
  | "BROKEN_LINEAGE"
  | "CIRCULAR_ANCESTRY"
  | "GENERATION_INCONSISTENT"
  | "UNSUPPORTED_IDENTITY_VERSION"
  | "DEPRECATED_IDENTITY_VERSION"
  | "INCOMPATIBLE_SCHEMA_REVISION"
  | "AUTHORITY_OWNERSHIP_INVALID"
  | "REPLAY_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "IMMUTABLE_FIELD_MUTATION"
  | "INVALID_LIFECYCLE_STATE";

export type AutonomyPrimaryIdentity = Readonly<{
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  root_autonomy_id: string;
  parent_autonomy_id: string | null;
  instance_id: string;
  version: "autonomy-identity/v8A.2";
  created_timestamp: string;
  autonomy_type: AutonomyType;
  authority_scope: AutonomyAuthorityScope;
  contract_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  replay_reference: string;
  lineage_reference: string;
  generation: number;
  lifecycle_state: AutonomyIdentityLifecycleState;
  certification_state: AutonomyIdentityCertificationState;
  identity_hash: string;
  integrity_hash: string;
}>;

export type AutonomyRuntimeInstanceIdentity = Readonly<{
  runtime_identity_id: string;
  autonomy_id: string;
  instance_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  lifecycle_state: AutonomyIdentityLifecycleState;
  replay_reference: string;
  created_timestamp: string;
  runtime_hash: string;
}>;

export type AutonomyLineageIdentity = Readonly<{
  lineage_identity_id: string;
  autonomy_id: string;
  tenant_id: string;
  root_autonomy_id: string;
  parent_autonomy_id: string | null;
  child_autonomy_ids: readonly string[];
  generation: number;
  derivation_path: readonly string[];
  version_history: readonly string[];
  replay_references: readonly string[];
  lineage_hash: string;
}>;

export type AutonomyIdentityRecord = Readonly<{
  primary: AutonomyPrimaryIdentity;
  runtime: AutonomyRuntimeInstanceIdentity;
  lineage: AutonomyLineageIdentity;
  source_contract: AutonomyContract;
}>;

export type AutonomyIdentityValidationFailure = Readonly<{
  failure_id: string;
  reason: AutonomyIdentityFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
  audit_logged: true;
}>;

export type AutonomyIdentityValidationResult = Readonly<{
  validation_id: string;
  autonomy_id: string | null;
  validation_state: AutonomyIdentityValidationState;
  failures: readonly AutonomyIdentityValidationFailure[];
  globally_unique: boolean;
  instance_unique: boolean;
  immutable: boolean;
  tenant_isolated: boolean;
  mission_bound: boolean;
  lineage_complete: boolean;
  replay_correlated: boolean;
  authority_validated: boolean;
  certification_ready: boolean;
  integrity_hash: string | null;
}>;

export type AutonomyIdentityRegistryAuditEntry = Readonly<{
  audit_id: string;
  event_type: "GENERATED" | "REGISTERED" | "VALIDATED" | "CERTIFICATION_READY" | "VALIDATION_FAILED";
  autonomy_id: string;
  instance_id: string;
  timestamp: string;
  actor: string;
  audit_hash: string;
}>;

export type AutonomyIdentityRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  identities: readonly AutonomyIdentityRecord[];
  primary_index: Readonly<Record<string, string>>;
  instance_index: Readonly<Record<string, string>>;
  lineage_index: Readonly<Record<string, readonly string[]>>;
  replay_index: Readonly<Record<string, string>>;
  audit_log: readonly AutonomyIdentityRegistryAuditEntry[];
  registry_hash: string;
}>;

export type AutonomyLineageReconstructionResult = Readonly<{
  autonomy_id: string;
  tenant_id: string;
  root_autonomy_id: string;
  parent_chain: readonly string[];
  child_autonomy_ids: readonly string[];
  derivation_path: readonly string[];
  generation: number;
  lineage_complete: boolean;
  cross_tenant_violations: readonly string[];
  lineage_breaks: readonly AutonomyIdentityFailureReason[];
  lineage_hash: string;
  replay_references: readonly string[];
}>;

export type AutonomyIdentityVersionPolicy = Readonly<{
  current_identity_version: "autonomy-identity/v8A.2";
  supported_identity_versions: readonly string[];
  deprecated_identity_versions: readonly string[];
  compatible_contract_versions: readonly string[];
  deterministic_generation_algorithm: "canonical-sha256-v8A.2";
  new_identity_required_for_structural_change: true;
}>;

export type AutonomyIdentityObservabilitySurface = Readonly<{
  autonomy_id: string;
  instance_id: string;
  tenant_id: string;
  mission_id: string;
  root_autonomy_id: string;
  parent_autonomy_id: string | null;
  generation: number;
  lifecycle_state: AutonomyIdentityLifecycleState;
  certification_state: AutonomyIdentityCertificationState;
  validation_state: AutonomyIdentityValidationState;
  failure_reasons: readonly AutonomyIdentityFailureReason[];
  replay_reference: string;
  identity_hash: string;
  integrity_hash: string;
}>;
