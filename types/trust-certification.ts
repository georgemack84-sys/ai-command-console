export type TrustCertificationOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type TrustCertificationStatus = "NOT_CERTIFIED" | "CERTIFICATION_IN_PROGRESS" | "CERTIFIED" | "CERTIFICATION_SUSPENDED" | "CERTIFICATION_REVOKED" | "CERTIFICATION_EXPIRED";
export type TrustCertificationDecision = "CERTIFIED" | "CERTIFIED_WITH_RESTRICTIONS" | "REQUIRES_REVIEW" | "REQUIRES_MORE_EVIDENCE" | "DENIED";
export type CertificationEvidenceType = "CONSTITUTIONAL" | "GOVERNANCE" | "POLICY" | "SAFETY" | "ALIGNMENT" | "CONFIDENCE" | "OPERATIONAL" | "MONITORING" | "DRIFT" | "RECOVERY" | "AUDIT";
export type CertificationValidationStatus = "VALID" | "MISSING" | "STALE" | "CONFLICTING" | "UNVERIFIABLE";

export type TrustCertificationFailure =
  | "P5_15_RECOVERY_INVALID"
  | "CERTIFICATION_ARCHITECTURE_MISSING"
  | "CERTIFICATION_LIFECYCLE_MISSING"
  | "CERTIFICATION_TERMINOLOGY_MISSING"
  | "CERTIFICATION_CONTRACTS_MISSING"
  | "CERTIFICATION_POLICIES_MISSING"
  | "CERTIFICATION_SCOPE_REGISTRY_MISSING"
  | "CERTIFICATION_EVIDENCE_REGISTRY_MISSING"
  | "CERTIFICATION_EVALUATION_ENGINE_MISSING"
  | "TRUST_ATTESTATION_MISSING"
  | "CERTIFICATE_GENERATION_MISSING"
  | "CERTIFICATION_GOVERNANCE_MISSING"
  | "CERTIFICATION_REPLAY_AUDIT_MISSING"
  | "CERTIFICATION_OBSERVABILITY_MISSING"
  | "CERTIFICATION_REGISTRY_MISSING"
  | "CERTIFICATION_DECISION_ENGINE_MISSING"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_EVIDENCE_STALE"
  | "CERTIFICATION_EVIDENCE_CONFLICTING"
  | "CERTIFICATION_EVIDENCE_UNVERIFIABLE"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "GOVERNANCE_COMPLIANCE_INVALID"
  | "SAFETY_QUALIFICATION_INVALID"
  | "ALIGNMENT_VERIFICATION_INVALID"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "OPERATIONAL_READINESS_INVALID"
  | "TRUST_INTEGRITY_INVALID"
  | "ATTESTATION_NOT_REPRODUCIBLE"
  | "CERTIFICATE_NOT_IMMUTABLE"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CERTIFICATION_REPORT_MISSING"
  | "OBSERVABILITY_DASHBOARD_MISSING"
  | "REGISTRY_NOT_OPERATIONAL"
  | "PROGRAM_QUALIFICATION_EXECUTED"
  | "TRUST_EVALUATION_EXECUTED"
  | "ALIGNMENT_VERIFICATION_EXECUTED"
  | "COMPLIANCE_EVALUATION_EXECUTED"
  | "SAFETY_QUALIFICATION_EXECUTED"
  | "OPERATIONAL_MONITORING_EXECUTED"
  | "TRUST_RECOVERY_EXECUTED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustCertificationScenario = "BASELINE" | TrustCertificationFailure;
export type TrustCertificationInput = Readonly<{ scenario?: TrustCertificationScenario; trust_artifact_id?: string; trust_domain?: string; certification_scope?: string }>;

