import type { OperatorVisibilityDashboardResult } from "@/types/operator-visibility-dashboard";

export type OperatorDecisionWorkflowCertificationArea =
  | "WORKFLOW_CONTRACT"
  | "WORKFLOW_STATE_MACHINE"
  | "OPERATOR_ACTION_ENGINE"
  | "APPROVAL_MANAGEMENT"
  | "OVERRIDE_MANAGEMENT"
  | "REVIEW_REQUEST_MANAGER"
  | "ESCALATION_WORKFLOW"
  | "WORKFLOW_AUDIT_REPLAY"
  | "GOVERNANCE_CERTIFICATION"
  | "OPERATOR_VISIBILITY"
  | "CROSS_SYSTEM";

export type OperatorDecisionWorkflowCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type OperatorDecisionWorkflowCertificationState =
  | "NOT_STARTED"
  | "COMPONENT_VALIDATION"
  | "INTEGRATION_VALIDATION"
  | "REPLAY_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "FINAL_CERTIFICATION"
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL";

export type OperatorDecisionWorkflowCertificationTest = Readonly<{
  test_id: string;
  certification_area: OperatorDecisionWorkflowCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  evidence_ref: string;
  integrity_hash: string;
}>;

export type WorkflowCertificationReport = Readonly<{
  report_id: string;
  workflow_id: string;
  certified_components: readonly OperatorDecisionWorkflowCertificationArea[];
  component_test_count: number;
  component_pass_count: number;
  workflow_ready: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ReplayValidationReport = Readonly<{
  report_id: string;
  workflow_id: string;
  replay_certified: boolean;
  replay_hash: string;
  replay_evidence_refs: readonly string[];
  replay_divergence_detected: boolean;
  integrity_hash: string;
}>;

export type GovernanceComplianceReport = Readonly<{
  report_id: string;
  workflow_id: string;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type OperatorSupremacyReport = Readonly<{
  report_id: string;
  workflow_id: string;
  operator_authority_preserved: boolean;
  unauthorized_actions_rejected: boolean;
  recommendations_advisory_only: boolean;
  autonomous_execution_triggered: false;
  integrity_hash: string;
}>;

export type IntegrityVerificationReport = Readonly<{
  report_id: string;
  workflow_id: string;
  integrity_verified: boolean;
  lineage_complete: boolean;
  audit_chain_complete: boolean;
  immutable_evidence_preserved: boolean;
  integrity_hash: string;
}>;

export type ProductionReadinessReport = Readonly<{
  report_id: string;
  workflow_id: string;
  readiness_status: OperatorDecisionWorkflowCertificationOutcome;
  production_deployment_allowed: boolean;
  phase_advancement_allowed: boolean;
  readiness_summary: string;
  integrity_hash: string;
}>;

export type OperatorDecisionWorkflowCertificationEvidence = Readonly<{
  evidence_id: string;
  workflow_id: string;
  test_count: number;
  passed_tests: number;
  failed_tests: number;
  append_only: true;
  deleted: false;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  ledger_integrity_hash: string;
}>;

export type OperatorDecisionWorkflowCertificationFailureReason =
  | "NONDETERMINISTIC_WORKFLOW_TRANSITIONS"
  | "ILLEGAL_STATE_TRANSITIONS_ACCEPTED"
  | "UNAUTHORIZED_OPERATOR_ACTIONS"
  | "MISSING_APPROVAL_ENFORCEMENT"
  | "UNRECORDED_OVERRIDES"
  | "MISSING_OVERRIDE_JUSTIFICATIONS"
  | "INCOMPLETE_REVIEW_REQUESTS"
  | "ESCALATION_ROUTING_FAILURES"
  | "REPLAY_MISMATCHES"
  | "MISSING_AUDIT_HISTORY"
  | "GOVERNANCE_VIOLATIONS"
  | "CONSTITUTIONAL_VIOLATIONS"
  | "TENANT_ISOLATION_FAILURES"
  | "ADVISORY_ONLY_VIOLATIONS"
  | "OPERATOR_VISIBILITY_GAPS"
  | "INTEGRITY_HASH_MISMATCHES"
  | "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"
  | "INCOMPLETE_LINEAGE"
  | "HIDDEN_WORKFLOW_STATE_DETECTED"
  | "UNAUTHORIZED_WORKFLOW_MUTATION"
  | "CROSS_COMPONENT_REPLAY_DIVERGENCE"
  | "CERTIFICATION_TEST_FAILURE"
  | "EVIDENCE_IMMUTABILITY_FAILURE"
  | "REPLAY_DIVERGENCE";

export type OperatorDecisionWorkflowCertificationValidation = Readonly<{
  validation_id: string;
  workflow_id: string;
  component_validation_passed: boolean;
  integration_validation_passed: boolean;
  replay_validation_passed: boolean;
  governance_validation_passed: boolean;
  integrity_validation_passed: boolean;
  operator_supremacy_preserved: boolean;
  production_ready: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly OperatorDecisionWorkflowCertificationFailureReason[];
  integrity_hash: string;
}>;

export type OperatorDecisionWorkflowCertificationInput = Readonly<{
  dashboard_result?: OperatorVisibilityDashboardResult;
  certification_tests?: readonly OperatorDecisionWorkflowCertificationTest[];
  workflow_report?: WorkflowCertificationReport;
  replay_report?: ReplayValidationReport;
  governance_report?: GovernanceComplianceReport;
  operator_supremacy_report?: OperatorSupremacyReport;
  integrity_report?: IntegrityVerificationReport;
  production_readiness_report?: ProductionReadinessReport;
  certification_evidence?: readonly OperatorDecisionWorkflowCertificationEvidence[];
  replay_expected_hash?: string;
}>;

export type OperatorDecisionWorkflowCertificationResult = Readonly<{
  certification_status: OperatorDecisionWorkflowCertificationOutcome;
  fail_closed: boolean;
  dashboard_result: OperatorVisibilityDashboardResult;
  certification_tests: readonly OperatorDecisionWorkflowCertificationTest[];
  workflow_report: WorkflowCertificationReport;
  replay_report: ReplayValidationReport;
  governance_report: GovernanceComplianceReport;
  operator_supremacy_report: OperatorSupremacyReport;
  integrity_report: IntegrityVerificationReport;
  production_readiness_report: ProductionReadinessReport;
  certification_evidence: readonly OperatorDecisionWorkflowCertificationEvidence[];
  validation: OperatorDecisionWorkflowCertificationValidation;
  replay_hash: string;
  failures: readonly OperatorDecisionWorkflowCertificationFailureReason[];
  deterministic: true;
  advisory_only: true;
  production_ready: boolean;
  integrity_hash: string;
}>;

export type OperatorDecisionWorkflowCertificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  workflow_id: string;
  certification_status: OperatorDecisionWorkflowCertificationOutcome;
  certified_test_ids: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly OperatorDecisionWorkflowCertificationFailureReason[];
  integrity_hash: string;
}>;

export type OperatorDecisionWorkflowCertificationObservability = Readonly<{
  certification_runs: number;
  certification_tests_executed: number;
  certification_tests_passed: number;
  certification_tests_failed: number;
  production_ready_assessments: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type OperatorDecisionWorkflowCertificationFoundation = Readonly<{
  certification_version: "operator-decision-workflow-certification-gate/v1";
  certification_states: readonly OperatorDecisionWorkflowCertificationState[];
  result: OperatorDecisionWorkflowCertificationResult;
  replay: OperatorDecisionWorkflowCertificationReplay;
  observability: OperatorDecisionWorkflowCertificationObservability;
}>;
