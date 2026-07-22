import type { AdaptiveBoundaryOperation, AdaptiveBoundaryResult } from "@/types/adaptive-domain-boundary-model";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type LearningPermissionLifecycleState = "CREATED" | "SUBMITTED" | "GOVERNANCE_REVIEW" | "CERTIFICATION_REVIEW" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "ARCHIVED";
export type LearningPermissionValidationResult = "ALLOW" | "REJECT";
export type LearningPermissionValidationState = "PASS" | "FAIL";
export type LearningPermissionScope = "GLOBAL" | "TENANT" | "ORGANIZATION" | "MISSION" | "WORKFLOW" | "DECISION_PACKAGE" | "ADAPTIVE_MODULE";
export type LearningPermissionExpirationPolicy = "PERMANENT" | "SCHEDULED_EXPIRATION" | "MISSION_COMPLETION" | "CERTIFICATION_EXPIRATION" | "GOVERNANCE_REVOCATION" | "OPERATOR_REVOCATION";

export type AdaptiveCapability =
  | "RECOMMENDATION_QUALITY_ANALYSIS"
  | "CONFIDENCE_CALIBRATION"
  | "RISK_ADAPTATION"
  | "PRIORITIZATION_ANALYSIS"
  | "STRATEGY_EVALUATION"
  | "PATTERN_INTELLIGENCE"
  | "EVIDENCE_WEIGHTING"
  | "FORECAST_ACCURACY"
  | "SIMULATION_ASSUMPTION_ANALYSIS"
  | "OUTCOME_INTELLIGENCE"
  | "OPERATOR_FEEDBACK_ANALYSIS";

export type LearningPermissionCheck =
  | "BOUNDARY_MODEL"
  | "PERMISSION_LOOKUP"
  | "IDENTITY"
  | "VERSION"
  | "SCOPE"
  | "CAPABILITY"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "REPLAY"
  | "LIFECYCLE"
  | "EXPIRATION"
  | "REVOCATION"
  | "ROLLBACK"
  | "INTEGRITY"
  | "DEFAULT_DENY";

export type LearningPermissionFailure =
  | "BOUNDARY_MODEL_INVALID"
  | "PERMISSION_DOES_NOT_EXIST"
  | "PERMISSION_INACTIVE"
  | "PERMISSION_EXPIRED"
  | "PERMISSION_REVOKED"
  | "CAPABILITY_MISMATCH"
  | "TENANT_MISMATCH"
  | "MISSION_SCOPE_MISMATCH"
  | "AUTHORIZED_SCOPE_MISMATCH"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CERTIFICATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "ROLLBACK_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_CAPABILITY_CREATION"
  | "HIDDEN_PERMISSION"
  | "IMPLICIT_PERMISSION"
  | "PERMISSION_FORGERY"
  | "GOVERNANCE_BYPASS"
  | "REPLAY_BYPASS"
  | "TENANT_CROSSOVER"
  | "AUTHORITY_ESCALATION"
  | "FAIL_OPEN_PERMISSION_BEHAVIOR"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type LearningPermission = Readonly<{
  permission_id: string;
  permission_name: string;
  permission_version: string;
  adaptive_capability: AdaptiveCapability;
  tenant_id: string;
  mission_scope: readonly string[];
  authorized_scope: LearningPermissionScope;
  authorized_operations: readonly AdaptiveBoundaryOperation[];
  authorized_domain: string;
  requesting_component: string;
  owning_component: string;
  governance_approval_status: "APPROVED" | "MISSING" | "REVOKED";
  governance_reference: string;
  replay_required: true;
  replay_reference: string;
  certification_status: "CERTIFIED" | "MISSING" | "FAILED";
  certification_reference: string;
  operator_approval_required: boolean;
  operator_refs: readonly string[];
  expiration_policy: LearningPermissionExpirationPolicy;
  expiration_timestamp: string;
  rollback_available: boolean;
  rollback_reference: string;
  lifecycle_state: LearningPermissionLifecycleState;
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type LearningPermissionRegistryRecord = Readonly<{
  registry_id: string;
  tenant_id: string;
  boundary_model_ref: string;
  permissions: readonly LearningPermission[];
  active_permission_ids: readonly string[];
  suspended_permission_ids: readonly string[];
  revoked_permission_ids: readonly string[];
  expired_permission_ids: readonly string[];
  append_only: true;
  default_decision: "REJECT";
  integrity_hash: string;
}>;

export type LearningPermissionRequest = Readonly<{
  request_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  permission_id: string;
  requested_capability: AdaptiveCapability;
  requested_domain: string;
  requested_operation: AdaptiveBoundaryOperation;
  requesting_component: string;
  validation_timestamp: string;
}>;

export type LearningPermissionValidationDecision = Readonly<{
  decision_id: string;
  permission_id: string;
  tenant_id: string;
  requested_capability: AdaptiveCapability;
  requested_operation: AdaptiveBoundaryOperation;
  lifecycle_state: LearningPermissionLifecycleState | "UNKNOWN";
  validation_result: LearningPermissionValidationResult;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  operator_refs: readonly string[];
  rollback_refs: readonly string[];
  reason: string;
  integrity_hash: string;
}>;

export type LearningPermissionReplayModel = Readonly<{
  replay_model_id: string;
  permission_id: string;
  requesting_component: string;
  requested_capability: AdaptiveCapability;
  validation_result: LearningPermissionValidationResult;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lifecycle_state: LearningPermissionLifecycleState | "UNKNOWN";
  integrity_reproducible: boolean;
  deterministic_reconstruction: boolean;
  integrity_hash: string;
}>;

export type LearningPermissionCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly LearningPermissionCheck[];
  registry_complete: boolean;
  permission_lookup_valid: boolean;
  scope_valid: boolean;
  governance_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  lifecycle_valid: boolean;
  expiration_valid: boolean;
  revocation_valid: boolean;
  rollback_valid: boolean;
  integrity_verified: boolean;
  failure_analysis: readonly LearningPermissionFailure[];
  certification_decision: LearningPermissionValidationState;
  integrity_hash: string;
}>;