export type CertificationFoundation = Readonly<{ foundation_id: string; architecture: boolean; lifecycle: boolean; terminology: boolean; contracts: boolean; policies: boolean; integrity_hash: string }>;
export type CertificationScopeRegistry = Readonly<{ registry_id: string; certifiable_assets: readonly string[]; complete: boolean; integrity_hash: string }>;
export type CertificationEvidence = Readonly<{ evidence_id: string; artifact_id: string; evidence_type: CertificationEvidenceType; source_phase: string; source_record: string; validation_status: CertificationValidationStatus; verification_timestamp: string; lineage_refs: readonly string[]; integrity_hash: string }>;
export type CertificationEvaluation = Readonly<{ evaluation_id: string; evidence_completeness: boolean; evidence_freshness: boolean; constitutional_validity: boolean; governance_compliance: boolean; trust_consistency: boolean; deterministic_replay: boolean; operational_readiness: boolean; safety_qualification: boolean; alignment_verification: boolean; findings: readonly string[]; integrity_hash: string }>;
export type TrustAttestation = Readonly<{ attestation_id: string; trust_integrity: boolean; trust_validity: boolean; governance_compliance: boolean; operational_readiness: boolean; evidence_completeness: boolean; reproducible: boolean; signature_hash: string; integrity_hash: string }>;
export type TrustCertificate = Readonly<{ certificate_id: string; trust_artifact_id: string; trust_domain: string; certification_scope: string; certification_status: TrustCertificationStatus; certification_decision: TrustCertificationDecision; evidence_refs: readonly string[]; governance_refs: readonly string[]; alignment_refs: readonly string[]; safety_refs: readonly string[]; replay_refs: readonly string[]; issue_timestamp: string; expiration_timestamp: string; issuing_authority: string; integrity_hash: string }>;
export type CertificationLifecycleRecord = Readonly<{ lifecycle_id: string; issuance: boolean; renewal: boolean; suspension: boolean; revocation: boolean; expiration: boolean; restoration: boolean; current_status: TrustCertificationStatus; integrity_hash: string }>;
export type CertificationGovernanceReport = Readonly<{ governance_id: string; approval_authority: string; operator_oversight: boolean; governance_review: boolean; constitutional_review: boolean; certification_authorization: boolean; integrity_hash: string }>;
export type CertificationReplayAudit = Readonly<{ replay_id: string; deterministic_replay: boolean; evidence_reconstruction: boolean; audit_validation: boolean; historical_analysis: boolean; replay_refs: readonly string[]; audit_refs: readonly string[]; integrity_hash: string }>;
export type CertificationObservability = Readonly<{ dashboard_id: string; certification_dashboard: boolean; certificate_health: boolean; expiration_tracking: boolean; renewal_tracking: boolean; suspension_tracking: boolean; evidence_freshness: boolean; integrity_hash: string }>;
export type CertificationRegistry = Readonly<{ registry_id: string; trust_certificates: readonly string[]; certification_reports: readonly string[]; evidence_references: readonly string[]; lifecycle_status: TrustCertificationStatus; historical_versions: readonly string[]; operational: boolean; integrity_hash: string }>;
export type CertificationReport = Readonly<{ report_id: string; certification_scope: string; findings: readonly string[]; evidence_summary: string; governance_summary: string; safety_summary: string; replay_summary: string; certification_decision: TrustCertificationDecision; integrity_hash: string }>;
export type CertificationBoundary = Readonly<{ boundary_id: string; program_qualification_executed: boolean; trust_evaluation_executed: boolean; alignment_verification_executed: boolean; compliance_evaluation_executed: boolean; safety_qualification_executed: boolean; operational_monitoring_executed: boolean; trust_recovery_executed: boolean; integrity_hash: string }>;
export type TrustCertificationReadiness = Readonly<{ certification_id: string; outcome: TrustCertificationOutcome; phase_ready: boolean; architecture_complete: boolean; lifecycle_implemented: boolean; certificates_deterministic: boolean; evidence_immutable_traceable: boolean; attestations_reproducible: boolean; replay_reconstructs_decisions: boolean; governance_approval_enforced: boolean; safety_qualification_validated: boolean; constitutional_compliance_verified: boolean; registry_operational: boolean; observability_complete: boolean; reports_generated: boolean; not_program_qualification: boolean; failures: readonly TrustCertificationFailure[]; integrity_hash: string }>;
export type TrustCertificationResult = Readonly<{ phase_version: "trust-certification/v5.16"; phase_identifier: "TrustCertification"; recovery_ref: "trust-recovery-revocation/v5.15"; foundation: CertificationFoundation; scope: CertificationScopeRegistry; evidence: readonly CertificationEvidence[]; evaluation: CertificationEvaluation; attestation: TrustAttestation; certificate: TrustCertificate; lifecycle: CertificationLifecycleRecord; governance: CertificationGovernanceReport; replay: CertificationReplayAudit; observability: CertificationObservability; registry: CertificationRegistry; report: CertificationReport; boundary: CertificationBoundary; certification: TrustCertificationReadiness; replay_hash: string; integrity_hash: string }>;
export type TrustCertificationValidation = Readonly<{ valid: boolean; outcome: TrustCertificationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; foundation_valid: boolean; scope_valid: boolean; evidence_valid: boolean; evaluation_valid: boolean; attestation_valid: boolean; certificate_valid: boolean; lifecycle_valid: boolean; governance_valid: boolean; replay_valid: boolean; observability_valid: boolean; registry_valid: boolean; report_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustCertificationFailure[]; integrity_hash: string }>;
export type TrustCertificationBundle = Readonly<{ doctrine: Readonly<{ version: "trust-certification/v5.16"; owns_trust_certification: true; owns_certification_lifecycle: true; owns_trust_attestation: true; owns_certification_evidence: true; performs_program_qualification: false; evaluates_trust: false; verifies_alignment: false; evaluates_compliance: false; qualifies_safety: false; monitors_operations: false; recovers_trust: false }>; result: TrustCertificationResult; validation: TrustCertificationValidation }>;
