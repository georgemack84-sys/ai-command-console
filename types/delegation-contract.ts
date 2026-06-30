export type DelegationDelegateType = "OPERATOR" | "INTERNAL_AGENT" | "AUTONOMY_ENGINE" | "EXTERNAL_SYSTEM" | "DEFERRED" | "BLOCKED";

export type DelegationAuthorityLevel = "OBSERVE" | "RECOMMEND" | "PLAN" | "ORCHESTRATE" | "RECOVER";

export type DelegationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DelegationLifecycleState =
  | "CREATED"
  | "VALIDATED"
  | "AUTHORIZED"
  | "READY"
  | "DELEGATED"
  | "EXECUTING"
  | "COMPLETED"
  | "BLOCKED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED"
  | "SUPERSEDED"
  | "ARCHIVED";

export type DelegationValidationState = "PASS" | "FAIL";

export type DelegationFailureReason =
  | "DUPLICATE_DELEGATION_ID"
  | "MISSING_TASK_ID"
  | "INVALID_EXECUTION_PLAN_REFERENCE"
  | "ORPHAN_DELEGATION"
  | "UNSUPPORTED_DELEGATE_TYPE"
  | "UNKNOWN_DELEGATE"
  | "SUSPENDED_DELEGATE"
  | "UNCERTIFIED_DELEGATE"
  | "MISSING_AUTHORITY"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "PRIVILEGE_ESCALATION"
  | "POLICY_VIOLATION"
  | "TENANT_MISMATCH"
  | "REPLAY_REFERENCE_CORRUPTION"
  | "LINEAGE_CORRUPTION"
  | "INVALID_CONFIDENCE"
  | "INVALID_GOVERNANCE_SCORE"
  | "INVALID_PRIORITY"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "INCOMPLETE_METADATA"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "IMMUTABLE_FIELD_MUTATION"
  | "INTEGRITY_HASH_MISMATCH";

export type DelegationContractScenario =
  | "BASELINE"
  | "DUPLICATE_ID"
  | "MISSING_TASK"
  | "INVALID_PLAN"
  | "UNSUPPORTED_TARGET"
  | "UNKNOWN_DELEGATE"
  | "SUSPENDED_DELEGATE"
  | "UNCERTIFIED_DELEGATE"
  | "MISSING_AUTHORITY"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "MISSING_OPERATOR_APPROVAL"
  | "PRIVILEGE_ESCALATION"
  | "POLICY_VIOLATION"
  | "TENANT_MISMATCH"
  | "REPLAY_CORRUPTION"
  | "LINEAGE_CORRUPTION"
  | "INVALID_CONFIDENCE"
  | "INVALID_GOVERNANCE_SCORE"
  | "INVALID_PRIORITY"
  | "INVALID_TRANSITION"
  | "INCOMPLETE_METADATA"
  | "UNSUPPORTED_VERSION"
  | "IMMUTABLE_MUTATION"
  | "HASH_MISMATCH";

export type DelegationIdentity = Readonly<{
  delegation_id: string;
  task_id: string;
  execution_plan_id: string;
  tenant_id: string;
  mission_id: string;
}>;

export type DelegationTarget = Readonly<{
  delegate_type: DelegationDelegateType;
  delegate_id: string;
  delegate_role: string;
  registered: boolean;
  certified: boolean;
  authorized: boolean;
  suspended: boolean;
  routing_eligible: boolean;
}>;

export type DelegationAuthorityModel = Readonly<{
  authority_level: DelegationAuthorityLevel;
  governing_policy: string;
  constitutional_reference: string;
  approval_required: boolean;
  approval_reference: string | null;
  operator_override_allowed: boolean;
  operator_reference: string;
  governance_approved: boolean;
  policy_approved: boolean;
  constitutional_approved: boolean;
}>;

export type DelegationMetadata = Readonly<{
  confidence: number;
  governance_score: number;
  priority: DelegationPriority;
  deadline: string;
  replay_reference: string;
  lineage_reference: string;
  explanation: string;
}>;

