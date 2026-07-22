export type SecurityFullDecision = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type SecurityFullFailure =
  | "W1_1B_IDENTITY_FULL_INVALID"
  | "W1_2B_STORAGE_FULL_INVALID"
  | "W1_3B_MESSAGING_FULL_INVALID"
  | "W1_4B_REGISTRY_FULL_INVALID"
  | "W1_5_CONFIGURATION_PLATFORM_INVALID"
  | "W1_6_OBSERVABILITY_PLATFORM_INVALID"
  | "W1_7A_SECURITY_CORE_INVALID"
  | "PRODUCTION_KEY_LIFECYCLE_MISSING"
  | "KEY_HIERARCHY_INVALID"
  | "KEY_LINEAGE_INCOMPLETE"
  | "KEY_DESTRUCTION_UNCONTROLLED"
  | "CERTIFICATE_LIFECYCLE_MISSING"
  | "CERTIFICATE_RENEWAL_FAILED"
  | "CERTIFICATE_REVOCATION_FAILED"
  | "TRUST_CHAIN_INVALID"
  | "SECRET_VAULT_MISSING"
  | "SECRET_VERSIONING_MISSING"
  | "SECRET_POLICY_VIOLATED"
  | "SECRET_AUDITING_MISSING"
  | "ENCRYPTION_AT_REST_MISSING"
  | "STORAGE_ENCRYPTION_POLICY_INVALID"
  | "BACKUP_ENCRYPTION_MISSING"
  | "ENCRYPTION_IN_TRANSIT_MISSING"
  | "TLS_CONFIGURATION_INVALID"
  | "MUTUAL_TLS_FAILED"
  | "AUTOMATIC_ROTATION_MISSING"
  | "ROTATION_SCHEDULE_INVALID"
  | "ROTATION_VALIDATION_FAILED"
  | "REVOCATION_MISSING"
  | "REVOCATION_PROPAGATION_FAILED"
  | "RECOVERY_PROCEDURES_MISSING"
  | "SECURE_SERVICE_COMMUNICATION_MISSING"
  | "SERVICE_IDENTITY_VALIDATION_FAILED"
  | "SERVICE_AUTHORIZATION_FAILED"
  | "COMMUNICATION_AUDITING_MISSING"
  | "SECURITY_EVIDENCE_MISSING"
  | "SECURITY_EVIDENCE_NOT_IMMUTABLE"
  | "TENANT_ISOLATION_FAILED"
  | "CRITICAL_SECURITY_FINDINGS_UNRESOLVED"
  | "SECURITY_INFRASTRUCTURE_GATE_FAILED";
