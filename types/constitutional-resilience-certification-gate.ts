import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";
import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";
import type { ConstitutionalViolationDetectionRepository } from "@/types/constitutional-violation-detection";
import type { ConstitutionalResilienceAssessmentRepository } from "@/types/constitutional-resilience-assessment";
import type { ConstitutionalRecommendationRepository } from "@/types/constitutional-recommendation-engine";
import type { ConstitutionalReplayValidationRepository } from "@/types/constitutional-replay-validation";
import type { ConstitutionalLearningValidationRepository } from "@/types/constitutional-learning-validation";
import type { ConstitutionalAssuranceDashboardRepository } from "@/types/constitutional-assurance-dashboard";

export type ConstitutionalCertificationResult = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ConstitutionalCertificationTestStatus = "PASS" | "FAIL";
export type ConstitutionalCertificationScenario = "BASELINE" | "DOCUMENTATION_GAP" | "CONSTITUTIONAL_BYPASS" | "GOVERNANCE_BYPASS" | "AUTHORITY_ESCALATION" | "OPERATOR_OVERRIDE" | "REPLAY_NONDETERMINISM" | "REPLAY_DIVERGENCE_UNDETECTED" | "HIDDEN_EXECUTION" | "HIDDEN_LEARNING" | "UNAUTHORIZED_OPTIMIZATION" | "POLICY_MUTATION" | "CONSTITUTIONAL_MUTATION" | "GOVERNANCE_MUTATION" | "INTEGRITY_CORRUPTION" | "TENANT_ISOLATION_FAILURE" | "FAIL_OPEN_BEHAVIOR" | "INCOMPLETE_AUDIT_TRAIL" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "CONFIDENCE_INCONSISTENCY" | "LINEAGE_INCONSISTENCY" | "RECOMMENDATION_WITH_EXECUTION_AUTHORITY";
export type ConstitutionalCertificationFailure = "CONSTITUTIONAL_BYPASS_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "AUTHORITY_ESCALATION_DETECTED" | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED" | "REPLAY_NONDETERMINISM_DETECTED" | "UNDETECTED_REPLAY_DIVERGENCE_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "HIDDEN_LEARNING_DETECTED" | "UNAUTHORIZED_OPTIMIZATION_DETECTED" | "POLICY_MUTATION_DETECTED" | "CONSTITUTIONAL_MUTATION_DETECTED" | "GOVERNANCE_MUTATION_DETECTED" | "INTEGRITY_CORRUPTION_DETECTED" | "TENANT_ISOLATION_FAILURE_DETECTED" | "FAIL_OPEN_BEHAVIOR_DETECTED" | "AUDIT_TRAIL_INCOMPLETE" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "CONFIDENCE_INCONSISTENCY_DETECTED" | "LINEAGE_INCONSISTENCY_DETECTED" | "RECOMMENDATION_EXECUTION_AUTHORITY_DETECTED";

