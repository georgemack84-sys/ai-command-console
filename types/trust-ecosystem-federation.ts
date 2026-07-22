export type TrustFederationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type FederationLifecycleStatus = "REGISTERED" | "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "REVOKED" | "TERMINATED";
export type FederationTrustDecision = "TRUSTED" | "CONDITIONALLY_TRUSTED" | "RESTRICTED" | "UNTRUSTED" | "FAIL_CLOSED";
export type FederationParticipantType = "PROGRAM" | "APPLICATION" | "TRUST_DOMAIN";

export type TrustFederationFailure =
  | "P5_16_CERTIFICATION_INVALID"
  | "FEDERATION_ARCHITECTURE_MISSING"
  | "FEDERATION_IDENTITY_MODEL_MISSING"
  | "FEDERATION_TRUST_REGISTRY_MISSING"
  | "CROSS_PROGRAM_MATRIX_MISSING"
  | "FEDERATION_TRUST_EVALUATION_MISSING"
  | "TRUST_INTEROPERABILITY_MISSING"
  | "FEDERATION_GOVERNANCE_MISSING"
  | "P5_P4_LINEAGE_COMPATIBILITY_FAILED"
  | "CERTIFICATION_TRIGGERED_INVALIDATION_MISSING"
  | "FEDERATION_LIFECYCLE_MISSING"
  | "FEDERATION_OBSERVABILITY_MISSING"
  | "FEDERATION_AUDIT_LINEAGE_MISSING"
  | "TENANT_ISOLATION_FAILURE"
  | "FEDERATION_CERTIFICATION_GATE_MISSING"
  | "PROGRAM_3_QUALIFICATION_BYPASSED"
  | "PROGRAM_4_CERTIFICATION_BYPASSED"
  | "UNAUTHORIZED_AUTHORITY_GRANTED"
  | "PRIVILEGE_ELEVATED"
  | "EXECUTION_AUTHORIZED_BY_FEDERATION"
  | "IMPLICIT_TRUST_PROPAGATED"
  | "FEDERATION_EVIDENCE_MISSING"
  | "FEDERATION_EVIDENCE_STALE"
  | "FEDERATION_EVIDENCE_CONFLICTING"
  | "FEDERATION_EVIDENCE_UNVERIFIABLE"
  | "FEDERATION_REPLAY_FAILED"
  | "FEDERATION_LINEAGE_INCOMPLETE"
  | "FEDERATION_REGISTRY_NOT_OPERATIONAL"
  | "INTEROPERABILITY_NOT_VERIFIED"
  | "GOVERNANCE_NOT_ENFORCED"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "CERTIFICATION_LINEAGE_INCOMPATIBLE"
  | "INVALIDATION_BEFORE_LINEAGE_VERIFICATION"
  | "OBSERVABILITY_NOT_OPERATIONAL"
  | "FAIL_CLOSED_NOT_VERIFIED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustFederationScenario = "BASELINE" | TrustFederationFailure;
export type TrustFederationInput = Readonly<{ scenario?: TrustFederationScenario; federation_id?: string; participant_id?: string; trust_domain?: string }>;

