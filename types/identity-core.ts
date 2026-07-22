export type IdentityCoreDecision = "CORE_ACTIVATED" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONALLY_ACTIVE" | "NOT_ACTIVE" | "FAIL_CLOSED";
export type IdentityLifecycleState = "CREATED" | "REGISTERED" | "VERIFIED" | "ACTIVE" | "SUSPENDED" | "RESTORED" | "RETIRED";
export type IdentityCoreFailure =
  | "W1_0_BOOTSTRAP_INVALID"
  | "STORAGE_CORE_MISSING"
  | "SECURITY_CORE_MISSING"
  | "PRODUCTION_IDENTITY_FOUNDATION_MISSING"
  | "PLATFORM_IDENTITY_AUTHORITY_MISSING"
  | "IDENTITY_REGISTRY_MISSING"
  | "SYSTEM_IDENTITIES_MISSING"
  | "INFRASTRUCTURE_IDENTITIES_MISSING"
  | "PRODUCTION_OWNERSHIP_INVALID"
  | "AUTHORITY_TRANSFER_FAILED"
  | "BOOTSTRAP_AUTHORITY_NOT_VALIDATED"
  | "PRODUCTION_TRUST_CHAIN_MISSING"
  | "SIGNING_AUTHORITY_TRANSFER_FAILED"
  | "IDENTITY_OWNERSHIP_TRANSFER_FAILED"
  | "AUTHORITY_TRANSFER_EVIDENCE_MISSING"
  | "PLATFORM_IDENTITY_MISSING"
  | "PLATFORM_CREDENTIALS_MISSING"
  | "TENANT_IDENTITY_MODEL_MISSING"
  | "TENANT_IDENTITIES_NOT_UNIQUE"
  | "TENANT_REGISTRY_MISSING"
  | "NAMESPACE_IDENTITIES_MISSING"
  | "NAMESPACE_TENANT_BINDING_INVALID"
  | "NAMESPACE_IDENTITIES_NOT_UNIQUE"
  | "NAMESPACE_REGISTRY_MISSING"
  | "AUTHENTICATION_SERVICE_MISSING"
  | "CREDENTIAL_VALIDATION_FAILED"
  | "CERTIFICATE_AUTHENTICATION_FAILED"
  | "TOKEN_AUTHENTICATION_FAILED"
  | "INVALID_CREDENTIALS_ACCEPTED"
  | "AUTHORIZATION_SERVICE_MISSING"
  | "AUTHORIZATION_POLICY_MISSING"
  | "PERMISSION_BINDINGS_INVALID"
  | "AUTHORIZATION_DECISION_INVALID"
  | "UNAUTHORIZED_REQUEST_ALLOWED"
  | "IDENTITY_TOKEN_SERVICE_MISSING"
  | "TOKEN_SIGNING_FAILED"
  | "TOKEN_VALIDATION_FAILED"
  | "TOKEN_EXPIRATION_INVALID"
  | "TOKEN_SIGNATURE_NON_DETERMINISTIC"
  | "IDENTITY_LIFECYCLE_MISSING"
  | "LIFECYCLE_TRANSITIONS_INVALID"
  | "IDENTITY_AUDIT_LEDGER_MISSING"
  | "IDENTITY_AUDIT_RECORDS_INCOMPLETE"
  | "IDENTITY_EVIDENCE_NOT_IMMUTABLE"
  | "IDENTITY_REPLAY_FAILED";
