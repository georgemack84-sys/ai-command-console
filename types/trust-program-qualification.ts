export type TrustProgramQualificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type TrustProgramQualificationDecisionType = "QUALIFIED" | "QUALIFIED_WITH_LIMITATIONS" | "NOT_QUALIFIED";
export type TrustProgramQualificationReviewResult = "PASS" | "FAIL";
export type TrustProgramQualificationState =
  | "QUALIFICATION_REQUESTED"
  | "ARTIFACT_VALIDATION"
  | "REGISTRY_VALIDATION"
  | "CONTRACT_VALIDATION"
  | "LIFECYCLE_VALIDATION"
  | "DETERMINISTIC_REPLAY_VALIDATION"
  | "CROSS_PROGRAM_INTEGRATION_VALIDATION"
  | "OPERATIONAL_VALIDATION"
  | "CONSUMER_VALIDATION"
  | "ECOSYSTEM_MATURITY_ASSESSMENT"
  | "QUALIFICATION_DECISION_ISSUED";

export type TrustProgramQualificationFailure =
  | "P5_0_CONSTITUTIONAL_FOUNDATION_INVALID"
  | "P5_1_ARCHITECTURE_FOUNDATION_INVALID"
  | "P5_2_TRUST_DOMAIN_RESOLUTION_INVALID"
  | "P5_5_EVIDENCE_CONFIDENCE_INVALID"
  | "P5_6_RISK_GOVERNANCE_INVALID"
  | "P5_7_TRUST_DECISION_DETERMINISM_INVALID"
  | "P5_8_ALIGNMENT_VERIFICATION_INVALID"
  | "P5_9_COMPLIANCE_VERIFICATION_INVALID"
  | "P5_10_SAFETY_QUALIFICATION_INVALID"
  | "P5_11_EXPLAINABILITY_INVALID"
  | "P5_12_HUMAN_OVERSIGHT_INVALID"
  | "P5_13_CONTINUOUS_MONITORING_INVALID"
  | "P5_14_DRIFT_DETECTION_INVALID"
  | "P5_15_RECOVERY_REVOCATION_INVALID"
  | "P5_16_CERTIFICATION_INVALID"
  | "P5_17_ECOSYSTEM_FEDERATION_INVALID"
  | "CONSTITUTIONAL_VIOLATION"
  | "TRUST_DECISION_NONDETERMINISM"
  | "TRUST_DOMAIN_ISOLATION_FAILURE"
  | "TENANT_BOUNDARY_VIOLATION"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "AUTHORITY_VIOLATION"
  | "POLICY_VIOLATION"
  | "SAFETY_QUALIFICATION_FAILURE"
  | "TRUST_STANDING_INCONSISTENCY"
  | "CONFIDENCE_COMPUTATION_INCONSISTENCY"
  | "RISK_GOVERNANCE_FAILURE"
  | "MISSING_CERTIFICATION_EVIDENCE"
  | "FEDERATION_INTEROPERABILITY_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "HUMAN_OVERSIGHT_BYPASS"
  | "UNEXPLAINED_DRIFT"
  | "UNRESOLVED_REVOCATION_STATE"
  | "REGISTRY_INCONSISTENCY"
  | "OPERATIONAL_READINESS_FAILURE"
  | "CONSUMER_READINESS_FAILURE"
  | "ECOSYSTEM_MATURITY_EVIDENCE_INCOMPLETE"
  | "ARTIFACT_VALIDATION_FAILED"
  | "REGISTRY_VALIDATION_FAILED"
  | "CONTRACT_VALIDATION_FAILED"
  | "LIFECYCLE_VALIDATION_FAILED"
  | "CROSS_PROGRAM_INTEGRATION_FAILED"
  | "QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE"
  | "PROGRAM_QUALIFICATION_REPORT_MISSING"
  | "QUALIFICATION_DECISION_MISSING";

export type TrustProgramQualificationScenario =
  | "BASELINE"
  | "LIMITATIONS_ACCEPTED"
  | TrustProgramQualificationFailure;

export type TrustProgramQualificationInput = Readonly<{ scenario?: TrustProgramQualificationScenario }>;

export type TrustProgramQualificationReview = Readonly<{
  review_id: string;
  scope: string;
  source_phases: readonly string[];
  checks: readonly string[];
  evidence_refs: readonly string[];
  result: TrustProgramQualificationReviewResult;
  integrity_hash: string;
}>;

export type TrustProgramQualificationFramework = Readonly<{
  framework_id: string;
  lifecycle: readonly TrustProgramQualificationState[];
  qualification_scope_count: number;
  deterministic: boolean;
  certifies_program_not_artifacts: boolean;
  production_consumption_ready: boolean;
  integrity_hash: string;
}>;

