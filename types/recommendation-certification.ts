import type { RecommendationCertificationState, RecommendationReplayState } from "./recommendation-contract";

export type RecommendationCertificationComponentKey =
  | "contract_certification_result"
  | "generation_certification_result"
  | "alternative_path_certification_result"
  | "validation_certification_result"
  | "replay_certification_result"
  | "evidence_certification_result"
  | "risk_certification_result"
  | "confidence_certification_result"
  | "governance_boundary_result"
  | "advisory_only_result"
  | "tenant_isolation_result"
  | "truth_ledger_result"
  | "operator_visibility_result";

export type RecommendationCertificationFailureClass =
  | "CONTRACT_MISSING_ACCEPTED"
  | "UNSUPPORTED_RECOMMENDATION_ACCEPTED"
  | "GENERATION_MISMATCH"
  | "UNSUPPORTED_RECOMMENDATION_GENERATED"
  | "PRIORITY_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "ALTERNATIVE_PATH_MISMATCH"
  | "PATH_ORDERING_MISMATCH"
  | "PATH_COMPARISON_MISMATCH"
  | "VALIDATION_MISMATCH"
  | "UNSUPPORTED_RECOMMENDATION_VALIDATED"
  | "BOUNDARY_VIOLATION_ACCEPTED"
  | "REPLAY_MISMATCH"
  | "MISSING_EVIDENCE_ACCEPTED"
  | "EVIDENCE_LINEAGE_MISMATCH"
  | "RISK_SCORE_MISMATCH"
  | "CRITICAL_RISK_ESCALATION_MISSING"
  | "CONFIDENCE_INFLATION_ACCEPTED"
  | "GOVERNANCE_VIOLATION_ACCEPTED"
  | "CONSTITUTIONAL_CONFLICT_ACCEPTED"
  | "EXECUTION_AUTHORITY_ACCEPTED"
  | "MUTATION_AUTHORITY_ACCEPTED"
  | "TENANT_ISOLATION_FAILURE"
  | "TRUTH_LEDGER_LINKAGE_MISSING"
  | "LEDGER_MUTATION_ACCEPTED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "MINOR_VISIBILITY_GAP"
  | "MINOR_EXPLANATION_GAP"
  | "MINOR_CONFIDENCE_CALIBRATION_GAP"
  | "CERTIFICATION_HASH_MISMATCH"
  | "CERTIFICATION_DECISION_MISMATCH"
  | "HIDDEN_CERTIFICATION_STATE";

export type RecommendationCertificationTestResult = Readonly<{
  component: RecommendationCertificationComponentKey;
  status: RecommendationCertificationState;
  test_count: number;
  passed_count: number;
  failed_count: number;
  deterministic: boolean;
  tenant_safe: boolean;
  advisory_only: boolean;
  replay_state: RecommendationReplayState;
  failure_class: RecommendationCertificationFailureClass | null;
  rationale: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
}>;

export type RecommendationCertificationFinding = Readonly<{
  finding_id: string;
  component: RecommendationCertificationComponentKey;
  failure_class: RecommendationCertificationFailureClass;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  remediation_ref: string;
}>;

export type RecommendationCertificationInputSet = Readonly<{
  valid_recommendation_contract: string;
  invalid_recommendation_contract: string;
  policy_update_case: string;
  control_improvement_case: string;
  escalation_case: string;
  compliance_improvement_case: string;
  remediation_case: string;
  monitoring_case: string;
  certification_recommendation_case: string;
  unsupported_recommendation_case: string;
  missing_evidence_case: string;
  weak_evidence_case: string;
  conflicting_evidence_case: string;
  high_risk_case: string;
  critical_risk_case: string;
  confidence_mismatch_case: string;
  tenant_violation_case: string;
  replay_mismatch_case: string;
  execution_authority_case: string;
}>;

export type RecommendationCertificationRecord = Readonly<{
  certification_id: string;
  tenant_id: string;
  mission_id: string;
  phase_id: "7E";
  certification_scope: readonly ("7E.1" | "7E.2" | "7E.3" | "7E.4")[];
  certification_state: RecommendationCertificationState;
  certification_summary: string;
  input_set: RecommendationCertificationInputSet;
  contract_certification_result: RecommendationCertificationTestResult;
  generation_certification_result: RecommendationCertificationTestResult;
  alternative_path_certification_result: RecommendationCertificationTestResult;
  validation_certification_result: RecommendationCertificationTestResult;
  replay_certification_result: RecommendationCertificationTestResult;
  evidence_certification_result: RecommendationCertificationTestResult;
  risk_certification_result: RecommendationCertificationTestResult;
  confidence_certification_result: RecommendationCertificationTestResult;
  governance_boundary_result: RecommendationCertificationTestResult;
  advisory_only_result: RecommendationCertificationTestResult;
  tenant_isolation_result: RecommendationCertificationTestResult;
  truth_ledger_result: RecommendationCertificationTestResult;
  operator_visibility_result: RecommendationCertificationTestResult;
  failed_tests: readonly RecommendationCertificationComponentKey[];
  conditional_findings: readonly RecommendationCertificationFinding[];
  blocking_findings: readonly RecommendationCertificationFinding[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  certified_timestamp: string;
  certifier_version: "RECOMMENDATION-CERTIFICATION-V1";
  certification_hash: string;
}>;

export type RecommendationCertificationValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type RecommendationCertificationValidationResult = Readonly<{
  validation_state: RecommendationCertificationValidationState;
  validator_version: "RECOMMENDATION-CERTIFICATION-VALIDATOR-V1";
  errors: readonly RecommendationCertificationFinding[];
  checks: Readonly<{
    record_present: boolean;
    state_valid: boolean;
    decision_consistent: boolean;
    replay_ready: boolean;
    tenant_isolated: boolean;
    advisory_only_enforced: boolean;
    truth_ledger_linked: boolean;
    operator_visible: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
}>;

export type RecommendationCertificationReplayResult = Readonly<{
  replay_id: string;
  replay_state: RecommendationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: RecommendationCertificationState;
  expected_state: RecommendationCertificationState;
  failure_class: RecommendationCertificationFailureClass | null;
}>;

export type RecommendationCertificationReport = Readonly<{
  certification_state: RecommendationCertificationState;
  certification_summary: string;
  evidence_status: "COMPLETE" | "INCOMPLETE";
  replay_status: RecommendationReplayState;
  tenant_isolation_status: "PRESERVED" | "VIOLATED";
  advisory_only_status: "ENFORCED" | "VIOLATED";
  truth_ledger_status: "COMPLETE" | "INCOMPLETE";
  operator_visibility_status: "COMPLETE" | "INCOMPLETE";
  failed_tests: readonly RecommendationCertificationComponentKey[];
  required_remediation: readonly RecommendationCertificationFinding[];
}>;

export type RecommendationCertificationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "evidence-supported" | "risk-aware" | "confidence-justified" | "governance-compliant" | "advisory-only" | "tenant-safe" | "truth-ledger-linked" | "replayable" | "operator-visible" | "certification-ready" | "fail-closed")[];
  certification_states: readonly RecommendationCertificationState[];
  certification_scope: readonly ("7E.1" | "7E.2" | "7E.3" | "7E.4")[];
  blocking_failure_classes: readonly RecommendationCertificationFailureClass[];
  contract_version: "RECOMMENDATION-CERTIFICATION-V1";
}>;
