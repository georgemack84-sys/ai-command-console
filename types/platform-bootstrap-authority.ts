export type BootstrapDecision = "BOOTSTRAP_READY" | "READY_WITH_OBSERVATIONS" | "CONDITIONALLY_READY" | "NOT_READY" | "FAIL_CLOSED";
export type BootstrapRole = "BOOTSTRAP_ADMINISTRATOR" | "BOOTSTRAP_OPERATOR" | "CRYPTOGRAPHIC_CUSTODIAN";
export type BootstrapPermission = "INITIALIZE_PLATFORM" | "MANAGE_BOOTSTRAP_IDENTITY" | "ISSUE_BOOTSTRAP_CERTIFICATES" | "GRANT_BOOTSTRAP_PERMISSIONS" | "CREATE_BOOTSTRAP_TENANT" | "MANAGE_BOOTSTRAP_NAMESPACE" | "WRITE_BOOTSTRAP_AUDIT" | "PROTECT_ROOT_KEYS" | "APPROVE_BOOTSTRAP_RECOVERY";
export type BootstrapFailure =
  | "LAYER_0_CONSTITUTIONAL_FRAMEWORK_MISSING"
  | "CAPABILITY_ATLAS_MISSING"
  | "PLATFORM_GOVERNANCE_STANDARDS_MISSING"
  | "BOOTSTRAP_ARCHITECTURE_MISSING"
  | "BOOTSTRAP_LIFECYCLE_INCOMPLETE"
  | "BOOTSTRAP_AUTHORITY_MODEL_INVALID"
  | "OFFLINE_ROOT_OF_TRUST_MISSING"
  | "ROOT_KEYS_NOT_GENERATED"
  | "ROOT_KEYS_NOT_IMMUTABLE"
  | "KEY_CEREMONY_RECORDS_MISSING"
  | "RECOVERY_PROCEDURES_MISSING"
  | "BOOTSTRAP_CA_MISSING"
  | "BOOTSTRAP_CERTIFICATE_POLICY_MISSING"
  | "CERTIFICATE_LIFECYCLE_INVALID"
  | "BOOTSTRAP_IDENTITY_MISSING"
  | "BOOTSTRAP_PRINCIPAL_RECORDS_MISSING"
  | "IDENTITY_VALIDATION_FAILED"
  | "BOOTSTRAP_AUTHORIZATION_MISSING"
  | "AUTHORIZATION_POLICY_MISSING"
  | "AUTHORIZATION_DECISION_NON_DETERMINISTIC"
  | "ROLE_PERMISSION_MATRIX_INCOMPLETE"
  | "PERMISSION_GRANTS_INVALID"
  | "BOOTSTRAP_NAMESPACE_MISSING"
  | "NAMESPACE_OWNERSHIP_INVALID"
  | "BOOTSTRAP_TENANT_MISSING"
  | "TENANT_BOUNDARY_INVALID"
  | "AUDIT_LEDGER_MISSING"
  | "AUDIT_RECORDS_INCOMPLETE"
  | "AUDIT_LEDGER_NOT_IMMUTABLE"
  | "BOOTSTRAP_CREDENTIALS_UNSECURED"
  | "PRIVATE_KEYS_UNPROTECTED"
  | "MULTI_PARTY_AUTHORIZATION_MISSING"
  | "BACKUP_MATERIAL_UNSECURED"
  | "BOOTSTRAP_VALIDATION_FAILED"
  | "BOOTSTRAP_EVIDENCE_NOT_IMMUTABLE"
  | "BOOTSTRAP_QUALIFICATION_GATE_FAILED";
