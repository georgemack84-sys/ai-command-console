export type ApplicationLifecycleState = "REGISTERED" | "DEVELOPMENT" | "VALIDATION" | "CERTIFICATION" | "ACTIVE" | "SUSPENDED" | "RETIRED" | "ARCHIVED";
export type ApplicationCertificationStatus = "NOT_CERTIFIED" | "CERTIFICATION_IN_PROGRESS" | "CERTIFIED" | "CERTIFICATION_SUSPENDED" | "CERTIFICATION_REVOKED" | "CERTIFICATION_EXPIRED";
export type ApplicationLifecycleCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type ApplicationLifecycleCertificationCheckResult = "PASS" | "FAIL";

export type ApplicationLifecycleCertificationFailure =
  | "P4_4_IDENTITY_INVALID"
  | "CCI_LIFECYCLE_SERVICES_INVALID"
  | "CCI_CERTIFICATION_INFRASTRUCTURE_INVALID"
  | "TQF_TENANT_CONTRACT_INVALID"
  | "LIFECYCLE_MODEL_INCOMPLETE"
  | "MULTIPLE_LIFECYCLES_DETECTED"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "LIFECYCLE_TRANSITION_NON_DETERMINISTIC"
  | "VERSION_LINEAGE_INCOMPLETE"
  | "VERSION_LINEAGE_MUTABLE"
  | "CERTIFICATION_FRAMEWORK_MISSING"
  | "CERTIFICATION_EXECUTION_FAILED"
  | "CERTIFICATION_PREREQUISITES_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_VALIDATED"
  | "DEPENDENCY_VERIFICATION_FAILED"
  | "POLICY_VALIDATION_FAILED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "TENANT_CONTRACT_COMPATIBILITY_FAILED"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_EVIDENCE_MUTABLE"
  | "CERTIFICATION_DECISION_NOT_AUDITABLE"
  | "CERTIFICATE_NOT_GENERATED"
  | "CERTIFICATION_STATUS_REGISTRY_INVALID"
  | "CERTIFICATION_RENEWAL_UNSUPPORTED"
  | "CERTIFICATION_SUSPENSION_UNSUPPORTED"
  | "CERTIFICATION_REVOCATION_UNSUPPORTED"
  | "CERTIFICATION_EXPIRATION_UNSUPPORTED"
  | "REVOCATION_DOES_NOT_INVALIDATE_PRODUCTION"
  | "EXPIRED_CERTIFICATION_REQUALIFICATION_MISSING"
  | "CERTIFICATION_ACTION_LEDGER_INCOMPLETE"
  | "LIFECYCLE_TRANSITION_LEDGER_INCOMPLETE"
  | "CERTIFICATION_PRUNED";

export type ApplicationLifecycleCertificationScenario = "BASELINE" | ApplicationLifecycleCertificationFailure;
export type ApplicationLifecycleCertificationInput = Readonly<{ scenario?: ApplicationLifecycleCertificationScenario; tenant_id?: string }>;

export type ApplicationLifecycleRecord = Readonly<{
  application_id: string;
  application_version: string;
  tenant_scope: string;
  namespace_id: string;
  lifecycle_state: ApplicationLifecycleState;
  activation_timestamp: string;
  suspension_timestamp: string;
  retirement_timestamp: string;
  restoration_timestamp: string;
  archive_timestamp: string;
  current_version: string;
  previous_version: string;
  lineage_refs: readonly string[];
  owner_refs: readonly string[];
  deterministic_transitions: boolean;
  single_governed_lifecycle: boolean;
  integrity_hash: string;
}>;

