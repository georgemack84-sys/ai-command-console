import type { DecisionTestingReport, TestEvidenceRecord } from "@/types/decision-testing-replay-validation";
import type { ValidationReport } from "@/types/decision-validation-engine";

export type DecisionCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DecisionCertificationDomainStatus = "PASS" | "FAIL";

export type DecisionCertificationFailure =
  | "NONDETERMINISTIC_BEHAVIOR"
  | "SCHEMA_INCONSISTENCY"
  | "LIFECYCLE_REPLAY_MISMATCH"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "AUTHORITY_VIOLATION"
  | "REPLAY_INCONSISTENCY"
  | "LINEAGE_CORRUPTION"
  | "INTEGRITY_MISMATCH"
  | "SERIALIZATION_INCONSISTENCY"
  | "API_INCOMPATIBILITY"
  | "SDK_INCOMPATIBILITY"
  | "TENANT_ISOLATION_FAILURE"
  | "ADVISORY_ONLY_VIOLATION"
  | "HIDDEN_EXECUTION"
  | "HIDDEN_DECISION_LOGIC"
  | "REPLAY_DIVERGENCE"
  | "FAIL_OPEN_BEHAVIOR"
  | "CERTIFICATION_EVIDENCE_MISSING";

export type DecisionCertificationScenario =
  | "BASELINE"
  | "CONDITIONAL_DOCUMENTATION_GAP"
  | "TEST_EVIDENCE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "AUTHORITY_ESCALATION"
  | "INTEGRITY_MISMATCH"
  | "TENANT_VIOLATION"
  | "API_INCOMPATIBILITY";

export type CertificationTestRecord = Readonly<{
  certification_test_id: string;
  test_name: string;
  expected: DecisionCertificationDomainStatus;
  actual: DecisionCertificationDomainStatus;
  failure?: DecisionCertificationFailure;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type CertificationMetadata = Readonly<{
  certification_version: "decision-orchestration-certification/v1";
  contract_version: string;
  replay_version: string;
  validation_version: string;
  sdk_version: string;
  execution_duration: number;
  deterministic_hash: string;
  certification_status: DecisionCertificationOutcome;
  completed_at: string;
}>;

export type DecisionOrchestrationCertificationRecord = Readonly<{
  certification_id: string;
  phase_id: "9.1.12";
  contract_version: string;
  schema_version: string;
  replay_version: string;
  sdk_version: string;
  validation_version: string;
  certification_result: DecisionCertificationOutcome;
  certification_tests: readonly CertificationTestRecord[];
  governance_status: DecisionCertificationDomainStatus;
  constitutional_status: DecisionCertificationDomainStatus;
  authority_status: DecisionCertificationDomainStatus;
  replay_status: DecisionCertificationDomainStatus;
  integrity_status: DecisionCertificationDomainStatus;
  tenant_isolation_status: DecisionCertificationDomainStatus;
  advisory_status: DecisionCertificationDomainStatus;
  fail_closed_status: DecisionCertificationDomainStatus;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  certified_at: string;
}>;

export type ContractComplianceReport = Readonly<{
  report_id: string;
  contract_complete: boolean;
  schema_correct: boolean;
  compatibility_verified: boolean;
  deterministic_behavior: boolean;
  status: DecisionCertificationDomainStatus;
  integrity_hash: string;
}>;

export type ReplayCertificationReport = Readonly<{
  report_id: string;
  replay_fidelity: boolean;
  reconstruction_accuracy: boolean;
  lineage_preserved: boolean;
  replay_compatible: boolean;
  status: DecisionCertificationDomainStatus;
  integrity_hash: string;
}>;

export type GovernanceCertificationReport = Readonly<{
  report_id: string;
  governance_references_complete: boolean;
  policy_mapping_verified: boolean;
  governance_enforcement_verified: boolean;
  governance_replay_verified: boolean;
  status: DecisionCertificationDomainStatus;
  integrity_hash: string;
}>;

export type ConstitutionalCertificationReport = Readonly<{
  report_id: string;
  constitutional_references_complete: boolean;
  constitutional_enforcement_verified: boolean;
  authority_constraints_verified: boolean;
  constitutional_replay_verified: boolean;
  status: DecisionCertificationDomainStatus;
  integrity_hash: string;
}>;

export type ProductionReadinessReport = Readonly<{
  report_id: string;
  operational_readiness: boolean;
  integration_readiness: boolean;
  replay_readiness: boolean;
  governance_readiness: boolean;
  certification_readiness: boolean;
  production_risks: readonly DecisionCertificationFailure[];
  outstanding_findings: readonly string[];
  production_authorized: boolean;
  status: DecisionCertificationOutcome;
  integrity_hash: string;
}>;

export type DecisionCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  certification_id: string;
  testing_report: DecisionTestingReport;
  validation_report: ValidationReport;
  testing_evidence: readonly TestEvidenceRecord[];
  certification_evidence: readonly CertificationTestRecord[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type DecisionCertificationReport = Readonly<{
  certification_record: DecisionOrchestrationCertificationRecord;
  metadata: CertificationMetadata;
  executive_summary: string;
  readiness_assessment: ProductionReadinessReport;
  architectural_findings: readonly string[];
  remediation_items: readonly string[];
  contract_compliance_report: ContractComplianceReport;
  replay_validation_report: ReplayCertificationReport;
  governance_compliance_report: GovernanceCertificationReport;
  constitutional_compliance_report: ConstitutionalCertificationReport;
  evidence_package: DecisionCertificationEvidencePackage;
  failures: readonly DecisionCertificationFailure[];
  integrity_hash: string;
}>;

export type DecisionCertificationReplayResult = Readonly<{
  certification_id: string;
  replay_valid: boolean;
  reconstructed_outcome: DecisionCertificationOutcome;
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly DecisionCertificationFailure[];
}>;

export type DecisionCertificationValidationResult = Readonly<{
  validation_status: DecisionCertificationDomainStatus;
  certification_id: string;
  completeness_verified: boolean;
  production_authorized: boolean;
  failures: readonly DecisionCertificationFailure[];
}>;

export type DecisionCertificationObservability = Readonly<{
  certification_execution_time: number;
  certification_pass_rate: number;
  replay_fidelity: number;
  validation_consistency: number;
  integrity_verification_rate: number;
  governance_compliance_rate: number;
  constitutional_compliance_rate: number;
  authority_violations: number;
  replay_divergence: number;
  certification_evidence_completeness: number;
}>;
