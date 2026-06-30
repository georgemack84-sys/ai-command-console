export type AutonomyType = "PLANNER" | "ORCHESTRATOR" | "SUPERVISOR" | "RECOVERY" | "AUTONOMOUS_SERVICE";
export type AutonomyGovernanceMode = "ADVISORY" | "CONTROLLED" | "RESTRICTED";
export type AutonomyAuthorityScope = "OBSERVE" | "RECOMMEND" | "PLAN" | "ORCHESTRATE" | "RECOVER";
export type AutonomyLifecycleState = "DRAFT" | "VALIDATED" | "REGISTERED" | "CERTIFIED" | "ACTIVE" | "RETIRED" | "ARCHIVED";
export type AutonomyCertificationState = "UNCERTIFIED" | "VALIDATED" | "CERTIFIED" | "REJECTED";
export type AutonomyValidationState = "PASS" | "FAIL";
export type AutonomyContractScenario =
  | "BASELINE"
  | "DUPLICATE_ID"
  | "MISSING_MISSION"
  | "UNSUPPORTED_TYPE"
  | "INVALID_VERSION"
  | "GOVERNANCE_CONFLICT"
  | "AUTHORITY_ESCALATION"
  | "INVALID_LIFECYCLE"
  | "DUPLICATE_REPLAY_REFERENCE"
  | "BROKEN_LINEAGE"
  | "CIRCULAR_LINEAGE"
  | "CROSS_TENANT_LINEAGE"
  | "HASH_MISMATCH"
  | "IMMUTABLE_MUTATION";

export type AutonomyValidationFailureReason =
  | "CONTRACT_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "DUPLICATE_AUTONOMY_ID"
  | "MISSION_NOT_FOUND"
  | "TENANT_NOT_FOUND"
  | "MISSION_TENANT_MISMATCH"
  | "UNSUPPORTED_AUTONOMY_TYPE"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "GOVERNANCE_PROFILE_MISSING"
  | "POLICY_SET_UNKNOWN"
  | "UNSUPPORTED_GOVERNANCE_VERSION"
  | "INVALID_GOVERNANCE_MODE"
  | "CONSTITUTIONAL_PROFILE_MISSING"
  | "UNSUPPORTED_CONSTITUTION_VERSION"
  | "CONSTITUTIONAL_REVISION_UNKNOWN"
  | "AUTHORITY_SCOPE_UNKNOWN"
  | "AUTHORITY_PROFILE_INVALID"
  | "UNAUTHORIZED_PERMISSION"
  | "AUTHORITY_ESCALATION"
  | "GOVERNANCE_CONFLICT"
  | "OPERATOR_REQUIREMENT_UNDEFINED"
  | "INVALID_LIFECYCLE_STATE"
  | "UNSUPPORTED_LIFECYCLE_VERSION"
  | "MISSING_REPLAY_REFERENCE"
  | "DUPLICATE_REPLAY_REFERENCE"
  | "UNSUPPORTED_REPLAY_VERSION"
  | "NON_DETERMINISTIC_REPLAY_SEED"
  | "MISSING_LINEAGE_REFERENCE"
  | "BROKEN_LINEAGE"
  | "CIRCULAR_LINEAGE"
  | "GENERATION_INCONSISTENT"
  | "CROSS_TENANT_LINEAGE"
  | "INTEGRITY_HASH_MISMATCH"
  | "IMMUTABLE_FIELD_MUTATION";

export type AutonomyIdentity = Readonly<{
  autonomy_id: string;
  autonomy_type: AutonomyType;
  mission_id: string;
  tenant_id: string;
  version: "autonomy-contract/v8A.1";
}>;

export type AutonomyGovernanceContext = Readonly<{
  governance_profile: string;
  governance_version: "governance/v7";
  policy_set: readonly string[];
  governance_mode: AutonomyGovernanceMode;
}>;

export type AutonomyConstitutionalContext = Readonly<{
  constitutional_profile: string;
  constitution_version: "constitution/v8";
  constitutional_revision: string;
}>;

export type AutonomyAuthority = Readonly<{
  authority_scope: AutonomyAuthorityScope;
  authority_profile: readonly string[];
  operator_required: boolean;
  execution_permissions: readonly string[];
}>;

export type AutonomyLifecycle = Readonly<{
  lifecycle_state: AutonomyLifecycleState;
  lifecycle_version: "autonomy-lifecycle/v8A";
  activation_timestamp: string | null;
  retirement_timestamp: string | null;
}>;

export type AutonomyReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "autonomy-replay/v8A";
  replay_seed: string;
}>;

export type AutonomyLineage = Readonly<{
  lineage_reference: string;
  parent_autonomy: string | null;
  root_autonomy: string;
  generation: number;
}>;

export type AutonomyCertificationMetadata = Readonly<{
  certification_state: AutonomyCertificationState;
  certification_version: "autonomy-certification/v8A";
  integrity_hash: string;
  created_by: string;
  created_timestamp: string;
}>;

export type AutonomyContract = Readonly<{
  identity: AutonomyIdentity;
  governance: AutonomyGovernanceContext;
  constitution: AutonomyConstitutionalContext;
  authority: AutonomyAuthority;
  lifecycle: AutonomyLifecycle;
  replay: AutonomyReplayMetadata;
  lineage: AutonomyLineage;
  certification: AutonomyCertificationMetadata;
}>;

export type AutonomyValidationFailure = Readonly<{
  failure_id: string;
  reason: AutonomyValidationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type AutonomyValidationResult = Readonly<{
  validation_id: string;
  autonomy_id: string | null;
  validation_state: AutonomyValidationState;
  failures: readonly AutonomyValidationFailure[];
  immutable: boolean;
  tenant_isolated: boolean;
  governance_bound: boolean;
  constitution_bound: boolean;
  authority_bounded: boolean;
  replay_ready: boolean;
  lineage_reconstructable: boolean;
  certification_ready: boolean;
  integrity_hash: string | null;
}>;

export type AutonomyRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  contracts: readonly AutonomyContract[];
  active_versions: Readonly<Record<string, string>>;
  historical_versions: Readonly<Record<string, readonly string[]>>;
  audit_trail: readonly AutonomyRegistryAuditEntry[];
  registry_hash: string;
}>;

export type AutonomyRegistryAuditEntry = Readonly<{
  audit_id: string;
  event_type: "REGISTERED" | "VALIDATION_FAILED" | "VERSION_RETIRED";
  autonomy_id: string;
  timestamp: string;
  actor: string;
  audit_hash: string;
}>;

export type AutonomyVersionPolicy = Readonly<{
  current_schema_version: "autonomy-contract/v8A.1";
  supported_schema_versions: readonly string[];
  deprecated_schema_versions: readonly string[];
  semantic_version: "8.1.0";
  backward_compatible_with: readonly string[];
  migration_guidance: readonly string[];
  deterministic_compatibility_required: true;
}>;

export type AutonomyObservabilitySurface = Readonly<{
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  lifecycle_state: AutonomyLifecycleState;
  certification_state: AutonomyCertificationState;
  governance_mode: AutonomyGovernanceMode;
  authority_scope: AutonomyAuthorityScope;
  validation_state: AutonomyValidationState;
  failure_reasons: readonly AutonomyValidationFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;