export type BootstrapScenario = "BASELINE" | "READY_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | BootstrapFailure;
export type BootstrapInput = Readonly<{ scenario?: BootstrapScenario; seed?: string }>;
export type BootstrapArchitecture = Readonly<{ architecture_id: string; lifecycle_defined: boolean; boundaries_defined: boolean; authority_model_defined: boolean; trust_initialization_flow_defined: boolean; operating_procedures_defined: boolean; integrity_hash: string }>;
export type OfflineRootOfTrust = Readonly<{ root_id: string; offline_root_keys: readonly string[]; hardware_storage_secured: boolean; key_ceremony_recorded: boolean; root_certificate_established: boolean; recovery_procedures_validated: boolean; immutable: boolean; integrity_hash: string }>;
export type BootstrapCertificateAuthority = Readonly<{ ca_id: string; authority_operational: boolean; bootstrap_certificates: readonly string[]; certificate_policy_defined: boolean; revocation_process_defined: boolean; certificate_lifecycle_defined: boolean; integrity_hash: string }>;
export type BootstrapIdentityRegistry = Readonly<{ registry_id: string; authority_identity: string; administrator_identity: string; service_identities: readonly string[]; principals_registered: boolean; identities_validated: boolean; integrity_hash: string }>;
export type BootstrapAuthorization = Readonly<{ policy_id: string; authorization_model_defined: boolean; permission_hierarchy_defined: boolean; evaluator_operational: boolean; deterministic_decisions: boolean; decisions: readonly string[]; integrity_hash: string }>;
export type BootstrapRolePermissionMatrix = Readonly<{ matrix_id: string; roles: readonly BootstrapRole[]; permissions: readonly BootstrapPermission[]; permission_grants: readonly string[]; grants_validated: boolean; matrix_complete: boolean; integrity_hash: string }>;
export type BootstrapNamespaceRegistry = Readonly<{ registry_id: string; bootstrap_namespace: string; reserved_namespaces: readonly string[]; ownership_established: boolean; namespace_authority_registered: boolean; integrity_hash: string }>;
export type BootstrapTenant = Readonly<{ tenant_id: string; authority_assigned: boolean; ownership_configured: boolean; tenant_isolation_established: boolean; tenant_boundaries_validated: boolean; integrity_hash: string }>;
export type BootstrapAuditLedger = Readonly<{ ledger_id: string; records: readonly string[]; cryptographic_operations_recorded: boolean; authorization_decisions_recorded: boolean; identities_recorded: boolean; certificates_recorded: boolean; immutable: boolean; integrity_hash: string }>;
export type BootstrapSecurityReport = Readonly<{ report_id: string; private_keys_secured: boolean; credentials_protected: boolean; multi_party_authorization_enabled: boolean; backup_material_secured: boolean; credential_storage_validated: boolean; integrity_hash: string }>;
export type BootstrapValidationReport = Readonly<{ report_id: string; authority_verified: boolean; certificates_verified: boolean; permissions_verified: boolean; identities_verified: boolean; audit_complete: boolean; evidence_immutable: boolean; integrity_hash: string }>;
export type BootstrapQualificationReport = Readonly<{ report_id: string; root_trust_ready: boolean; authority_operational: boolean; identity_ready: boolean; authorization_ready: boolean; namespace_ready: boolean; tenant_ready: boolean; ca_ready: boolean; audit_ready: boolean; security_ready: boolean; qualification_gate_passed: boolean; integrity_hash: string }>;
export type BootstrapReadiness = Readonly<{ readiness_id: string; decision: BootstrapDecision; phase_ready: boolean; architecture_ready: boolean; root_trust_ready: boolean; ca_ready: boolean; identity_ready: boolean; authorization_ready: boolean; roles_ready: boolean; namespace_ready: boolean; tenant_ready: boolean; audit_ready: boolean; security_ready: boolean; validation_ready: boolean; qualification_ready: boolean; failures: readonly BootstrapFailure[]; integrity_hash: string }>;
export type BootstrapResult = Readonly<{ phase_version: "platform-bootstrap-authority/w1.0"; phase_identifier: "PlatformBootstrapAuthority"; architecture: BootstrapArchitecture; root_of_trust: OfflineRootOfTrust; certificate_authority: BootstrapCertificateAuthority; identity_registry: BootstrapIdentityRegistry; authorization: BootstrapAuthorization; role_permission_matrix: BootstrapRolePermissionMatrix; namespace_registry: BootstrapNamespaceRegistry; tenant: BootstrapTenant; audit_ledger: BootstrapAuditLedger; security_report: BootstrapSecurityReport; validation_report: BootstrapValidationReport; qualification_report: BootstrapQualificationReport; readiness: BootstrapReadiness; replay_hash: string; integrity_hash: string }>;
export type BootstrapValidation = Readonly<{ valid: boolean; decision: BootstrapDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; root_trust_valid: boolean; ca_valid: boolean; identity_valid: boolean; authorization_valid: boolean; roles_valid: boolean; namespace_valid: boolean; tenant_valid: boolean; audit_valid: boolean; security_valid: boolean; validation_report_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly BootstrapFailure[]; integrity_hash: string }>;
export type BootstrapBundle = Readonly<{ doctrine: Readonly<{ version: "platform-bootstrap-authority/w1.0"; owns_offline_root_of_trust: true; owns_bootstrap_authority: true; owns_bootstrap_identity: true; owns_bootstrap_authorization: true; owns_bootstrap_tenant: true; owns_bootstrap_namespace: true; owns_bootstrap_audit_ledger: true }>; result: BootstrapResult; validation: BootstrapValidation }>;
