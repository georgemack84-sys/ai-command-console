import type { DecisionPackageObservabilityResult } from "@/types/decision-package-observability";

export type DecisionPackageCertificationState = "INITIALIZED" | "TESTING" | "VALIDATING" | "VERIFIED" | "PASS" | "CONDITIONAL_PASS" | "FAIL" | "FAIL_CLOSED";

export type DecisionPackageCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type DecisionPackageCertificationTestName =
  | "Package contract valid"
  | "Package generation deterministic"
  | "Recommendation explained"
  | "Alternatives included"
  | "Rejected options justified"
  | "Evidence summary complete"
  | "Risk summary complete"
  | "Confidence summary complete"
  | "Forecast included"
  | "Governance status visible"
  | "Constitutional status visible"
  | "Authority requirements included"
  | "Approval path generated"
  | "Operator actions defined"
  | "Rollback guidance available"
  | "Replay references attached"
  | "Lineage references complete"
  | "Integrity hash reproducible"
  | "Package ledger immutable"
  | "Replay reproduces identical package"
  | "Tenant isolation enforced"
  | "Advisory-only behavior verified"
  | "Fail-closed behavior enforced";

export type DecisionPackageCertificationRecord = Readonly<{
  certification_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  certification_state: DecisionPackageCertificationOutcome;
  certification_timestamp: string;
  replay_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  production_readiness: "READY" | "BLOCKED";
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type CertificationTestResult = Readonly<{
  test_id: string;
  package_id: string;
  test_name: DecisionPackageCertificationTestName;
  expected_result: "PASS";
  actual_result: DecisionPackageCertificationOutcome;
  evidence_reference: string;
  validation_status: "VALID" | "REJECTED";
  integrity_hash: string;
}>;

export type ProductionReadinessReport = Readonly<{
  report_id: string;
  package_id: string;
  readiness_status: "READY" | "BLOCKED";
  certification_summary: string;
  unresolved_findings: readonly string[];
  deployment_recommendation: "ALLOW_OPERATOR_PRESENTATION" | "BLOCK_OPERATOR_PRESENTATION";
  integrity_hash: string;
}>;

export type CertificationValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  deterministic_verified: boolean;
  replay_verified: boolean;
  governance_verified: boolean;
  constitutional_verified: boolean;
  integrity_verified: boolean;
  certification_status: DecisionPackageCertificationOutcome;
  validation_timestamp: string;
  failures: readonly DecisionPackageCertificationFailureReason[];
  integrity_hash: string;
}>;

export type ComplianceCertificationReport = Readonly<{
  report_id: string;
  package_id: string;
  governance_compliance: "PASS" | "FAIL";
  constitutional_compliance: "PASS" | "FAIL";
  authority_compliance: "PASS" | "FAIL";
  tenant_isolation: "PASS" | "FAIL";
  findings: readonly string[];
  integrity_hash: string;
}>;

export type ReplayCertificationReport = Readonly<{
  report_id: string;
  package_id: string;
  replay_available: boolean;
  replay_deterministic: boolean;
  replay_reproducible: boolean;
  replay_lineage_complete: boolean;
  replay_integrity_verified: boolean;
  integrity_hash: string;
}>;

export type IntegrityCertificationReport = Readonly<{
  report_id: string;
  package_id: string;
  package_integrity: boolean;
  metadata_integrity: boolean;
  replay_integrity: boolean;
  lineage_integrity: boolean;
  ledger_integrity: boolean;
  integrity_hash: string;
}>;

export type DecisionPackageCertificationLedgerEntry = Readonly<{
  ledger_id: string;
  certification_id: string;
  package_id: string;
  certification_timestamp: string;
  certification_outcome: DecisionPackageCertificationOutcome;
  replay_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  production_readiness: "READY" | "BLOCKED";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type DecisionPackageCertificationFailureReason =
  | "PACKAGE_GENERATION_NONDETERMINISTIC"
  | "REQUIRED_PACKAGE_SECTIONS_MISSING"
  | "RECOMMENDATION_RATIONALE_MISSING"
  | "ALTERNATIVES_OMITTED"
  | "REJECTED_OPTIONS_OMITTED"
  | "EVIDENCE_SUMMARY_INCOMPLETE"
  | "RISK_SUMMARY_MISSING"
  | "CONFIDENCE_SUMMARY_MISSING"
  | "FORECAST_ABSENT"
  | "GOVERNANCE_SUMMARY_ABSENT"
  | "CONSTITUTIONAL_SUMMARY_ABSENT"
  | "AUTHORITY_REQUIREMENTS_MISSING"
  | "APPROVAL_PATH_INCOMPLETE"
  | "ROLLBACK_GUIDANCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_HASH_UNREPRODUCIBLE"
  | "LEDGER_IMMUTABILITY_VIOLATED"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "HIDDEN_REASONING_DETECTED"
  | "UNAUTHORIZED_EXECUTION_BEHAVIOR"
  | "ADVISORY_ONLY_GUARANTEE_VIOLATED"
  | "OBSERVABILITY_INCOMPLETE"
  | "UNAUTHORIZED_CERTIFICATION_GATE_ACCESS"
  | "REPLAY_DIVERGENCE";

export type DecisionPackageCertificationGateInput = Readonly<{
  observability_result?: DecisionPackageObservabilityResult;
  certification_tests?: readonly CertificationTestResult[];
  certification_record?: DecisionPackageCertificationRecord;
  production_readiness?: ProductionReadinessReport;
  compliance_report?: ComplianceCertificationReport;
  replay_report?: ReplayCertificationReport;
  integrity_report?: IntegrityCertificationReport;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type DecisionPackageCertificationGateResult = Readonly<{
  gate_status: DecisionPackageCertificationOutcome;
  fail_closed: boolean;
  observability_result: DecisionPackageObservabilityResult;
  certification_record: DecisionPackageCertificationRecord;
  certification_tests: readonly CertificationTestResult[];
  validation: CertificationValidationResult;
  production_readiness: ProductionReadinessReport;
  compliance_report: ComplianceCertificationReport;
  replay_report: ReplayCertificationReport;
  integrity_report: IntegrityCertificationReport;
  certification_ledger: readonly DecisionPackageCertificationLedgerEntry[];
  replay_hash: string;
  failures: readonly DecisionPackageCertificationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageCertificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  certification_id: string;
  package_id: string;
  certification_outcome: DecisionPackageCertificationOutcome;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly DecisionPackageCertificationFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageCertificationObservability = Readonly<{
  certification_success_rate: number;
  certification_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  package_completeness: number;
  explainability_score: number;
  governance_compliance: number;
  constitutional_compliance: number;
  production_readiness: number;
  fail_closed_activations: number;
}>;

export type DecisionPackageCertificationGateFoundation = Readonly<{
  gate_version: "decision-package-certification-gate/v1";
  certification_states: readonly DecisionPackageCertificationState[];
  result: DecisionPackageCertificationGateResult;
  replay: DecisionPackageCertificationReplay;
  observability: DecisionPackageCertificationObservability;
}>;