export type ApplicationVersionLineage = Readonly<{
  lineage_id: string;
  application_id: string;
  current_version: string;
  previous_versions: readonly string[];
  release_lineage_refs: readonly string[];
  dependency_lineage_refs: readonly string[];
  supersession_refs: readonly string[];
  rollback_lineage_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type CertificationFramework = Readonly<{
  framework_id: string;
  certification_contract_refs: readonly string[];
  qualification_model_ref: string;
  prerequisite_refs: readonly string[];
  workflow_states: readonly ApplicationCertificationStatus[];
  implemented: boolean;
  prerequisites_complete: boolean;
  integrity_hash: string;
}>;

export type CertificationExecution = Readonly<{
  execution_id: string;
  orchestration_ref: string;
  evidence_collection_complete: boolean;
  dependency_verification_passed: boolean;
  policy_validation_passed: boolean;
  governance_validation_passed: boolean;
  tenant_contract_verification_passed: boolean;
  constitutional_compliance_validated: boolean;
  result: ApplicationLifecycleCertificationCheckResult;
  integrity_hash: string;
}>;

export type ApplicationCertificationEvidence = Readonly<{
  evidence_id: string;
  application_id: string;
  application_version: string;
  evidence_type: "APPLICATION_CERTIFICATION";
  verification_results: readonly string[];
  dependency_refs: readonly string[];
  policy_refs: readonly string[];
  governance_refs: readonly string[];
  tenant_contract_refs: readonly string[];
  lineage_refs: readonly string[];
  timestamp: string;
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationCertificate = Readonly<{
  certificate_id: string;
  application_id: string;
  application_version: string;
  qualification_scope: string;
  qualification_timestamp: string;
  qualified_by: string;
  tenant_scope: string;
  certificate_status: ApplicationCertificationStatus;
  expiration_date: string;
  evidence_refs: readonly string[];
  production_eligible: boolean;
  integrity_hash: string;
}>;

export type CertificationGovernance = Readonly<{
  governance_id: string;
  approval_supported: boolean;
  suspension_supported: boolean;
  renewal_supported: boolean;
  revocation_supported: boolean;
  expiration_supported: boolean;
  revocation_invalidates_production: boolean;
  expired_requires_requalification: boolean;
  decision_auditable: boolean;
  integrity_hash: string;
}>;

export type TenantQualificationCompatibility = Readonly<{
  report_id: string;
  tenant_contract_validated: boolean;
  namespace_verified: boolean;
  ownership_verified: boolean;
  dependency_verified: boolean;
  application_eligible: boolean;
  result: ApplicationLifecycleCertificationCheckResult;
  integrity_hash: string;
}>;

export type CertificationStatusRegistry = Readonly<{
  registry_id: string;
  application_id: string;
  current_status: ApplicationCertificationStatus;
  effective_date: string;
  expiration_date: string;
  certificate_refs: readonly string[];
  reason: string;
  last_review: string;
  transition_rules: readonly string[];
  lifecycle_synchronized: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type CertificationLedgers = Readonly<{
  certification_ledger_id: string;
  lifecycle_transition_ledger_id: string;
  certification_action_refs: readonly string[];
  lifecycle_transition_refs: readonly string[];
  audit_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ApplicationLifecycleCertification = Readonly<{
  certification_id: string;
  outcome: ApplicationLifecycleCertificationOutcome;
  phase_ready: boolean;
  lifecycle_governed: boolean;
  transitions_deterministic: boolean;
  version_lineage_operational: boolean;
  certification_framework_implemented: boolean;
  certification_execution_operational: boolean;
  certification_governance_enforced: boolean;
  evidence_immutable: boolean;
  status_registry_operational: boolean;
  tenant_contract_validation_integrated: boolean;
  certificate_generated: boolean;
  renewal_suspension_revocation_expiration_supported: boolean;
  traceable_immutable_ledgers: boolean;
  failures: readonly ApplicationLifecycleCertificationFailure[];
  integrity_hash: string;
}>;

export type ApplicationLifecycleCertificationResult = Readonly<{
  phase_version: "application-lifecycle-certification/v4.5";
  phase_identifier: "ApplicationLifecycleCertification";
  application_identity_ref: "application-identity-tenancy-namespace/v4.4";
  cci_lifecycle_services_ref: "Program 2 - CCI Lifecycle Services";
  cci_certification_infrastructure_ref: "Program 2 - CCI Certification Infrastructure";
  tqf_tenant_contracts_ref: "Program 1 - Tenant Qualification Framework";
  lifecycle_model: readonly ApplicationLifecycleState[];
  lifecycle_record: ApplicationLifecycleRecord;
  version_lineage: ApplicationVersionLineage;
  certification_framework: CertificationFramework;
  certification_execution: CertificationExecution;
  certification_evidence: ApplicationCertificationEvidence;
  certificate: ApplicationCertificate;
  certification_governance: CertificationGovernance;
  tenant_qualification: TenantQualificationCompatibility;
  status_registry: CertificationStatusRegistry;
  ledgers: CertificationLedgers;
  certification: ApplicationLifecycleCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ApplicationLifecycleCertificationValidation = Readonly<{
  valid: boolean;
  outcome: ApplicationLifecycleCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  lifecycle_valid: boolean;
  lineage_valid: boolean;
  framework_valid: boolean;
  execution_valid: boolean;
  evidence_valid: boolean;
  certificate_valid: boolean;
  governance_valid: boolean;
  tenant_valid: boolean;
  status_valid: boolean;
  ledgers_valid: boolean;
  certification_valid: boolean;
  failures: readonly ApplicationLifecycleCertificationFailure[];
  integrity_hash: string;
}>;

export type ApplicationLifecycleCertificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "application-lifecycle-certification/v4.5";
    owns_application_lifecycle: true;
    owns_application_version_lineage: true;
    owns_lifecycle_governance: true;
    owns_certification_execution: true;
    owns_certification_governance: true;
    owns_certification_evidence: true;
    owns_certification_status_management: true;
    supports_renewal_suspension_revocation_expiration: true;
    production_requires_certification: true;
  }>;
  result: ApplicationLifecycleCertificationResult;
  validation: ApplicationLifecycleCertificationValidation;
}>;