export type LearningPermissionLedgerEntry = Readonly<{
  record_id: string;
  permission_id: string;
  tenant_id: string;
  mission_scope: readonly string[];
  adaptive_capability: AdaptiveCapability;
  lifecycle_event: LearningPermissionLifecycleState | "VALIDATED" | "REJECTED";
  validation_result: LearningPermissionValidationResult;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  operator_refs: readonly string[];
  rollback_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type LearningPermissionValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  boundary_model_valid: boolean;
  permission_exists: boolean;
  permission_active: boolean;
  permission_not_expired: boolean;
  permission_not_revoked: boolean;
  capability_matches: boolean;
  tenant_matches: boolean;
  mission_scope_matches: boolean;
  authorized_scope_matches: boolean;
  governance_approved: boolean;
  certification_current: boolean;
  replay_registered: boolean;
  rollback_available: boolean;
  integrity_verified: boolean;
  default_deny_enforced: boolean;
  authorization_valid: boolean;
  execution_authority_absent: boolean;
  failures: readonly LearningPermissionFailure[];
  integrity_hash: string;
}>;

export type LearningPermissionRegistryInput = Readonly<{
  boundary_model?: AdaptiveBoundaryResult;
  role?: VisibilityRole;
  permission_id?: string;
  capability?: AdaptiveCapability;
  operation?: AdaptiveBoundaryOperation;
  domain_id?: string;
  scenario?:
    | "BASELINE"
    | "BOUNDARY_INVALID"
    | "MISSING_PERMISSION"
    | "INACTIVE_PERMISSION"
    | "EXPIRED_PERMISSION"
    | "REVOKED_PERMISSION"
    | "CAPABILITY_MISMATCH"
    | "TENANT_MISMATCH"
    | "MISSION_SCOPE_MISMATCH"
    | "SCOPE_MISMATCH"
    | "MISSING_GOVERNANCE"
    | "MISSING_CERTIFICATION"
    | "MISSING_REPLAY"
    | "MISSING_ROLLBACK"
    | "HASH_MISMATCH"
    | "UNAUTHORIZED_CAPABILITY"
    | "HIDDEN_PERMISSION"
    | "IMPLICIT_PERMISSION"
    | "PERMISSION_FORGERY"
    | "GOVERNANCE_BYPASS"
    | "REPLAY_BYPASS"
    | "TENANT_CROSSOVER"
    | "AUTHORITY_ESCALATION"
    | "FAIL_OPEN"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type LearningPermissionRegistryResult = Readonly<{
  registry_version: "learning-permission-registry/v1";
  boundary_model: AdaptiveBoundaryResult;
  registry: LearningPermissionRegistryRecord;
  request: LearningPermissionRequest;
  decision: LearningPermissionValidationDecision;
  replay_model: LearningPermissionReplayModel;
  certification_report: LearningPermissionCertificationReport;
  permission_ledger: readonly LearningPermissionLedgerEntry[];
  validation: LearningPermissionValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  permits_learning: boolean;
  permits_execution: false;
  mutates_permission_registry: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type LearningPermissionRegistryFoundation = Readonly<{
  registry_version: "learning-permission-registry/v1";
  checks: readonly LearningPermissionCheck[];
  result: LearningPermissionRegistryResult;
}>;
