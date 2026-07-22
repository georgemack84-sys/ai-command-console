export type ProgramQualificationState =
  | "QUALIFICATION_REQUESTED"
  | "DEPENDENCY_VALIDATION"
  | "CONSTITUTION_REVIEW"
  | "ARCHITECTURE_REVIEW"
  | "GOVERNANCE_REVIEW"
  | "AUTHORITY_REVIEW"
  | "POLICY_REVIEW"
  | "SAFETY_REVIEW"
  | "REPLAY_REVIEW"
  | "EVIDENCE_REVIEW"
  | "OPERATIONAL_READINESS"
  | "CONSUMER_READINESS"
  | "PLATFORM_MATURITY_ASSESSMENT"
  | "QUALIFICATION_DECISION"
  | "SUBMITTED_TO_P3_15_CERTIFICATION";

export type ProgramQualificationDecisionType = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED";
export type ProgramQualificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "PRUNED";
export type ProgramQualificationCheckResult = "PASS" | "FAIL";

export type ProgramQualificationFailure =
  | "P3_11_REPLAY_EVIDENCE_INVALID"
  | "P3_13_OPERATIONAL_EVIDENCE_INVALID"
  | "P3_14_ASSURANCE_REPORT_INVALID"
  | "P3_15_CERTIFICATION_REQUIREMENTS_INVALID"
  | "P3_16_INTERFACE_QUALIFICATION_INVALID"
  | "P3_17_MIGRATION_READINESS_INVALID"
  | "CCI_CONSTITUTIONAL_CONTRACTS_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "ARCHITECTURE_INCOMPLETE"
  | "GOVERNANCE_IMPLEMENTATION_FAILED"
  | "AUTHORITY_ENFORCEMENT_FAILED"
  | "POLICY_ENFORCEMENT_FAILED"
  | "SAFETY_ENFORCEMENT_FAILED"
  | "REPLAY_EVIDENCE_NOT_CONSUMED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_MUTABLE"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "INTEROPERABILITY_FAILED"
  | "OPERATIONAL_READINESS_FAILED"
  | "CONSUMER_READINESS_FAILED"
  | "MATURITY_THRESHOLD_NOT_MET"
  | "QUALIFICATION_REPORT_MISSING"
  | "QUALIFICATION_DECISION_MISSING"
  | "PLATFORM_CERTIFICATION_DUPLICATED"
  | "PRODUCTION_DEPLOYMENT_ATTEMPTED"
  | "MIGRATION_EXECUTION_ATTEMPTED"
  | "ASSURANCE_AGGREGATION_DUPLICATED"
  | "CERTIFICATION_PRUNED";

export type ProgramQualificationScenario = "BASELINE" | ProgramQualificationFailure | "CONDITIONAL_DEFICIENCIES_ACCEPTED";
export type ProgramQualificationInput = Readonly<{ scenario?: ProgramQualificationScenario; tenant_id?: string }>;

export type QualificationFramework = Readonly<{
  framework_id: string;
  lifecycle: readonly ProgramQualificationState[];
  dependency_refs: readonly string[];
  evaluation_schedule: readonly string[];
  certification_submission_target: "P3.15 Platform Certification";
  deterministic: boolean;
  integrity_hash: string;
}>;

export type QualificationReview = Readonly<{
  review_id: string;
  scope: string;
  checks: readonly string[];
  evidence_refs: readonly string[];
  result: ProgramQualificationCheckResult;
  integrity_hash: string;
}>;

export type ReadinessQualification = Readonly<{
  readiness_id: string;
  operational_ready: boolean;
  deployment_ready: boolean;
  observability_ready: boolean;
  incident_ready: boolean;
  sdk_ready: boolean;
  interface_ready: boolean;
  migration_ready: boolean;
  adoption_ready: boolean;
  result: ProgramQualificationCheckResult;
  integrity_hash: string;
}>;

