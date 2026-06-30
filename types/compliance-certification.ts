import type { ComplianceEvaluationScope, ComplianceReplayState, ComplianceType } from "./compliance-contract";

export type ComplianceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ComplianceCertificationComponentStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "SKIPPED";

export type ComplianceCertificationComponentKey =
  | "contract_validation"
  | "schema_validation"
  | "evaluation_reproducibility"
  | "policy_replay"
  | "constitutional_replay"
  | "authority_replay"
  | "operational_replay"
  | "threshold_enforcement"
  | "trend_reproducibility"
  | "recurring_failure_detection"
  | "corrective_action_lineage"
  | "confidence_reproducibility"
  | "evidence_confidence"
  | "recommendation_confidence"
  | "evidence_completeness"
  | "lineage_reproduction"
  | "replay_determinism"
  | "tenant_isolation"
  | "identifier_immutability"
  | "historical_truth"
  | "operator_visibility"
  | "remediation_retest";

export type ComplianceCertificationFailureClass =
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_COMPLIANCE_LEAKAGE"
  | "CONSTITUTIONAL_VIOLATION_MISSED"
  | "GOVERNANCE_BYPASS_ACCEPTED"
  | "OPERATOR_SUPREMACY_VIOLATION"
  | "UNAUTHORIZED_EXECUTION_AUTHORITY_ACCEPTED"
  | "REPLAY_MISMATCH"
  | "LINEAGE_MISMATCH"
  | "TRUTH_LINEAGE_MISMATCH"
  | "INCOMPLETE_EVIDENCE_ACCEPTED"
  | "IDENTIFIER_MUTATION_DETECTED"
  | "HIDDEN_STATE_DETECTED"
  | "CONFIDENCE_CALCULATION_MISMATCH"
  | "THRESHOLD_VIOLATION_UNDETECTED"
  | "MISSING_COMPLIANCE_CONTRACT"
  | "INVALID_COMPLIANCE_SCHEMA"
  | "EVALUATION_MISMATCH"
  | "POLICY_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_REPLAY_MISMATCH"
  | "AUTHORITY_VERIFICATION_MISMATCH"
  | "OPERATIONAL_REPLAY_MISMATCH"
  | "TREND_RECONSTRUCTION_MISMATCH"
  | "RECURRING_FAILURE_MISSED"
  | "CORRECTIVE_LINEAGE_MISMATCH"
  | "EVIDENCE_CONFIDENCE_MISMATCH"
  | "RECOMMENDATION_CONFIDENCE_MISMATCH"
  | "MINOR_VISIBILITY_GAP"
  | "MINOR_EXPLANATION_GAP"
  | "MINOR_DASHBOARD_GAP"
  | "MINOR_TREND_CALIBRATION_GAP"
  | "MINOR_RECOMMENDATION_CONFIDENCE_CALIBRATION";

export type ComplianceCertificationScope = Readonly<{
  phase_id: "7D";
  component_id: "7D.5";
  tenant_id: string;
  mission_id: string;
  compliance_type_scope: readonly ComplianceType[];
  certification_suite_version: "COMPLIANCE-CERT-SUITE-V1";
  evaluation_scope: ComplianceEvaluationScope;
}>;

export type ComplianceCertificationTestResult = Readonly<{
  test_id: ComplianceCertificationComponentKey;
  test_name: string;
  status: ComplianceCertificationComponentStatus;
  expected_output: string;
  actual_output: string;
  failure_class: ComplianceCertificationFailureClass | null;
  evidence_refs: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  deterministic: boolean;
  tenant_safe: boolean;
}>;

export type ComplianceCertificationTestResults = Readonly<Record<ComplianceCertificationComponentKey, ComplianceCertificationTestResult>>;
export type ComplianceCertificationValidatedComponents = ComplianceCertificationTestResults;

export type ComplianceCertificationLedgerRecord = Readonly<{
  certification_ledger_id: string;
  certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase_id: "7D";
  component_id: "7D.5";
  certification_state: ComplianceCertificationState;
  certification_score: number;
  lifecycle_events: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  created_timestamp: string;
  certification_hash: string;
}>;

export type ComplianceCertificationReplaySnapshot = Readonly<{
  certification_id: string;
  test_suite_version: "COMPLIANCE-CERT-SUITE-V1";
  test_inputs: readonly string[];
  expected_outputs: Readonly<Record<ComplianceCertificationComponentKey, string>>;
  actual_outputs: Readonly<Record<ComplianceCertificationComponentKey, string>>;
  contract_snapshot: unknown;
  schema_snapshot: unknown;
  evaluation_snapshots: readonly unknown[];
  trend_snapshots: readonly unknown[];
  confidence_snapshots: readonly unknown[];
  evidence_snapshots: readonly string[];
  lineage_snapshots: readonly string[];
  tenant_validation_snapshot: string;
  truth_ledger_snapshot: string;
  certification_decision_logic_version: "COMPLIANCE-CERT-DECISION-V1";
  final_certification_state: ComplianceCertificationState;
  certification_hash: string;
  replay_hash: string;
}>;