export type ConstitutionalCertificationTestResult = Readonly<{
  test_id: string;
  test_name: string;
  expected_result: "PASS";
  actual_result: ConstitutionalCertificationTestStatus;
  mandatory: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationFinding = Readonly<{
  finding_id: string;
  severity: "INFO" | "WARNING" | "BLOCKING";
  summary: string;
  corrective_action: string | null;
  unresolved: boolean;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  certification_summary: string;
  certification_state: ConstitutionalCertificationResult;
  constitutional_version: "constitutional-baseline-contract/v8ALT.10.1";
  subsystem_validation_results: readonly string[];
  certification_test_results: readonly string[];
  replay_verification_report: string;
  governance_verification: "PASS" | "FAIL";
  authority_verification: "PASS" | "FAIL";
  integrity_verification: "PASS" | "FAIL";
  resilience_assessment: string;
  dashboard_verification: "PASS" | "FAIL";
  violation_history: readonly string[];
  recommendation_history: readonly string[];
  confidence_analysis: string;
  audit_references: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  cryptographic_verification: "PASS" | "FAIL";
  immutable: true;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationRecord = Readonly<{
  certification_id: string;
  framework_version: "constitutional-resilience-framework/v8ALT.10";
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  phase: "8ALT.10";
  certification_timestamp: "1970-01-01T00:00:00.000Z";
  overall_result: ConstitutionalCertificationResult;
  overall_constitutional_score: number;
  authority_status: "PASS" | "FAIL";
  governance_status: "PASS" | "FAIL";
  operator_status: "PASS" | "FAIL";
  replay_status: "PASS" | "FAIL";
  integrity_status: "PASS" | "FAIL";
  tenant_isolation_status: "PASS" | "FAIL";
  assessment_status: "PASS" | "FAIL";
  recommendation_status: "PASS" | "FAIL";
  dashboard_status: "PASS" | "FAIL";
  confidence_score: number;
  finding_count: number;
  exception_count: number;
  certification_report_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  read_only: true;
  authority_grant_authorized: false;
  governance_modification_authorized: false;
  mission_execution_influence_authorized: false;
  constitutional_state_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationLedgerRecord = Readonly<{
  certification_record_id: string;
  certification_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  phase: "8ALT.10";
  overall_result: ConstitutionalCertificationResult;
  finding_summary: string;
  constitutional_reference: string;
  governance_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  auditor_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationReport = Readonly<{
  report_id: string;
  executive_summary: readonly string[];
  detailed_results: readonly string[];
  findings: readonly string[];
  evidence: readonly string[];
  integrity_hash: string;
}>;

export type ConstitutionalResilienceCertificationRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  validation_repository_id: string;
  runtime_monitoring_repository_id: string;
  violation_detection_repository_id: string;
  resilience_assessment_repository_id: string;
  recommendation_repository_id: string;
  replay_validation_repository_id: string;
  learning_validation_repository_id: string;
  dashboard_repository_id: string;
  final_state: "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_COMPLETE" | "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_FAIL_CLOSED";
  record: ConstitutionalCertificationRecord;
  tests: readonly ConstitutionalCertificationTestResult[];
  evidence_package: ConstitutionalCertificationEvidencePackage;
  report: ConstitutionalCertificationReport;
  findings: readonly ConstitutionalCertificationFinding[];
  ledger: readonly ConstitutionalCertificationLedgerRecord[];
  failures: readonly ConstitutionalCertificationFailure[];
  read_only: true;
  authority_grant_authorized: false;
  governance_modification_authorized: false;
  mission_execution_influence_authorized: false;
  constitutional_state_modification_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceCertificationValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  certification_passed: boolean;
  deterministic: boolean;
  replay_verified: boolean;
  governance_verified: boolean;
  authority_verified: boolean;
  operator_verified: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  recommendations_advisory_only: boolean;
  read_only: true;
  fail_closed_ready: boolean;
  no_authority_grant: boolean;
  failures: readonly ConstitutionalCertificationFailure[];
  validation_hash: string;
}>;

export type ConstitutionalResilienceCertificationObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  overall_result: ConstitutionalCertificationResult;
  test_count: number;
  finding_count: number;
  failure_count: number;
  ledger_count: number;
  read_only: true;
  mission_execution_influence_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalResilienceCertificationInput = Readonly<{ scenario?: ConstitutionalCertificationScenario; baseline?: ConstitutionalBaselineContract; validationRepository?: ContinuousConstitutionalValidationRepository; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; violationRepository?: ConstitutionalViolationDetectionRepository; resilienceRepository?: ConstitutionalResilienceAssessmentRepository; recommendationRepository?: ConstitutionalRecommendationRepository; replayRepository?: ConstitutionalReplayValidationRepository; learningRepository?: ConstitutionalLearningValidationRepository; dashboardRepository?: ConstitutionalAssuranceDashboardRepository; repository?: ConstitutionalResilienceCertificationRepository }>;

export type ConstitutionalResilienceCertificationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-resilience-certification-gate/v8ALT.10.10";
    final_state: "CONSTITUTIONAL_RESILIENCE_CERTIFICATION_READY";
    certification_scope: readonly string[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalResilienceCertificationRepository;
  validation: ConstitutionalResilienceCertificationValidationResult;
  observability: ConstitutionalResilienceCertificationObservabilitySurface;
}>;