export type SecurityFullScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | SecurityFullFailure;
export type SecurityFullInput = Readonly<{ scenario?: SecurityFullScenario; seed?: string }>;
export type ProductionKeyLifecycle = Readonly<{ registry_id: string; key_hierarchy: boolean; key_generation: boolean; key_activation: boolean; key_suspension: boolean; key_expiration: boolean; key_archival: boolean; key_destruction: boolean; key_lineage: boolean; integrity_hash: string }>;
export type CertificateLifecycle = Readonly<{ registry_id: string; certificate_issuance: boolean; renewal: boolean; rotation: boolean; revocation: boolean; trust_chains: boolean; ca_hierarchy: boolean; service_certificates: boolean; client_certificates: boolean; integrity_hash: string }>;
export type SecretVault = Readonly<{ vault_id: string; vault_operational: boolean; secret_versioning: boolean; secret_policies: boolean; secret_encryption: boolean; secret_retrieval: boolean; secret_auditing: boolean; secret_lineage: boolean; integrity_hash: string }>;
export type EncryptionAtRest = Readonly<{ policy_id: string; database_encryption: boolean; object_encryption: boolean; ledger_encryption: boolean; backup_encryption: boolean; snapshot_encryption: boolean; storage_encryption_policies: boolean; integrity_hash: string }>;
export type EncryptionInTransit = Readonly<{ policy_id: string; tls_configuration: boolean; mutual_tls: boolean; service_authentication: boolean; certificate_validation: boolean; secure_apis: boolean; secure_messaging: boolean; secure_replication: boolean; integrity_hash: string }>;
export type SecurityRotation = Readonly<{ scheduler_id: string; automatic_key_rotation: boolean; certificate_rotation: boolean; secret_rotation: boolean; rotation_scheduling: boolean; rotation_validation: boolean; rotation_auditing: boolean; integrity_hash: string }>;
export type SecurityRevocation = Readonly<{ registry_id: string; key_revocation: boolean; certificate_revocation: boolean; secret_invalidation: boolean; revocation_propagation: boolean; dependency_notification: boolean; recovery_procedures: boolean; integrity_hash: string }>;
export type SecureServiceCommunication = Readonly<{ framework_id: string; service_identity_validation: boolean; mutual_authentication: boolean; secure_messaging: boolean; secure_apis: boolean; service_authorization: boolean; communication_auditing: boolean; integrity_hash: string }>;
export type SecurityFullEvidence = Readonly<{ ledger_id: string; records: readonly string[]; key_lifecycle_evidence: boolean; certificate_evidence: boolean; vault_evidence: boolean; encryption_evidence: boolean; rotation_reports: boolean; revocation_reports: boolean; communication_evidence: boolean; qualification_reports: boolean; immutable: boolean; reproducible: boolean; integrity_hash: string }>;
export type SecurityFullQualification = Readonly<{ report_id: string; key_lifecycle_validation: boolean; certificate_validation: boolean; vault_validation: boolean; encryption_validation: boolean; rotation_validation: boolean; revocation_validation: boolean; communication_security_validation: boolean; tenant_isolation_validation: boolean; audit_validation: boolean; evidence_completeness: boolean; gate_decision: SecurityFullDecision; integrity_hash: string }>;
export type SecurityFullReadiness = Readonly<{ readiness_id: string; decision: SecurityFullDecision; phase_ready: boolean; identity_full_ready: boolean; storage_full_ready: boolean; messaging_full_ready: boolean; registry_full_ready: boolean; configuration_platform_ready: boolean; observability_platform_ready: boolean; security_core_ready: boolean; key_lifecycle_ready: boolean; certificate_lifecycle_ready: boolean; secret_vault_ready: boolean; encryption_at_rest_ready: boolean; encryption_in_transit_ready: boolean; rotation_ready: boolean; revocation_ready: boolean; communication_ready: boolean; evidence_ready: boolean; qualification_ready: boolean; failures: readonly SecurityFullFailure[]; integrity_hash: string }>;
export type SecurityFullResult = Readonly<{ phase_version: "security-full/w1.7b"; phase_identifier: "SecurityFull"; identity_full_ref: "identity-full/w1.1b"; storage_full_ref: "storage-full/w1.2b"; messaging_full_ref: "messaging-full/w1.3b"; registry_full_ref: "registry-full/w1.4b"; configuration_platform_ref: "configuration-platform/w1.5"; observability_platform_ref: "observability-platform/w1.6"; security_core_ref: "security-core/w1.7a"; key_lifecycle: ProductionKeyLifecycle; certificate_lifecycle: CertificateLifecycle; secret_vault: SecretVault; encryption_at_rest: EncryptionAtRest; encryption_in_transit: EncryptionInTransit; rotation: SecurityRotation; revocation: SecurityRevocation; service_communication: SecureServiceCommunication; evidence: SecurityFullEvidence; qualification: SecurityFullQualification; readiness: SecurityFullReadiness; replay_hash: string; integrity_hash: string }>;
export type SecurityFullValidation = Readonly<{ valid: boolean; decision: SecurityFullDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; key_lifecycle_valid: boolean; certificate_lifecycle_valid: boolean; secret_vault_valid: boolean; encryption_at_rest_valid: boolean; encryption_in_transit_valid: boolean; rotation_valid: boolean; revocation_valid: boolean; communication_valid: boolean; evidence_valid: boolean; qualification_valid: boolean; readiness_valid: boolean; failures: readonly SecurityFullFailure[]; integrity_hash: string }>;
export type SecurityFullBundle = Readonly<{ doctrine: Readonly<{ version: "security-full/w1.7b"; owns_production_key_lifecycle: true; owns_certificate_lifecycle: true; owns_secret_vault: true; owns_encryption_at_rest: true; owns_encryption_in_transit: true; owns_automatic_rotation: true; owns_revocation: true; owns_secure_service_communication: true; owns_security_evidence: true; qualification_gate: "Security Infrastructure Gate" }>; result: SecurityFullResult; validation: SecurityFullValidation }>;