export type IdentityCoreScenario = "BASELINE" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | IdentityCoreFailure;
export type IdentityCoreInput = Readonly<{ scenario?: IdentityCoreScenario; seed?: string }>;
export type ProductionIdentityFoundation = Readonly<{ foundation_id: string; platform_identity_authority: string; identity_registry_initialized: boolean; system_identities_registered: boolean; infrastructure_identities_registered: boolean; production_ownership_validated: boolean; integrity_hash: string }>;
export type IdentityAuthorityTransfer = Readonly<{ transfer_id: string; bootstrap_authority_validated: boolean; production_trust_chain_established: boolean; signing_authority_transferred: boolean; identity_ownership_transferred: boolean; transfer_evidence_recorded: boolean; integrity_hash: string }>;
export type PlatformIdentity = Readonly<{ platform_principal_id: string; production_credentials: readonly string[]; registered: boolean; metadata_published: boolean; integrity_hash: string }>;
export type TenantIdentityRegistry = Readonly<{ registry_id: string; tenant_identities: readonly string[]; tenant_model_defined: boolean; identifiers_unique: boolean; registry_published: boolean; integrity_hash: string }>;
export type NamespaceIdentityRegistry = Readonly<{ registry_id: string; namespace_identities: readonly string[]; tenant_bindings_valid: boolean; ownership_registered: boolean; identifiers_unique: boolean; registry_published: boolean; integrity_hash: string }>;
export type AuthenticationService = Readonly<{ service_id: string; deployed: boolean; credential_validation: boolean; certificate_authentication: boolean; token_authentication: boolean; valid_identities_accepted: boolean; invalid_credentials_rejected: boolean; integrity_hash: string }>;
export type AuthorizationService = Readonly<{ service_id: string; deployed: boolean; policies_configured: boolean; identity_permission_bindings: boolean; authorization_decisions_validated: boolean; unauthorized_requests_denied: boolean; evidence_recorded: boolean; integrity_hash: string }>;
export type IdentityTokenService = Readonly<{ service_id: string; token_signing_configured: boolean; token_validation_enabled: boolean; expiration_enforced: boolean; token_integrity_validated: boolean; signing_metadata_published: boolean; signed_tokens: readonly string[]; deterministic_signatures: boolean; integrity_hash: string }>;
export type IdentityLifecycle = Readonly<{ lifecycle_id: string; states: readonly IdentityLifecycleState[]; provisioning_enabled: boolean; activation_enabled: boolean; suspension_enabled: boolean; retirement_enabled: boolean; transitions_recorded: boolean; deterministic: boolean; integrity_hash: string }>;
export type IdentityAuditEvidence = Readonly<{ ledger_id: string; records: readonly string[]; identity_registrations_recorded: boolean; authority_transfers_recorded: boolean; authentication_events_recorded: boolean; authorization_events_recorded: boolean; token_issuance_recorded: boolean; sealed: boolean; immutable: boolean; lineage_complete: boolean; integrity_hash: string }>;
export type IdentityCoreReadiness = Readonly<{ readiness_id: string; decision: IdentityCoreDecision; phase_ready: boolean; foundation_ready: boolean; transfer_ready: boolean; platform_identity_ready: boolean; tenant_identity_ready: boolean; namespace_identity_ready: boolean; authentication_ready: boolean; authorization_ready: boolean; token_ready: boolean; lifecycle_ready: boolean; audit_ready: boolean; replay_ready: boolean; failures: readonly IdentityCoreFailure[]; integrity_hash: string }>;
export type IdentityCoreResult = Readonly<{ phase_version: "identity-core/w1.1a"; phase_identifier: "IdentityCore"; bootstrap_ref: "platform-bootstrap-authority/w1.0"; foundation: ProductionIdentityFoundation; authority_transfer: IdentityAuthorityTransfer; platform_identity: PlatformIdentity; tenant_registry: TenantIdentityRegistry; namespace_registry: NamespaceIdentityRegistry; authentication_service: AuthenticationService; authorization_service: AuthorizationService; token_service: IdentityTokenService; lifecycle: IdentityLifecycle; audit_evidence: IdentityAuditEvidence; readiness: IdentityCoreReadiness; replay_hash: string; integrity_hash: string }>;
export type IdentityCoreValidation = Readonly<{ valid: boolean; decision: IdentityCoreDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; foundation_valid: boolean; transfer_valid: boolean; platform_identity_valid: boolean; tenant_registry_valid: boolean; namespace_registry_valid: boolean; authentication_valid: boolean; authorization_valid: boolean; token_valid: boolean; lifecycle_valid: boolean; audit_valid: boolean; readiness_valid: boolean; failures: readonly IdentityCoreFailure[]; integrity_hash: string }>;
export type IdentityCoreBundle = Readonly<{ doctrine: Readonly<{ version: "identity-core/w1.1a"; owns_platform_identity: true; owns_identity_authority: true; owns_tenant_identity: true; owns_namespace_identity: true; owns_authentication_services: true; owns_authorization_services: true; owns_identity_tokens: true; owns_identity_audit: true }>; result: IdentityCoreResult; validation: IdentityCoreValidation }>;
