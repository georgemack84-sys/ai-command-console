export type SecurityCoreDecision = "CORE_ACTIVATED" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONALLY_ACTIVE" | "NOT_ACTIVE" | "FAIL_CLOSED";
export type SecurityCoreFailure =
  | "W1_0_BOOTSTRAP_AUTHORITY_INVALID"
  | "CRYPTOGRAPHIC_ROOT_MISSING"
  | "ROOT_KEY_GENERATION_FAILED"
  | "TRUST_ANCHOR_INVALID"
  | "ROOT_INTEGRITY_INVALID"
  | "KEY_MANAGEMENT_MISSING"
  | "KEY_STORAGE_UNAVAILABLE"
  | "KEY_INTEGRITY_VALIDATION_FAILED"
  | "KEY_FINGERPRINT_INVALID"
  | "SIGNING_SERVICE_MISSING"
  | "SIGNATURE_GENERATION_FAILED"
  | "CANONICAL_SERIALIZATION_INVALID"
  | "SIGNATURE_NON_DETERMINISTIC"
  | "VERIFICATION_SERVICE_MISSING"
  | "SIGNATURE_VALIDATION_FAILED"
  | "HASH_VALIDATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CERTIFICATE_INITIALIZATION_MISSING"
  | "ROOT_CERTIFICATE_INVALID"
  | "TRUST_CHAIN_INVALID"
  | "SECRET_ENCRYPTION_MISSING"
  | "SECRET_DECRYPTION_FAILED"
  | "SECRET_INTEGRITY_VALIDATION_FAILED"
  | "SECRET_PROTECTION_FAILED"
  | "BOOTSTRAP_SECURITY_EVIDENCE_MISSING"
  | "CRYPTOGRAPHIC_EVIDENCE_NOT_IMMUTABLE"
  | "ACTIVATION_EVIDENCE_MISSING"
  | "DETERMINISTIC_REPLAY_FAILED"
  | "BOOTSTRAP_SECURITY_TESTS_FAILED"
  | "CORE_ACTIVATION_FAILED";
export type SecurityCoreScenario = "BASELINE" | "ACTIVE_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | SecurityCoreFailure;
export type SecurityCoreInput = Readonly<{ scenario?: SecurityCoreScenario; seed?: string }>;
export type CryptographicRoot = Readonly<{ root_id: string; platform_root_key: boolean; signing_identity: boolean; verification_identity: boolean; trust_anchor: boolean; root_metadata: boolean; root_integrity: boolean; integrity_hash: string }>;
export type InitialKeyManagement = Readonly<{ registry_id: string; key_generation: boolean; key_storage: boolean; key_loading: boolean; key_identification: boolean; key_integrity_validation: boolean; key_fingerprints: boolean; active_platform_keys: readonly string[]; integrity_hash: string }>;
export type CryptographicSigning = Readonly<{ service_id: string; digital_signing: boolean; signature_generation: boolean; payload_hashing: boolean; canonical_serialization: boolean; deterministic_signatures: boolean; signing_evidence: boolean; integrity_hash: string }>;
export type CryptographicVerification = Readonly<{ service_id: string; signature_validation: boolean; hash_validation: boolean; certificate_validation: boolean; integrity_verification: boolean; verification_reports: boolean; verification_evidence: boolean; integrity_hash: string }>;
export type CertificateInitialization = Readonly<{ authority_id: string; root_certificate: boolean; certificate_authority: boolean; bootstrap_certificates: boolean; certificate_chain_validation: boolean; trust_chain_metadata: boolean; integrity_hash: string }>;
export type SecretEncryptionService = Readonly<{ service_id: string; secret_encryption: boolean; secret_decryption: boolean; secret_integrity_validation: boolean; encryption_metadata: boolean; confidential_protection: boolean; encryption_evidence: boolean; integrity_hash: string }>;
export type BootstrapSecurityEvidence = Readonly<{ ledger_id: string; records: readonly string[]; key_generation_records: boolean; signing_evidence: boolean; verification_evidence: boolean; certificate_evidence: boolean; encryption_evidence: boolean; activation_evidence: boolean; immutable: boolean; replay_validated: boolean; integrity_hash: string }>;
export type SecurityCoreReadiness = Readonly<{ readiness_id: string; decision: SecurityCoreDecision; phase_ready: boolean; bootstrap_ready: boolean; root_ready: boolean; key_management_ready: boolean; signing_ready: boolean; verification_ready: boolean; certificates_ready: boolean; secret_encryption_ready: boolean; evidence_ready: boolean; tests_passed: boolean; failures: readonly SecurityCoreFailure[]; integrity_hash: string }>;
export type SecurityCoreResult = Readonly<{ phase_version: "security-core/w1.7a"; phase_identifier: "SecurityCore"; bootstrap_authority_ref: "platform-bootstrap-authority/w1.0"; cryptographic_root: CryptographicRoot; key_management: InitialKeyManagement; signing: CryptographicSigning; verification: CryptographicVerification; certificates: CertificateInitialization; secret_encryption: SecretEncryptionService; evidence: BootstrapSecurityEvidence; readiness: SecurityCoreReadiness; replay_hash: string; integrity_hash: string }>;
export type SecurityCoreValidation = Readonly<{ valid: boolean; decision: SecurityCoreDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; root_valid: boolean; key_management_valid: boolean; signing_valid: boolean; verification_valid: boolean; certificates_valid: boolean; secret_encryption_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly SecurityCoreFailure[]; integrity_hash: string }>;
export type SecurityCoreBundle = Readonly<{ doctrine: Readonly<{ version: "security-core/w1.7a"; owns_initial_key_management: true; owns_cryptographic_signing: true; owns_cryptographic_verification: true; owns_certificate_initialization: true; owns_secret_encryption: true; owns_bootstrap_cryptographic_evidence: true; excludes_tenant_vaults: true; excludes_automated_key_rotation: true; excludes_certificate_lifecycle: true }>; result: SecurityCoreResult; validation: SecurityCoreValidation }>;