export type PlatformMaturityAssessment = Readonly<{
  assessment_id: string;
  feature_completeness: number;
  governance_maturity: number;
  operational_maturity: number;
  ecosystem_readiness: number;
  maturity_score: number;
  threshold: number;
  result: ProgramQualificationCheckResult;
  integrity_hash: string;
}>;

export type QualificationEvidenceLedger = Readonly<{
  ledger_id: string;
  assurance_report_refs: readonly string[];
  qualification_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  operational_evidence_refs: readonly string[];
  interface_report_refs: readonly string[];
  migration_readiness_refs: readonly string[];
  cci_contract_refs: readonly string[];
  audit_refs: readonly string[];
  lineage_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  replay_consumed_not_executed: boolean;
  integrity_hash: string;
}>;

export type ProgramQualificationReport = Readonly<{
  report_id: string;
  constitutional_summary: string;
  architecture_summary: string;
  governance_summary: string;
  readiness_summary: string;
  maturity_summary: string;
  recommendation: ProgramQualificationDecisionType;
  generated: boolean;
  integrity_hash: string;
}>;

export type ProgramQualificationDecision = Readonly<{
  decision_id: string;
  decision: ProgramQualificationDecisionType;
  outcome: ProgramQualificationOutcome;
  accepted_conditions: readonly string[];
  certification_submission_ref: string;
  certification_authority_retained_by_p3_15: boolean;
  evidence_driven: boolean;
  deterministic: boolean;
  failures: readonly ProgramQualificationFailure[];
  integrity_hash: string;
}>;

export type ProgramQualificationResult = Readonly<{
  phase_version: "caf-program-qualification/v3.18";
  phase_identifier: "CafProgramQualification";
  replay_evidence_ref: "caf-behavioral-replay-divergence/v3.11";
  operational_evidence_ref: "caf-operations-incident-governance/v3.13";
  platform_assurance_ref: "caf-platform-assurance/v3.14";
  platform_certification_requirements_ref: "caf-platform-certification/v3.15";
  interface_qualification_ref: "caf-sdk-interface-qualification/v3.16";
  migration_readiness_ref: "caf-consumer-adoption-migration/v3.17";
  framework: QualificationFramework;
  constitutional_review: QualificationReview;
  architecture_review: QualificationReview;
  governance_review: QualificationReview;
  authority_review: QualificationReview;
  policy_review: QualificationReview;
  safety_review: QualificationReview;
  replay_review: QualificationReview;
  evidence_review: QualificationReview;
  interoperability_review: QualificationReview;
  readiness: ReadinessQualification;
  maturity: PlatformMaturityAssessment;
  evidence_ledger: QualificationEvidenceLedger;
  report: ProgramQualificationReport;
  decision: ProgramQualificationDecision;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProgramQualificationValidation = Readonly<{
  valid: boolean;
  outcome: ProgramQualificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  framework_valid: boolean;
  constitutional_valid: boolean;
  architecture_valid: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  policy_valid: boolean;
  safety_valid: boolean;
  replay_review_valid: boolean;
  evidence_valid: boolean;
  interoperability_valid: boolean;
  readiness_valid: boolean;
  maturity_valid: boolean;
  report_valid: boolean;
  decision_valid: boolean;
  failures: readonly ProgramQualificationFailure[];
  integrity_hash: string;
}>;

export type ProgramQualificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-program-qualification/v3.18";
    owns_constitutional_qualification: true;
    owns_architectural_qualification: true;
    owns_governance_qualification: true;
    owns_authority_qualification: true;
    owns_policy_qualification: true;
    owns_safety_qualification: true;
    owns_replay_qualification: true;
    owns_evidence_qualification: true;
    owns_interoperability_qualification: true;
    owns_operational_readiness: true;
    owns_consumer_readiness: true;
    owns_platform_maturity_assessment: true;
    owns_platform_certification: false;
    owns_certification_issuance: false;
    owns_production_deployment: false;
    owns_migration_execution: false;
    owns_replay_execution: false;
    owns_assurance_aggregation: false;
  }>;
  result: ProgramQualificationResult;
  validation: ProgramQualificationValidation;
}>;
