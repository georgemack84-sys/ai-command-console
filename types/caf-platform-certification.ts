export type PlatformCertificationOutcome = "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "NOT_CERTIFIED";
export type CertificationGateOutcome = "PASS" | "FAIL" | "PRUNED";
export type CertificationLifecycleState = "DRAFT" | "PENDING" | "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "SUPERSEDED" | "RETIRED";

export type PlatformCertificationFailure =
  | "P3_14_ASSURANCE_INVALID"
  | "ASSURANCE_AGGREGATION_DUPLICATED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "REPLAY_VERIFICATION_DUPLICATED"
  | "ELIGIBILITY_NOT_VERIFIED"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "CERTIFICATION_EVIDENCE_MUTABLE"
  | "CERTIFICATION_DECISION_NOT_GOVERNED"
  | "GOVERNANCE_APPROVAL_ABSENT"
  | "PLATFORM_CERTIFICATE_NOT_ISSUED"
  | "CERTIFICATE_INTEGRITY_INVALID"
  | "CERTIFICATION_LEDGER_FAILURE"
  | "LIFECYCLE_NON_DETERMINISTIC"
  | "AUDIT_LINEAGE_INCOMPLETE"
  | "CERTIFICATION_API_UNAVAILABLE"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNRESOLVED_ASSURANCE_FAILURE"
  | "DEPENDENCY_VERIFICATION_FAILURE"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "UNRESOLVED_SAFETY_VIOLATION"
  | "UNRESOLVED_AUTHORITY_VIOLATION"
  | "UNRESOLVED_POLICY_VIOLATION"
  | "CERTIFICATION_DECISION_NOT_TRACEABLE"
  | "OUTCOME_FAMILY_RECONCILIATION_PENDING"
  | "CERTIFICATION_PRUNED";

export type PlatformCertificationScenario = "BASELINE" | PlatformCertificationFailure;
export type PlatformCertificationInput = Readonly<{ scenario?: PlatformCertificationScenario; tenant_id?: string }>;

export type CertificationEligibility = Readonly<{
  eligibility_id: string;
  readiness_report_ref: string;
  prerequisites_satisfied: boolean;
  assurance_evidence_present: boolean;
  dependency_validation_ref: string;
  eligible: boolean;
  integrity_hash: string;
}>;

export type CertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  qualification_evidence_ref: string;
  assurance_report_refs: readonly string[];
  governance_evidence_refs: readonly string[];
  operational_evidence_refs: readonly string[];
  safety_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CertificationDecisionRecord = Readonly<{
  decision_id: string;
  assurance_decision_ref: string;
  certification_authority: string;
  outcome: PlatformCertificationOutcome;
  governed: boolean;
  traceable: boolean;
  blocking_findings: readonly string[];
  generated_timestamp: string;
  integrity_hash: string;
}>;

export type PlatformCertificate = Readonly<{
  certificate_id: string;
  certificate_version: string;
  platform_ref: "Civitas Agent Framework";
  outcome: PlatformCertificationOutcome;
  issued_at: string;
  valid_until: string;
  evidence_package_ref: string;
  decision_ref: string;
  integrity_verified: boolean;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type CertificationLedger = Readonly<{
  ledger_id: string;
  certificate_refs: readonly string[];
  decision_refs: readonly string[];
  lifecycle_refs: readonly string[];
  audit_refs: readonly string[];
  immutable: boolean;
  complete_history_preserved: boolean;
  integrity_hash: string;
}>;

export type CertificationLifecycle = Readonly<{
  lifecycle_id: string;
  states: readonly CertificationLifecycleState[];
  current_state: CertificationLifecycleState;
  transitions_governed: boolean;
  deterministic: boolean;
  lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type CertificationGovernance = Readonly<{
  governance_id: string;
  approval_refs: readonly string[];
  authority_ref: string;
  exception_governance_ref: string;
  review_ref: string;
  approvals_complete: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type CertificationObservability = Readonly<{
  observability_id: string;
  metrics: readonly string[];
  dashboard_ref: string;
  alert_refs: readonly string[];
  operational: boolean;
  integrity_hash: string;
}>;

export type CertificationAuditLineage = Readonly<{
  audit_id: string;
  audit_report_ref: string;
  lineage_graph_ref: string;
  certificate_traceable: boolean;
  evidence_traceable: boolean;
  immutable_audit_chain: boolean;
  integrity_hash: string;
}>;

export type CertificationConsumerAccess = Readonly<{
  api_id: string;
  certificate_retrieval_available: boolean;
  verification_service_available: boolean;
  status_publication_available: boolean;
  deterministic_verification: boolean;
  integrity_hash: string;
}>;

export type PlatformCertificationGate = Readonly<{
  gate_id: string;
  constitutional_compliance: boolean;
  architectural_completeness: boolean;
  authority_enforcement: boolean;
  policy_enforcement: boolean;
  safety_enforcement: boolean;
  replay_evidence_complete_via_p3_14: boolean;
  evidence_integrity: boolean;
  dependency_integrity: boolean;
  operational_readiness: boolean;
  interoperability: boolean;
  lineage_complete: boolean;
  outcome_family_reconciled: boolean;
  gate_outcome: CertificationGateOutcome;
  failures: readonly PlatformCertificationFailure[];
  integrity_hash: string;
}>;

export type PlatformCertificationResult = Readonly<{
  phase_version: "caf-platform-certification/v3.15";
  phase_identifier: "CafPlatformCertification";
  platform_assurance_ref: "caf-platform-assurance/v3.14";
  cci_certification_services_ref: "Program 2 - CCI Certification Services";
  cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure";
  cci_audit_ref: "Program 2 - CCI Audit Infrastructure";
  cci_registry_ref: "Program 2 - CCI Registry Services";
  eligibility: CertificationEligibility;
  evidence_package: CertificationEvidencePackage;
  decision: CertificationDecisionRecord;
  certificate: PlatformCertificate;
  ledger: CertificationLedger;
  lifecycle: CertificationLifecycle;
  governance: CertificationGovernance;
  observability: CertificationObservability;
  audit_lineage: CertificationAuditLineage;
  consumer_access: CertificationConsumerAccess;
  certification_gate: PlatformCertificationGate;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PlatformCertificationValidation = Readonly<{
  valid: boolean;
  gate_outcome: CertificationGateOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  eligibility_valid: boolean;
  evidence_valid: boolean;
  decision_valid: boolean;
  certificate_valid: boolean;
  ledger_valid: boolean;
  lifecycle_valid: boolean;
  governance_valid: boolean;
  audit_valid: boolean;
  api_valid: boolean;
  gate_valid: boolean;
  failures: readonly PlatformCertificationFailure[];
  integrity_hash: string;
}>;

export type PlatformCertificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-platform-certification/v3.15";
    owns_certification_execution: true;
    owns_certification_governance: true;
    owns_certification_lifecycle: true;
    owns_certification_evidence: true;
    consumes_platform_assurance: true;
    executes_replay: false;
    duplicates_platform_assurance: false;
    verifies_replay_independently: false;
    certifies_platform: true;
  }>;
  result: PlatformCertificationResult;
  validation: PlatformCertificationValidation;
}>;