export type TrustProgramReadiness = Readonly<{
  readiness_id: string;
  deployment_ready: boolean;
  governance_ready: boolean;
  monitoring_ready: boolean;
  recovery_ready: boolean;
  interoperability_ready: boolean;
  result: TrustProgramQualificationReviewResult;
  integrity_hash: string;
}>;

export type TrustProgramConsumerReadiness = Readonly<{
  consumer_id: string;
  program_2_ready: boolean;
  program_3_ready: boolean;
  program_4_ready: boolean;
  program_6_ready: boolean;
  ecosystem_applications_ready: boolean;
  result: TrustProgramQualificationReviewResult;
  integrity_hash: string;
}>;

export type TrustProgramMaturity = Readonly<{
  maturity_id: string;
  lifecycle_support: boolean;
  governance_maturity: boolean;
  operational_maturity: boolean;
  interoperability_maturity: boolean;
  production_readiness: boolean;
  maturity_score: number;
  threshold: number;
  result: TrustProgramQualificationReviewResult;
  integrity_hash: string;
}>;

export type TrustProgramQualificationLedger = Readonly<{
  ledger_id: string;
  artifact_refs: readonly string[];
  registry_refs: readonly string[];
  report_refs: readonly string[];
  decision_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  cross_program_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  replay_reconstructable: boolean;
  integrity_hash: string;
}>;

export type TrustProgramQualificationReport = Readonly<{
  report_id: string;
  constitutional_summary: string;
  deterministic_summary: string;
  evidence_summary: string;
  interoperability_summary: string;
  readiness_summary: string;
  maturity_summary: string;
  recommendation: TrustProgramQualificationDecisionType;
  generated: boolean;
  integrity_hash: string;
}>;

export type TrustProgramQualificationDecision = Readonly<{
  decision_id: string;
  decision: TrustProgramQualificationDecisionType;
  outcome: TrustProgramQualificationOutcome;
  accepted_limitations: readonly string[];
  constitutional_trust_authority: boolean;
  evidence_driven: boolean;
  deterministic: boolean;
  ecosystem_ready: boolean;
  failures: readonly TrustProgramQualificationFailure[];
  integrity_hash: string;
}>;

export type TrustProgramQualificationResult = Readonly<{
  phase_version: "trust-program-qualification/v5.18";
  phase_identifier: "TrustProgramQualification";
  certification_ref: "trust-certification/v5.16";
  federation_ref: "trust-ecosystem-federation/v5.17";
  framework: TrustProgramQualificationFramework;
  constitutional_compliance: TrustProgramQualificationReview;
  architecture_completeness: TrustProgramQualificationReview;
  deterministic_decision_production: TrustProgramQualificationReview;
  trust_domain_resolution: TrustProgramQualificationReview;
  evidence_integrity: TrustProgramQualificationReview;
  confidence_modeling: TrustProgramQualificationReview;
  risk_governance: TrustProgramQualificationReview;
  alignment_verification: TrustProgramQualificationReview;
  compliance_verification: TrustProgramQualificationReview;
  safety_qualification: TrustProgramQualificationReview;
  explainability: TrustProgramQualificationReview;
  human_oversight: TrustProgramQualificationReview;
  continuous_monitoring: TrustProgramQualificationReview;
  drift_detection: TrustProgramQualificationReview;
  recovery_revocation: TrustProgramQualificationReview;
  certification_governance: TrustProgramQualificationReview;
  ecosystem_federation: TrustProgramQualificationReview;
  deterministic_replay: TrustProgramQualificationReview;
  evidence_completeness: TrustProgramQualificationReview;
  operational_readiness: TrustProgramReadiness;
  consumer_readiness: TrustProgramConsumerReadiness;
  ecosystem_maturity: TrustProgramMaturity;
  evidence_ledger: TrustProgramQualificationLedger;
  report: TrustProgramQualificationReport;
  decision: TrustProgramQualificationDecision;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TrustProgramQualificationValidation = Readonly<{
  valid: boolean;
  outcome: TrustProgramQualificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  framework_valid: boolean;
  scope_valid: boolean;
  replay_valid: boolean;
  ledger_valid: boolean;
  readiness_valid: boolean;
  consumer_valid: boolean;
  maturity_valid: boolean;
  report_valid: boolean;
  decision_valid: boolean;
  failures: readonly TrustProgramQualificationFailure[];
  integrity_hash: string;
}>;

export type TrustProgramQualificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "trust-program-qualification/v5.18";
    owns_program_qualification: true;
    qualifies_program_itself: true;
    certifies_individual_trust_artifacts: false;
    issues_runtime_authority: false;
    bypasses_governance: false;
    bypasses_tenant_isolation: false;
    bypasses_originating_evaluations: false;
  }>;
  result: TrustProgramQualificationResult;
  validation: TrustProgramQualificationValidation;
}>;