export type FederationTrustRecord = Readonly<{ federation_trust_id: string; federation_id: string; participant_id: string; participant_type: FederationParticipantType; trust_domain: string; trust_relationship: string; trust_level: "ADVISORY" | "LOCAL_ONLY" | "RESTRICTED"; trust_standing: FederationLifecycleStatus; confidence_score: number; alignment_score: number; risk_score: number; qualification_reference: string; certification_reference: string; evidence_references: readonly string[]; governance_references: readonly string[]; policy_references: readonly string[]; lineage_reference: string; evaluation_timestamp: string; expiration_timestamp: string; integrity_hash: string }>;
export type FederationEvaluationRecord = Readonly<{ evaluation_id: string; federation_id: string; evaluation_scope: string; evaluation_inputs: readonly string[]; trust_decision: FederationTrustDecision; standing: FederationLifecycleStatus; confidence: number; risk: number; governance_result: boolean; alignment_result: boolean; policy_result: boolean; qualification_result: boolean; certification_result: boolean; fail_closed_reason: string; evaluation_timestamp: string; integrity_hash: string }>;
export type FederationArchitecture = Readonly<{ architecture_id: string; federation_model: boolean; trust_domains: boolean; federation_contracts: boolean; expands_visibility_not_authority: boolean; integrity_hash: string }>;
export type FederationIdentityRegistry = Readonly<{ identity_registry_id: string; program_identity: boolean; application_identity: boolean; trust_domain_identity: boolean; federation_membership: boolean; trust_relationship_identity: boolean; integrity_hash: string }>;
export type CrossProgramTrustMatrix = Readonly<{ matrix_id: string; program_program: boolean; program_application: boolean; application_application: boolean; trust_domain_trust_domain: boolean; tenant_trust_isolation: boolean; integrity_hash: string }>;
export type FederationCompatibilityReport = Readonly<{ report_id: string; trust_exchange: boolean; evidence_exchange: boolean; qualification_interoperability: boolean; certification_compatibility: boolean; governance_compatibility: boolean; integrity_hash: string }>;
export type FederationGovernanceReport = Readonly<{ governance_id: string; governance_inheritance: boolean; constitutional_compatibility: boolean; authority_boundaries: boolean; trust_restrictions: boolean; policy_compatibility: boolean; integrity_hash: string }>;
export type FederationLineageValidation = Readonly<{ validation_id: "P5-P4-VERIFY-001"; certification_lineage: boolean; certificate_ancestry: boolean; qualification_compatibility: boolean; application_lineage: boolean; ecosystem_lineage: boolean; compatible: boolean; integrity_hash: string }>;
export type FederationInvalidationReport = Readonly<{ invalidation_id: string; certification_revoked: boolean; certification_suspended: boolean; certification_expired: boolean; qualification_failure: boolean; governance_failure: boolean; lineage_verified_before_invalidation: boolean; integrity_hash: string }>;
export type FederationLifecycleRecord = Readonly<{ lifecycle_id: string; status: FederationLifecycleStatus; membership_registered: boolean; activation_allowed: boolean; restricted_supported: boolean; suspension_supported: boolean; revocation_supported: boolean; termination_supported: boolean; integrity_hash: string }>;
export type FederationObservability = Readonly<{ dashboard_id: string; federation_health: boolean; trust_propagation: boolean; interoperability_failures: boolean; governance_violations: boolean; evidence_freshness: boolean; certification_changes: boolean; integrity_hash: string }>;
export type FederationAudit = Readonly<{ audit_id: string; federation_decisions: readonly string[]; trust_lineage: readonly string[]; evidence_lineage: readonly string[]; governance_lineage: readonly string[]; certification_lineage: readonly string[]; immutable: boolean; replay_refs: readonly string[]; integrity_hash: string }>;
export type FederationSecurity = Readonly<{ security_id: string; tenant_isolation: boolean; identity_separation: boolean; namespace_isolation: boolean; evidence_ownership: boolean; federation_boundaries: boolean; integrity_hash: string }>;
export type FederationCertification = Readonly<{ certification_id: string; outcome: TrustFederationOutcome; phase_ready: boolean; architecture_complete: boolean; registry_operational: boolean; interoperability_verified: boolean; trust_evaluation_deterministic: boolean; governance_enforced: boolean; constitutional_compliance_verified: boolean; certification_lineage_compatible: boolean; p5_p4_verify_001_satisfied: boolean; tenant_isolation_maintained: boolean; replay_reproducible: boolean; audit_lineage_complete: boolean; observability_operational: boolean; fail_closed_verified: boolean; advisory_only: boolean; failures: readonly TrustFederationFailure[]; integrity_hash: string }>;
export type TrustFederationResult = Readonly<{ phase_version: "trust-ecosystem-federation/v5.17"; phase_identifier: "TrustEcosystemFederation"; certification_ref: "trust-certification/v5.16"; architecture: FederationArchitecture; identity: FederationIdentityRegistry; record: FederationTrustRecord; matrix: CrossProgramTrustMatrix; evaluation: FederationEvaluationRecord; compatibility: FederationCompatibilityReport; governance: FederationGovernanceReport; lineage: FederationLineageValidation; invalidation: FederationInvalidationReport; lifecycle: FederationLifecycleRecord; observability: FederationObservability; audit: FederationAudit; security: FederationSecurity; certification: FederationCertification; replay_hash: string; integrity_hash: string }>;
export type TrustFederationValidation = Readonly<{ valid: boolean; outcome: TrustFederationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; identity_valid: boolean; record_valid: boolean; matrix_valid: boolean; evaluation_valid: boolean; compatibility_valid: boolean; governance_valid: boolean; lineage_valid: boolean; invalidation_valid: boolean; lifecycle_valid: boolean; observability_valid: boolean; audit_valid: boolean; security_valid: boolean; certification_valid: boolean; failures: readonly TrustFederationFailure[]; integrity_hash: string }>;
export type TrustFederationBundle = Readonly<{ doctrine: Readonly<{ version: "trust-ecosystem-federation/v5.17"; owns_cross_program_trust_federation: true; owns_federation_governance: true; owns_trust_interoperability: true; owns_federation_trust_evaluation: true; grants_authority: false; elevates_privilege: false; authorizes_execution: false; bypasses_constitutional_governance: false; replaces_originating_trust_evaluations: false }>; result: TrustFederationResult; validation: TrustFederationValidation }>;
