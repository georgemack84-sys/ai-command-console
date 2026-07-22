export type IdentityFullDecision = "IDENTITY_INFRASTRUCTURE_READY" | "READY_WITH_OBSERVATIONS" | "CONDITIONALLY_READY" | "NOT_READY" | "FAIL_CLOSED";
export type IdentityFullFailure =
  | "W1_1A_IDENTITY_CORE_INVALID"
  | "STORAGE_FULL_MISSING"
  | "SECURITY_FULL_MISSING"
  | "MESSAGING_CORE_MISSING"
  | "REGISTRY_CORE_MISSING"
  | "OBSERVABILITY_PLATFORM_MISSING"
  | "SESSION_MANAGEMENT_MISSING"
  | "SESSION_EXPIRATION_INVALID"
  | "SESSION_RENEWAL_FAILED"
  | "SESSION_REVOCATION_FAILED"
  | "MULTI_DEVICE_SESSIONS_INVALID"
  | "SESSION_TENANT_ISOLATION_VIOLATED"
  | "CREDENTIAL_LIFECYCLE_MISSING"
  | "CREDENTIAL_ROTATION_FAILED"
  | "CREDENTIAL_REVOCATION_FAILED"
  | "KEY_ROLLOVER_FAILED"
  | "PASSWORD_POLICY_MISSING"
  | "MFA_ENROLLMENT_FAILED"
  | "IDENTITY_RECOVERY_MISSING"
  | "RECOVERY_AUTHORIZATION_FAILED"
  | "RECOVERY_GOVERNANCE_APPROVAL_MISSING"
  | "RECOVERY_CRYPTOGRAPHIC_VERIFICATION_FAILED"
  | "IDENTITY_SUSPENSION_MISSING"
  | "SUSPENSION_AUDIT_INCOMPLETE"
  | "RESTORATION_FLOW_INVALID"
  | "DELEGATED_AUTHORIZATION_MISSING"
  | "DELEGATION_SCOPE_VIOLATED"
  | "DELEGATION_EXPIRATION_INVALID"
  | "DELEGATION_REVOCATION_FAILED"
  | "DELEGATION_CHAIN_INVALID"
  | "FEDERATION_INTERFACES_MISSING"
  | "FEDERATION_TRUST_RELATIONSHIP_INVALID"
  | "EXTERNAL_IDENTITY_MAPPING_FAILED"
  | "FEDERATION_POLICY_ENFORCEMENT_FAILED"
  | "IDENTITY_EVIDENCE_INCOMPLETE"
  | "IDENTITY_EVIDENCE_NOT_IMMUTABLE"
  | "IDENTITY_EVIDENCE_NOT_SIGNED"
  | "IDENTITY_EVIDENCE_NOT_REPLAYABLE"
  | "IDENTITY_EVIDENCE_NOT_SEARCHABLE"
  | "FUNCTIONAL_QUALIFICATION_FAILED"
  | "SECURITY_QUALIFICATION_FAILED"
  | "OPERATIONAL_QUALIFICATION_FAILED"
  | "GOVERNANCE_QUALIFICATION_FAILED"
  | "IDENTITY_INFRASTRUCTURE_GATE_FAILED";
export type IdentityFullScenario = "BASELINE" | "READY_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | IdentityFullFailure;
export type IdentityFullInput = Readonly<{ scenario?: IdentityFullScenario; seed?: string }>;
export type SessionManagement = Readonly<{ service_id: string; session_registry: readonly string[]; session_tokens: boolean; deterministic_expiration: boolean; renewal: boolean; revocation: boolean; multi_device_sessions: boolean; tenant_isolation: boolean; audit_recorded: boolean; integrity_hash: string }>;
export type CredentialLifecycle = Readonly<{ registry_id: string; issuance: boolean; rotation: boolean; renewal: boolean; expiration: boolean; revocation: boolean; key_rollovers: boolean; password_policies: boolean; mfa_enrollment: boolean; credential_types: readonly string[]; integrity_hash: string }>;
export type IdentityRecovery = Readonly<{ ledger_id: string; recovery_requests: boolean; recovery_validation: boolean; recovery_authorization: boolean; multi_step_recovery: boolean; emergency_recovery: boolean; operator_approval: boolean; governance_approval: boolean; cryptographic_verification: boolean; evidence_recorded: boolean; integrity_hash: string }>;
export type IdentitySuspension = Readonly<{ ledger_id: string; user_suspension: boolean; service_suspension: boolean; tenant_suspension: boolean; namespace_suspension: boolean; temporary_lock: boolean; permanent_disable: boolean; restoration: boolean; suspension_history: boolean; integrity_hash: string }>;
export type DelegatedAuthorization = Readonly<{ registry_id: string; delegation_policies: boolean; delegation_tokens: boolean; scope_restrictions: boolean; time_limits: boolean; delegation_chains: boolean; revocation: boolean; evidence_recorded: boolean; integrity_hash: string }>;
export type FederationInterfaces = Readonly<{ registry_id: string; federation_gateway: boolean; trust_relationships: boolean; external_identity_mapping: boolean; identity_translation: boolean; federation_policies: boolean; federation_audit: boolean; protocols: readonly string[]; integrity_hash: string }>;
export type IdentityEvidenceLedger = Readonly<{ ledger_id: string; records: readonly string[]; authentication: boolean; authorization: boolean; recovery: boolean; suspension: boolean; delegation: boolean; federation: boolean; credential_events: boolean; session_events: boolean; immutable: boolean; signed: boolean; timestamped: boolean; replayable: boolean; searchable: boolean; integrity_hash: string }>;
export type IdentityQualification = Readonly<{ report_id: string; functional: boolean; security: boolean; operational: boolean; governance: boolean; certification_package: string; readiness_assessment: string; qualification_evidence: readonly string[]; infrastructure_gate_passed: boolean; integrity_hash: string }>;
export type IdentityFullReadiness = Readonly<{ readiness_id: string; decision: IdentityFullDecision; phase_ready: boolean; entry_criteria_ready: boolean; sessions_ready: boolean; credentials_ready: boolean; recovery_ready: boolean; suspension_ready: boolean; delegation_ready: boolean; federation_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly IdentityFullFailure[]; integrity_hash: string }>;
export type IdentityFullResult = Readonly<{ phase_version: "identity-full/w1.1b"; phase_identifier: "IdentityFull"; identity_core_ref: "identity-core/w1.1a"; sessions: SessionManagement; credentials: CredentialLifecycle; recovery: IdentityRecovery; suspension: IdentitySuspension; delegation: DelegatedAuthorization; federation: FederationInterfaces; evidence: IdentityEvidenceLedger; qualification: IdentityQualification; readiness: IdentityFullReadiness; replay_hash: string; integrity_hash: string }>;
export type IdentityFullValidation = Readonly<{ valid: boolean; decision: IdentityFullDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; sessions_valid: boolean; credentials_valid: boolean; recovery_valid: boolean; suspension_valid: boolean; delegation_valid: boolean; federation_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly IdentityFullFailure[]; integrity_hash: string }>;
export type IdentityFullBundle = Readonly<{ doctrine: Readonly<{ version: "identity-full/w1.1b"; owns_session_management: true; owns_credential_lifecycle: true; owns_identity_recovery: true; owns_identity_suspension: true; owns_delegated_authorization: true; owns_federation_interfaces: true; owns_identity_evidence: true; owns_identity_qualification: true }>; result: IdentityFullResult; validation: IdentityFullValidation }>;
