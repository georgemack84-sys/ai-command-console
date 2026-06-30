import type { GovernanceOutputFailureReason, GovernanceOutputVerificationReport } from "@/types/governance-output-verification";

export type GovernanceReplayCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceReplayCertificationScenario =
  | "BASELINE"
  | "MINOR_REPORTING_GAP"
  | "MISSING_REPLAY_CONTRACT"
  | "REPLAY_IDENTITY_MODIFIED"
  | "INCOMPLETE_INPUT_RECONSTRUCTION"
  | "STATE_RECONSTRUCTION_MISMATCH"
  | "REPLAY_OUTPUT_MISMATCH"
  | "GOVERNANCE_DECISION_MISMATCH"
  | "POLICY_EVALUATION_MISMATCH"
  | "COMPLIANCE_REPLAY_MISMATCH"
  | "RISK_REPLAY_MISMATCH"
  | "RECOMMENDATION_REPLAY_MISMATCH"
  | "ESCALATION_REPLAY_MISMATCH"
  | "EXPLANATION_MISMATCH"
  | "EVIDENCE_CHAIN_MISMATCH"
  | "POLICY_INFLUENCE_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "LINEAGE_DISCONTINUITY"
  | "REPLAY_ORDERING_CHANGED"
  | "REPLAY_HASH_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILS"
  | "CONSTITUTIONAL_VERSION_MISMATCH"
  | "AUTHORITY_VALIDATION_MISMATCH"
  | "LIVE_DATA_DEPENDENCY"
  | "HIDDEN_EXECUTION_STATE"
  | "UNDOCUMENTED_DEPENDENCY"
  | "REPLAY_INCONSISTENCY"
  | "CROSS_TENANT_REPLAY"
  | "MISSING_AUDIT_RECORDS"
  | "INCOMPLETE_CERTIFICATION_EVIDENCE";

export type GovernanceReplayCertificationFailureReason =
  | "REPLAY_CONTRACT_INVALID"
  | "REPLAY_IDENTITY_NOT_IMMUTABLE"
  | "INPUT_RECONSTRUCTION_INVALID"
  | "STATE_RECONSTRUCTION_INVALID"
  | "OUTPUT_VERIFICATION_INVALID"
  | "GOVERNANCE_DECISION_NOT_REPRODUCED"
  | "POLICY_EVALUATION_NOT_REPRODUCED"
  | "COMPLIANCE_NOT_REPRODUCED"
  | "RISK_NOT_REPRODUCED"
  | "RECOMMENDATION_NOT_REPRODUCED"
  | "ESCALATION_NOT_REPRODUCED"
  | "EXPLAINABILITY_NOT_REPRODUCED"
  | "EVIDENCE_CHAIN_NOT_REPRODUCED"
  | "POLICY_INFLUENCE_NOT_REPRODUCED"
  | "CONFIDENCE_NOT_REPRODUCED"
  | "LINEAGE_NOT_REPRODUCED"
  | "REPLAY_ORDERING_NON_DETERMINISTIC"
  | "REPLAY_HASH_NOT_REPRODUCED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "LIVE_DATA_DEPENDENCY_DETECTED"
  | "HIDDEN_EXECUTION_STATE_DETECTED"
  | "UNDOCUMENTED_DEPENDENCY_DETECTED"
  | "REPLAY_NOT_REPEATABLE"
  | "TENANT_ISOLATION_FAILED"
  | "AUDIT_RECORDS_INCOMPLETE"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "MINOR_REPORTING_GAP";

export type GovernanceReplayCertificationCategory =
  | "CONTRACT"
  | "INPUT_RECONSTRUCTION"
  | "STATE_RECONSTRUCTION"
  | "OUTPUT_VERIFICATION"
  | "GOVERNANCE"
  | "EXPLAINABILITY"
  | "CONFIDENCE"
  | "LINEAGE"
  | "INTEGRITY"
  | "SECURITY"
  | "AUDIT"
  | "EVIDENCE";

export type GovernanceReplayCertificationTestResult = Readonly<{
  test_id: string;
  category: GovernanceReplayCertificationCategory;
  name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  evidence_refs: readonly string[];
  failure_reason: GovernanceReplayCertificationFailureReason | null;
}>;

export type GovernanceReplayCertificationEvidence = Readonly<{
  evidence_id: string;
  replay_contract_hash: string;
  input_package_hash: string;
  state_package_hash: string;
  output_verification_hash: string;
  replay_hashes: readonly string[];
  truth_ledger_references: readonly string[];
  audit_references: readonly string[];
  evidence_hash: string;
}>;

export type GovernanceReplayCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "7H.5";
  schema_version: "governance-replay-certification/v7H.5";
  certification_timestamp: string;
  replay_contract_version: string;
  replay_framework_version: "governance-replay-framework/v7H";
  replay_scope: string;
  certification_state: GovernanceReplayCertificationState;
  output_verification_report: GovernanceOutputVerificationReport;
  input_reconstruction_results: readonly GovernanceReplayCertificationTestResult[];
  state_reconstruction_results: readonly GovernanceReplayCertificationTestResult[];
  output_verification_results: readonly GovernanceReplayCertificationTestResult[];
  governance_results: readonly GovernanceReplayCertificationTestResult[];
  explainability_results: readonly GovernanceReplayCertificationTestResult[];
  confidence_results: readonly GovernanceReplayCertificationTestResult[];
  lineage_results: readonly GovernanceReplayCertificationTestResult[];
  integrity_results: readonly GovernanceReplayCertificationTestResult[];
  security_results: readonly GovernanceReplayCertificationTestResult[];
  audit_results: readonly GovernanceReplayCertificationTestResult[];
  evidence_results: readonly GovernanceReplayCertificationTestResult[];
  executed_test_results: readonly GovernanceReplayCertificationTestResult[];
  detected_findings: readonly GovernanceReplayCertificationFailureReason[];
  corrective_actions: readonly string[];
  certification_evidence: GovernanceReplayCertificationEvidence;
  truth_ledger_record_reference: string;
  governance_ledger_record_reference: string;
  operator_approval_status: "APPROVED_FOR_PRODUCTION" | "APPROVED_FOR_GOVERNANCE_REVIEW" | "BLOCKED";
  certification_signature: string;
  report_hash: string;
}>;

export type GovernanceReplayCertificationInput = Readonly<{
  scenario?: GovernanceReplayCertificationScenario;
  output_report?: GovernanceOutputVerificationReport;
  tenant_id?: string;
  mission_id?: string;
  replay_requestor?: string;
}>;

export type GovernanceReplayCertificationValidationResult = Readonly<{
  certification_id: string | null;
  validation_state: "VALID" | "INVALID";
  certified: boolean;
  tests_passed: boolean;
  output_verified: boolean;
  evidence_complete: boolean;
  report_hash_valid: boolean;
  failures: readonly GovernanceReplayCertificationFailureReason[];
  validation_hash: string;
}>;

export type GovernanceReplayCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: GovernanceReplayCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  failures: readonly GovernanceReplayCertificationFailureReason[];
  output_failures: readonly GovernanceOutputFailureReason[];
  operator_approval_status: GovernanceReplayCertificationReport["operator_approval_status"];
  advisory_only_notice: string;
}>;
