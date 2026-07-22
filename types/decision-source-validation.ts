import type { DecisionIntakeFailureReason } from "@/types/decision-intake-engine";

export type SourceValidationState =
  | "PENDING"
  | "IDENTITY_VERIFIED"
  | "REGISTERED"
  | "AUTHENTICATED"
  | "CERTIFIED"
  | "VERSION_VALIDATED"
  | "TENANT_VALIDATED"
  | "MISSION_VALIDATED"
  | "AUTHORITY_VALIDATED"
  | "REPLAY_VALIDATED"
  | "PASSED"
  | "FAILED_IDENTITY"
  | "FAILED_REGISTRATION"
  | "FAILED_SIGNATURE"
  | "FAILED_CERTIFICATION"
  | "FAILED_VERSION"
  | "FAILED_TENANT"
  | "FAILED_MISSION"
  | "FAILED_AUTHORITY"
  | "FAILED_REPLAY";

export type SourceValidationFailureReason =
  | "UNKNOWN_SUBSYSTEM"
  | "UNAUTHORIZED_SOURCE"
  | "INACTIVE_SUBSYSTEM"
  | "RETIRED_SUBSYSTEM"
  | "SUSPENDED_SUBSYSTEM"
  | "MISSING_REGISTRATION"
  | "MISSING_SIGNATURE"
  | "INVALID_SIGNATURE"
  | "CORRUPTED_SIGNATURE"
  | "EXPIRED_CERTIFICATE"
  | "ALTERED_PAYLOAD"
  | "UNCERTIFIED_SUBSYSTEM"
  | "REVOKED_CERTIFICATION"
  | "EXPIRED_CERTIFICATION"
  | "SUSPENDED_CERTIFICATION"
  | "UNSUPPORTED_VERSION"
  | "DEPRECATED_INTERFACE"
  | "INCOMPATIBLE_SCHEMA"
  | "UNKNOWN_PROTOCOL"
  | "CROSS_TENANT_SUBMISSION"
  | "TENANT_MISMATCH"
  | "UNAUTHORIZED_TENANT_ACCESS"
  | "FOREIGN_MISSION_REFERENCE"
  | "UNKNOWN_MISSION"
  | "UNAUTHORIZED_MISSION"
  | "INACTIVE_MISSION"
  | "OWNERSHIP_MISMATCH"
  | "AUTHORITY_ESCALATION"
  | "UNAUTHORIZED_RECOMMENDATION"
  | "INVALID_AUTHORITY_LEVEL"
  | "RESTRICTED_OPERATION"
  | "MISSING_REPLAY_REFERENCE"
  | "REPLAY_INCOMPATIBILITY"
  | "NONDETERMINISTIC_IDENTIFIER"
  | "LINEAGE_CORRUPTION";

export type SourceValidationRequest = Readonly<{
  validation_id: string;
  subsystem_id: string;
  subsystem_version: string;
  tenant_id: string;
  mission_id: string;
  authority_scope: string;
  signature: string;
  replay_reference: string;
  payload_hash: string;
  candidate_id: string;
  lineage_reference: string;
  protocol_version: "decision-source-validation/v1";
}>;

export type RegisteredSubsystemRecord = Readonly<{
  subsystem_id: string;
  subsystem_name: string;
  subsystem_type: "OPERATOR" | "GOVERNANCE" | "PREDICTION" | "MONITORING";
  certification_status: "CERTIFIED" | "UNCERTIFIED" | "REVOKED" | "SUSPENDED";
  supported_versions: readonly string[];
  authority_scope: readonly string[];
  tenant_scope: readonly string[];
  mission_scope: readonly string[];
  operational_status: "ACTIVE" | "INACTIVE" | "RETIRED" | "SUSPENDED";
  trusted_identity: string;
  signature_algorithm: "SHA-256";
  registration_reference: string;
  certification_reference: string;
}>;

export type SourceCertificationRecord = Readonly<{
  certification_id: string;
  subsystem_id: string;
  certification_level: "DECISION_INTAKE" | "GOVERNANCE_SOURCE" | "ADVISORY_SOURCE";
  effective_date: string;
  expiration_date: string;
  certification_status: "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";
  certification_scope: readonly string[];
  integrity_hash: string;
}>;

export type SourceValidationAuditRecord = Readonly<{
  audit_id: string;
  validation_id: string;
  validation_stage: SourceValidationState;
  validation_result: "PASS" | "FAIL";
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type SourceValidationResult = Readonly<{
  validation_id: string;
  subsystem_id: string;
  validation_status: "PASS" | "FAIL";
  validation_state: SourceValidationState;
  failure_reason?: SourceValidationFailureReason;
  failure_reasons: readonly SourceValidationFailureReason[];
  certification_reference?: string;
  authority_scope_verified: boolean;
  replay_compatible: boolean;
  downstream_allowed: boolean;
  audit_records: readonly SourceValidationAuditRecord[];
  integrity_hash: string;
  timestamp: string;
}>;

export type SourceValidationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  validation_id: string;
  reconstructed_state: SourceValidationState;
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly SourceValidationFailureReason[];
  integrity_hash: string;
}>;

export type SourceValidationObservability = Readonly<{
  validation_requests: number;
  successful_validations: number;
  failed_validations: number;
  unknown_subsystem_attempts: number;
  signature_failures: number;
  certification_failures: number;
  version_mismatches: number;
  tenant_violations: number;
  mission_ownership_failures: number;
  authority_violations: number;
  replay_compatibility_failures: number;
  validation_latency: number;
}>;

export type SourceValidationIntakeBridge = Readonly<{
  source_validation: SourceValidationResult;
  intake_failure_reasons: readonly DecisionIntakeFailureReason[];
  intake_allowed: boolean;
}>;