export type ComplianceCertificationRecord = Readonly<{
  contract_version: "COMPLIANCE-CERTIFICATION-V1";
  certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase_id: "7D";
  component_id: "7D.5";
  certification_scope: ComplianceCertificationScope;
  certification_state: ComplianceCertificationState;
  certification_score: number;
  test_results: ComplianceCertificationTestResults;
  passed_tests: readonly ComplianceCertificationComponentKey[];
  failed_tests: readonly ComplianceCertificationComponentKey[];
  conditional_findings: readonly ComplianceCertificationTestResult[];
  blocking_failures: readonly ComplianceCertificationTestResult[];
  supporting_evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  certification_timestamp: string;
  certification_ledger_record: ComplianceCertificationLedgerRecord;
  replay_snapshot: ComplianceCertificationReplaySnapshot;
  certification_hash: string;
}>;

export type ComplianceCertificationValidationReason =
  | "CERTIFICATION_RECORD_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "CERTIFICATION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "UNKNOWN_CERTIFICATION_STATE"
  | "TEST_RESULTS_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "CERTIFICATION_LEDGER_MISSING"
  | "REPLAY_SNAPSHOT_MISSING"
  | "CERTIFICATION_HASH_MISMATCH"
  | "TENANT_SCOPE_VIOLATION"
  | "HIDDEN_STATE_DETECTED"
  | "FAILURE_STATE_MISMATCH";

export type ComplianceCertificationValidationFailure = Readonly<{
  failure_id: string;
  reason: ComplianceCertificationValidationReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ComplianceCertificationValidationResult = Readonly<{
  certification_id?: string;
  validation_state: "VALID" | "TENANT_SCOPE_VIOLATION" | "CERTIFICATION_BLOCKED" | "REPLAY_MISMATCH" | "INVALID";
  validator_version: "COMPLIANCE-CERTIFICATION-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    test_results_present: boolean;
    evidence_complete: boolean;
    lineage_valid: boolean;
    replay_valid: boolean;
    truth_ledger_recorded: boolean;
    ledger_recorded: boolean;
    tenant_isolation_valid: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly ComplianceCertificationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ComplianceCertificationReplayResult = Readonly<{
  replay_id: string;
  certification_id: string;
  replay_state: ComplianceReplayState;
  reconstructed_certification_hash: string;
  expected_certification_hash: string;
  reconstructed_certification_score: number;
  expected_certification_score: number;
  reconstructed_certification_state: ComplianceCertificationState;
  expected_certification_state: ComplianceCertificationState;
  failure_reason: ComplianceCertificationValidationReason | null;
}>;

export type ComplianceRemediationState = "OPEN" | "IN_REVIEW" | "APPROVED" | "IN_PROGRESS" | "READY_FOR_RETEST" | "RETESTING" | "RESOLVED" | "REJECTED" | "SUPERSEDED";

export type ComplianceRemediationRecord = Readonly<{
  remediation_id: string;
  certification_id: string;
  failed_test: ComplianceCertificationComponentKey;
  failure_class: ComplianceCertificationFailureClass;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  required_fix: string;
  owner_scope: "GOVERNANCE" | "OPERATOR" | "COMPLIANCE_ENGINE" | "DASHBOARD" | "CERTIFICATION_SUITE";
  governance_review_required: boolean;
  operator_review_required: boolean;
  verification_test: ComplianceCertificationComponentKey;
  target_state: ComplianceCertificationState;
  remediation_state: ComplianceRemediationState;
  lineage_reference: string;
  truth_ledger_reference: string;
}>;

export type ComplianceCertificationReport = Readonly<{
  certification_id: string;
  certification_state: ComplianceCertificationState;
  certification_score: number;
  passed_tests: readonly ComplianceCertificationComponentKey[];
  failed_tests: readonly ComplianceCertificationComponentKey[];
  conditional_findings: readonly ComplianceCertificationTestResult[];
  blocking_failures: readonly ComplianceCertificationTestResult[];
  evidence_status: "COMPLETE" | "INCOMPLETE";
  replay_status: ComplianceReplayState;
  lineage_status: "INTACT" | "BROKEN";
  tenant_isolation_status: "PRESERVED" | "FAILED";
  confidence_status: "REPRODUCED" | "MISMATCH";
  historical_truth_status: "PRESERVED" | "FAILED";
  required_remediation: readonly ComplianceRemediationRecord[];
  truth_ledger_reference: string;
  certification_hash: string;
}>;

export type ComplianceCertificationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "replayable" | "evidence-backed" | "tenant-safe" | "fail-closed" | "operator-visible")[];
  certification_states: readonly ComplianceCertificationState[];
  blocking_failure_classes: readonly ComplianceCertificationFailureClass[];
  conditional_failure_classes: readonly ComplianceCertificationFailureClass[];
  contract_version: "COMPLIANCE-CERTIFICATION-V1";
}>;