export type DelegationLifecycleTransition = Readonly<{
  transition_id: string;
  from_state: DelegationLifecycleState;
  to_state: DelegationLifecycleState;
  timestamp: string;
  authority_reference: string;
  evidence_reference: string;
  replay_reference: string;
  transition_hash: string;
}>;

export type DelegationVersioning = Readonly<{
  contract_version: "delegation-contract/v8D.1";
  schema_version: "delegation-schema/v8D.1";
  compatibility_version: "8D.x";
  migration_version: "migration-none";
}>;

export type DelegationContract = Readonly<{
  identity: DelegationIdentity;
  target: DelegationTarget;
  authority: DelegationAuthorityModel;
  metadata: DelegationMetadata;
  lifecycle: Readonly<{
    current_state: DelegationLifecycleState;
    transition_history: readonly DelegationLifecycleTransition[];
    terminal: boolean;
  }>;
  versioning: DelegationVersioning;
  governance: Readonly<{
    governance_reference: string;
    truth_ledger_reference: string;
    certification_reference: string;
    tenant_isolation_reference: string;
  }>;
  integrity_hash: string;
}>;

export type DelegationValidationFailure = Readonly<{
  failure_id: string;
  reason: DelegationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type DelegationValidationResult = Readonly<{
  validation_id: string;
  delegation_id: string | null;
  validation_state: DelegationValidationState;
  failures: readonly DelegationValidationFailure[];
  identity_valid: boolean;
  target_valid: boolean;
  authority_valid: boolean;
  metadata_valid: boolean;
  lifecycle_valid: boolean;
  tenant_isolated: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  ready_for_task_classification: boolean;
  validation_hash: string;
}>;

export type DelegationReplayResult = Readonly<{
  replay_id: string;
  delegation_id: string;
  reconstructed_identity: DelegationIdentity;
  reconstructed_target: DelegationTarget;
  reconstructed_state_order: readonly DelegationLifecycleState[];
  replay_reference: string;
  validation_state: DelegationValidationState;
  failure_reason: DelegationFailureReason | null;
  replay_hash: string;
}>;

export type DelegationRegistryAuditEntry = Readonly<{
  audit_id: string;
  event_type: "REGISTERED" | "VALIDATION_FAILED" | "SUPERSEDED" | "ARCHIVED";
  delegation_id: string;
  timestamp: string;
  actor: string;
  audit_hash: string;
}>;

export type DelegationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  delegations: readonly DelegationContract[];
  active_delegations: readonly string[];
  terminal_delegations: readonly string[];
  audit_trail: readonly DelegationRegistryAuditEntry[];
  registry_hash: string;
}>;

export type DelegationVersionPolicy = Readonly<{
  current_contract_version: "delegation-contract/v8D.1";
  current_schema_version: "delegation-schema/v8D.1";
  supported_schema_versions: readonly string[];
  deprecated_schema_versions: readonly string[];
  semantic_version: "8.1.0";
  backward_compatible_with: readonly string[];
  deterministic_compatibility_required: true;
  migration_guidance: readonly string[];
}>;

export type DelegationObservabilitySurface = Readonly<{
  delegation_id: string;
  task_id: string;
  delegate_type: DelegationDelegateType;
  delegate_id: string;
  lifecycle_state: DelegationLifecycleState;
  validation_state: DelegationValidationState;
  failure_reasons: readonly DelegationFailureReason[];
  authority_level: DelegationAuthorityLevel;
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type DelegationContractFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    contract_version: "delegation-contract/v8D.1";
    lifecycle_states: readonly DelegationLifecycleState[];
    delegate_types: readonly DelegationDelegateType[];
    terminal_states: readonly DelegationLifecycleState[];
  }>;
  contract: DelegationContract;
  validation: DelegationValidationResult;
  replay: DelegationReplayResult;
  registry: DelegationRegistry;
  version_policy: DelegationVersionPolicy;
  observability: DelegationObservabilitySurface;
}>;
