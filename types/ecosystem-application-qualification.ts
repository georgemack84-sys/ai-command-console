export type EcosystemQualificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type EcosystemQualificationDecision = "QUALIFIED" | "QUALIFIED_WITH_CONDITIONS" | "NOT_QUALIFIED" | "REQUIRES_MORE_EVIDENCE" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_REVIEW";

export type EcosystemApplicationQualificationFailure =
  | "P4_20_PORTFOLIO_GOVERNANCE_INVALID"
  | "P4_5_CERTIFICATES_INVALID"
  | "PROGRAM_1_ASSURANCE_INVALID"
  | "PROGRAM_2_ASSURANCE_INVALID"
  | "PROGRAM_3_ASSURANCE_INVALID"
  | "QUALIFICATION_RECORD_MISSING"
  | "ARCHITECTURE_ASSESSMENT_MISSING"
  | "ARCHITECTURE_INCOMPLETE"
  | "DEPENDENCY_GRAPH_INVALID"
  | "COMPOSITION_INVALID"
  | "DEPLOYMENT_ARCHITECTURE_INVALID"
  | "GOVERNANCE_ASSESSMENT_MISSING"
  | "GOVERNANCE_COMPLIANCE_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "AUTHORITY_ENFORCEMENT_INVALID"
  | "POLICY_ENFORCEMENT_INVALID"
  | "INTEROPERABILITY_ASSESSMENT_MISSING"
  | "FEDERATION_CONTRACTS_INVALID"
  | "WORKFLOW_INTEGRATION_INVALID"
  | "INTERFACE_COMPATIBILITY_INVALID"
  | "ORCHESTRATION_INTEGRITY_INVALID"
  | "OPERATIONAL_ASSESSMENT_MISSING"
  | "OPERATIONAL_READINESS_INVALID"
  | "DIAGNOSTICS_INVALID"
  | "OBSERVABILITY_INVALID"
  | "OPERATIONAL_RESILIENCE_INVALID"
  | "REPLAY_ASSESSMENT_MISSING"
  | "REPLAY_EVIDENCE_INCOMPLETE"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "REPLAY_TRACEABILITY_INVALID"
  | "ASSURANCE_ASSESSMENT_MISSING"
  | "ASSURANCE_EVIDENCE_INCOMPLETE"
  | "CERTIFICATE_VERIFICATION_MISSING"
  | "CERTIFICATE_LINEAGE_INVALID"
  | "CERTIFICATE_STATUS_INVALID"
  | "CERTIFICATE_DEPENDENCY_INVALID"
  | "EVIDENCE_ASSESSMENT_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "PROVENANCE_INTEGRITY_INVALID"
  | "EVIDENCE_LINEAGE_INVALID"
  | "AUDIT_INCOMPLETE"
  | "CONSUMER_READINESS_MISSING"
  | "ECOSYSTEM_USABILITY_INVALID"
  | "DEPLOYMENT_READINESS_INVALID"
  | "DOCUMENTATION_INCOMPLETE"
  | "QUALIFICATION_REPORT_MISSING"
  | "LEDGER_ENTRY_MISSING"
  | "LEDGER_IMMUTABILITY_INVALID"
  | "QUALIFICATION_DECISION_MISSING"
  | "INDIVIDUAL_APPLICATION_CERTIFICATION_ATTEMPTED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "INTEROPERABILITY_TEST_EXECUTION_ATTEMPTED"
  | "OPERATIONAL_MONITORING_ATTEMPTED"
  | "GOVERNANCE_AGGREGATION_ATTEMPTED"
  | "APPLICATION_CERTIFICATE_MODIFICATION_ATTEMPTED"
  | "PROGRAM_ASSURANCE_OVERRIDE_ATTEMPTED"
  | "CERTIFICATION_PRUNED";

export type EcosystemApplicationQualificationScenario = "BASELINE" | EcosystemApplicationQualificationFailure;
export type EcosystemApplicationQualificationInput = Readonly<{ scenario?: EcosystemApplicationQualificationScenario; qualification_id?: string; tenant_id?: string }>;

