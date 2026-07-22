import type { ContinuousMaturityMonitoringRepository } from "@/types/continuous-maturity-monitoring";

export type AutonomyMaturityCertificationScenario = "BASELINE" | "CERTIFICATION_TEST_FAILURE" | "REPLAY_MISMATCH" | "NONDETERMINISTIC_SCORING" | "CLASSIFICATION_MISMATCH" | "RECOMMENDATION_MISMATCH" | "INCOMPLETE_EVIDENCE" | "INTEGRITY_FAILURE" | "GOVERNANCE_FAILURE" | "CONSTITUTIONAL_FAILURE" | "MONITORING_RUNTIME_MODIFICATION" | "AUTOMATIC_RECOMMENDATION_EXECUTION" | "HIDDEN_ASSESSMENT_LOGIC" | "INCOMPLETE_REPLAY_REFERENCES" | "TENANT_ISOLATION_FAILURE" | "DOCUMENTATION_GAP";
export type AutonomyMaturityCertificationFailure = "CERTIFICATION_TEST_FAILED" | "REPLAY_MISMATCH_DETECTED" | "NONDETERMINISTIC_SCORING_DETECTED" | "CLASSIFICATION_MISMATCH_DETECTED" | "RECOMMENDATION_MISMATCH_DETECTED" | "CERTIFICATION_EVIDENCE_INCOMPLETE" | "INTEGRITY_FAILURE_DETECTED" | "GOVERNANCE_FAILURE_DETECTED" | "CONSTITUTIONAL_FAILURE_DETECTED" | "MONITORING_RUNTIME_MODIFICATION_DETECTED" | "AUTOMATIC_RECOMMENDATION_EXECUTION_DETECTED" | "HIDDEN_ASSESSMENT_LOGIC_DETECTED" | "REPLAY_REFERENCES_INCOMPLETE" | "TENANT_ISOLATION_FAILURE_DETECTED";
export type AutonomyMaturityCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationTestArea = "CONTRACT" | "DOMAIN" | "SCORING" | "CLASSIFICATION" | "HISTORICAL" | "GAP_ANALYSIS" | "RECOMMENDATION" | "LEDGER" | "ANALYTICS" | "REPLAY" | "CONTINUOUS_MONITORING" | "GOVERNANCE" | "CONSTITUTIONAL" | "SECURITY";

export type AutonomyMaturityCertificationTest = Readonly<{
  test_id: string;
  area: CertificationTestArea;
  name: string;
  expected_result: "PASS";
  actual_result: "PASS" | "FAIL" | "CONDITIONAL_PASS";
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationEvidencePackage = Readonly<{
  package_id: string;
  assessment_evidence: readonly string[];
  replay_evidence: readonly string[];
  governance_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  integrity_evidence: readonly string[];
  certification_evidence: readonly string[];
  complete: boolean;
  immutable: true;
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationReport = Readonly<{
  report_id: string;
  report_type: "CERTIFICATION" | "REPLAY_VALIDATION" | "GOVERNANCE_COMPLIANCE" | "CONSTITUTIONAL_COMPLIANCE" | "PRODUCTION_READINESS" | "ASSESSMENT_EVIDENCE" | "CERTIFICATION_AUDIT";
  outcome: AutonomyMaturityCertificationOutcome;
  summary: readonly string[];
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationRecord = Readonly<{
  certification_id: string;
  framework_version: "autonomy-maturity-framework/v8ALT.11";
  assessment_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
  scoring_version: "deterministic-maturity-scoring-engine/v8ALT.11.3";
  classification_version: "maturity-classification-engine/v8ALT.11.4";
  replay_version: "assessment-replay-explainability/v8ALT.11.10";
  monitoring_version: "continuous-maturity-monitoring/v8ALT.11.11";
  outcome: AutonomyMaturityCertificationOutcome;
  production_readiness_verified: boolean;
  production_deployment_authorized: false;
  recommendation_execution_authorized: false;
  runtime_behavior_modification_authorized: false;
  governance_modification_authorized: false;
  constitutional_modification_authorized: false;
  operator_authority_bypass_authorized: false;
  timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationRepository = Readonly<{
  repository_id: string;
  final_state: "AUTONOMY_MATURITY_CERTIFICATION_COMPLETE" | "AUTONOMY_MATURITY_CERTIFICATION_FAILED" | "AUTONOMY_MATURITY_CERTIFICATION_CONDITIONAL";
  monitoring: ContinuousMaturityMonitoringRepository;
  record: AutonomyMaturityCertificationRecord;
  tests: readonly AutonomyMaturityCertificationTest[];
  evidence_package: AutonomyMaturityCertificationEvidencePackage;
  reports: readonly AutonomyMaturityCertificationReport[];
  failures: readonly AutonomyMaturityCertificationFailure[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  all_tests_passed: boolean;
  replay_verified: boolean;
  scoring_deterministic: boolean;
  classification_deterministic: boolean;
  recommendations_deterministic: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  governance_verified: boolean;
  constitutional_verified: boolean;
  runtime_neutral: boolean;
  no_automatic_recommendation_execution: boolean;
  no_hidden_logic: boolean;
  replay_references_complete: boolean;
  tenant_isolated: boolean;
  production_deployment_authorized: false;
  failures: readonly AutonomyMaturityCertificationFailure[];
  validation_hash: string;
}>;

export type AutonomyMaturityCertificationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  outcome: AutonomyMaturityCertificationOutcome;
  test_count: number;
  report_count: number;
  failure_count: number;
  production_readiness_verified: boolean;
  production_deployment_authorized: false;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AutonomyMaturityCertificationInput = Readonly<{ scenario?: AutonomyMaturityCertificationScenario; repository?: AutonomyMaturityCertificationRepository; monitoring?: ContinuousMaturityMonitoringRepository }>;

export type AutonomyMaturityCertificationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "autonomy-maturity-certification-gate/v8ALT.11.12";
    final_state: "AUTONOMY_MATURITY_CERTIFICATION_GATE_READY";
    principles: readonly string[];
  }>;
  repository: AutonomyMaturityCertificationRepository;
  validation: AutonomyMaturityCertificationValidationResult;
  observability: AutonomyMaturityCertificationObservabilitySurface;
}>;