export type EcosystemQualificationRecord = Readonly<{
  record_id: string;
  qualification_id: string;
  tenant_id: string;
  ecosystem_version: "program-4/v4.21";
  qualification_scope: "Integrated Program 4 Application Ecosystem";
  participating_applications: readonly string[];
  consumed_application_certificates: readonly string[];
  governance_report_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  interoperability_evidence_refs: readonly string[];
  operational_evidence_refs: readonly string[];
  assurance_evidence_refs: readonly string[];
  assessment_results: readonly string[];
  qualification_result: EcosystemQualificationDecision;
  qualification_timestamp: "2026-07-18T00:00:00.000Z";
  evaluator: "P4.21 Ecosystem Application Qualification";
  evidence_hash: string;
  operational: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type EcosystemQualificationAssessment = Readonly<{ assessment_id: string; domain: string; evidence_refs: readonly string[]; valid: boolean; findings: readonly string[]; integrity_hash: string }>;
export type EcosystemQualificationReport = Readonly<{ report_id: string; executive_summary: string; architectural_findings: readonly string[]; governance_findings: readonly string[]; interoperability_findings: readonly string[]; operational_findings: readonly string[]; replay_findings: readonly string[]; assurance_findings: readonly string[]; evidence_findings: readonly string[]; readiness_findings: readonly string[]; qualification_conclusion: EcosystemQualificationDecision; reproducible: boolean; integrity_hash: string }>;
export type EcosystemQualificationEvidenceLedgerEntry = Readonly<{ ledger_entry_id: string; qualification_id: string; evidence_references: readonly string[]; lineage: readonly string[]; immutable_hash: string; timestamp: "2026-07-18T00:00:00.000Z"; immutable: boolean; integrity_hash: string }>;
export type EcosystemQualificationBoundary = Readonly<{ certifies_individual_applications: boolean; executes_replay: boolean; executes_interoperability_testing: boolean; performs_operational_monitoring: boolean; performs_governance_aggregation: boolean; modifies_application_certificates: boolean; overrides_program_assurance: boolean; integrity_hash: string }>;

export type EcosystemApplicationQualificationCertification = Readonly<{ certification_id: string; outcome: EcosystemQualificationOutcome; phase_ready: boolean; architecture_qualified: boolean; governance_qualified: boolean; interoperability_qualified: boolean; operations_qualified: boolean; replay_qualified: boolean; assurance_qualified: boolean; certificates_verified: boolean; evidence_qualified: boolean; consumer_ready: boolean; report_generated: boolean; ledger_recorded: boolean; decision_issued: boolean; no_out_of_scope_execution: boolean; failures: readonly EcosystemApplicationQualificationFailure[]; integrity_hash: string }>;

export type EcosystemApplicationQualificationResult = Readonly<{ phase_version: "ecosystem-application-qualification/v4.21"; phase_identifier: "EcosystemApplicationQualification"; portfolio_governance_ref: "ecosystem-portfolio-governance/v4.20"; record: EcosystemQualificationRecord; architecture: EcosystemQualificationAssessment; governance: EcosystemQualificationAssessment; interoperability: EcosystemQualificationAssessment; operations: EcosystemQualificationAssessment; replay: EcosystemQualificationAssessment; assurance: EcosystemQualificationAssessment; certificates: EcosystemQualificationAssessment; evidence: EcosystemQualificationAssessment; readiness: EcosystemQualificationAssessment; report: EcosystemQualificationReport; ledger: EcosystemQualificationEvidenceLedgerEntry; boundary: EcosystemQualificationBoundary; certification: EcosystemApplicationQualificationCertification; replay_hash: string; integrity_hash: string }>;

export type EcosystemApplicationQualificationValidation = Readonly<{ valid: boolean; outcome: EcosystemQualificationOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; record_valid: boolean; architecture_valid: boolean; governance_valid: boolean; interoperability_valid: boolean; operations_valid: boolean; replay_valid: boolean; assurance_valid: boolean; certificates_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; report_valid: boolean; ledger_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly EcosystemApplicationQualificationFailure[]; integrity_hash: string }>;

export type EcosystemApplicationQualificationBundle = Readonly<{ doctrine: Readonly<{ version: "ecosystem-application-qualification/v4.21"; owns_ecosystem_qualification: true; owns_ecosystem_readiness_assessment: true; owns_qualification_evidence_production: true; owns_qualification_decision_issuance: true; certifies_individual_applications: false; executes_replay: false; executes_interoperability_testing: false; performs_operational_monitoring: false; performs_governance_aggregation: false; modifies_application_certificates: false }>; result: EcosystemApplicationQualificationResult; validation: EcosystemApplicationQualificationValidation }>;
