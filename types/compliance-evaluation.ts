import type {
  ComplianceEvaluationScope,
  ComplianceEvaluationStatus,
  ComplianceEvidence,
  ComplianceReplayState,
  ComplianceRule,
  ComplianceThreshold,
  ComplianceType,
} from "./compliance-contract";

export type RequirementMatchState = "MATCHED" | "NOT_MATCHED" | "PARTIALLY_MATCHED" | "SUPERSEDED" | "EXCEPTION_APPLIED" | "UNKNOWN" | "INVALID";
export type RuleEvaluationState = "SATISFIED" | "VIOLATED" | "PARTIAL" | "SUPERSEDED" | "EXCEPTION_APPLIED" | "UNKNOWN" | "INVALID";
export type ViolationSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ViolationType = "NONE" | "POLICY_VIOLATION" | "CONSTITUTIONAL_VIOLATION" | "AUTHORITY_VIOLATION" | "OPERATIONAL_VIOLATION" | "GOVERNANCE_CHECKPOINT_VIOLATION" | "RUNTIME_BOUNDARY_VIOLATION" | "EXECUTION_RESTRICTION_VIOLATION" | "EVIDENCE_VIOLATION" | "TENANT_ISOLATION_VIOLATION" | "REPLAY_VIOLATION";
export type EvidenceValidationState = "COMPLETE" | "PARTIAL" | "MISSING" | "CONFLICTING" | "INVALID" | "TAMPERED";
export type PolicyComplianceResult = "POLICY_SATISFIED" | "POLICY_VIOLATED" | "POLICY_SUPERSEDED" | "POLICY_EXCEPTION_APPLIED" | "POLICY_CONFLICT_DETECTED" | "POLICY_UNKNOWN";
export type ConstitutionalComplianceResult = "CONSTITUTION_ALIGNED" | "CONSTITUTION_VIOLATED" | "GOVERNANCE_SUPREMACY_PRESERVED" | "GOVERNANCE_SUPREMACY_VIOLATED" | "OPERATOR_SUPREMACY_PRESERVED" | "OPERATOR_SUPREMACY_VIOLATED" | "CONSTITUTION_UNKNOWN";
export type AuthorityComplianceResult = "AUTHORITY_RESPECTED" | "UNAUTHORIZED_BEHAVIOR_DETECTED" | "PRIVILEGE_ESCALATION_DETECTED" | "BOUNDARY_ENFORCED" | "BOUNDARY_BREACHED" | "AUTHORITY_UNKNOWN";
export type OperationalComplianceResult = "WORKFLOW_ADHERED" | "WORKFLOW_DEVIATION_DETECTED" | "RUNTIME_COMPLIANT" | "RUNTIME_NONCOMPLIANT" | "GOVERNANCE_CHECKPOINT_COMPLETE" | "GOVERNANCE_CHECKPOINT_MISSING" | "EXECUTION_RESTRICTION_PRESERVED" | "EXECUTION_RESTRICTION_VIOLATED" | "OPERATIONAL_UNKNOWN";

export type ComplianceEvaluationScenario =
  | "COMPLIANT"
  | "POLICY_VIOLATION"
  | "POLICY_SUPERSEDED"
  | "POLICY_EXCEPTION"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_BYPASS"
  | "UNAUTHORIZED_BEHAVIOR"
  | "PRIVILEGE_ESCALATION"
  | "BOUNDARY_BREACH"
  | "WORKFLOW_DEVIATION"
  | "GOVERNANCE_CHECKPOINT_MISSING"
  | "EXECUTION_RESTRICTION_VIOLATED"
  | "MISSING_EVIDENCE"
  | "INVALID_EVIDENCE"
  | "TAMPERED_EVIDENCE"
  | "LEDGER_WRITE_FAILURE"
  | "REPLAY_MISMATCH"
  | "CROSS_TENANT_EVIDENCE"
  | "HIDDEN_STATE";

export type ComplianceEvaluationRequest = Readonly<{
  tenant_id: string;
  mission_id: string;
  compliance_type: ComplianceType;
  evaluation_scope: ComplianceEvaluationScope;
  rule_reference: string;
  threshold_reference: string;
  policy_reference: string;
  constitution_reference: string;
  authority_reference: string;
  scenario: ComplianceEvaluationScenario;
  evaluation_context: Readonly<Record<string, unknown>>;
}>;

export type RuleEvaluationResult = Readonly<{
  rule_id: string;
  rule_version: string;
  rule_result: RuleEvaluationState;
  rule_status: ComplianceEvaluationStatus;
  matched_evidence: readonly string[];
  missing_evidence: readonly string[];
  violation_detected: boolean;
  violation_severity: ViolationSeverity;
  rule_evaluation_hash: string;
}>;

export type EvidenceBundle = Readonly<{
  evidence_bundle_reference: string;
  evidence_snapshot: readonly ComplianceEvidence[];
  evidence_integrity_hash: string;
  missing_evidence_report: readonly string[];
  conflicting_evidence_report: readonly string[];
}>;

export type RequirementMatchResult = Readonly<{
  requirement_match_result: RequirementMatchState;
  matched_requirement_ids: readonly string[];
  unmatched_requirement_ids: readonly string[];
  exception_references: readonly string[];
  supersession_references: readonly string[];
  requirement_match_hash: string;
}>;

export type ViolationResult = Readonly<{
  violation_detected: boolean;
  violation_type: ViolationType;
  violation_severity: ViolationSeverity;
  violation_evidence: readonly string[];
  violation_explanation: string;
  violation_lineage: string;
  violation_hash: string;
}>;

export type ComplianceMeasurement = Readonly<{
  satisfied_count: number;
  violated_count: number;
  unknown_count: number;
  exception_count: number;
  severity_weight: number;
  measurement_hash: string;
}>;

export type ComplianceScoreResult = Readonly<{
  compliance_score: number;
  score_breakdown: Readonly<Record<string, number>>;
  score_penalties: readonly string[];
  score_overrides: readonly string[];
  threshold_mapping: ComplianceEvaluationStatus;
  score_calculation_hash: string;
}>;

export type ThresholdProcessingResult = Readonly<{
  threshold_id: string;
  threshold_version: string;
  threshold_type: string;
  input_score: number;
  severity_override: ViolationSeverity | null;
  status_output: ComplianceEvaluationStatus;
  escalation_required: boolean;
  certification_impact: "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "NOT_CERTIFIED" | "CERTIFICATION_BLOCKED";
  threshold_hash: string;
}>;

export type EvidenceValidationResult = Readonly<{
  evidence_validation_state: EvidenceValidationState;
  validated_evidence_refs: readonly string[];
  invalid_evidence_refs: readonly string[];
  missing_evidence_refs: readonly string[];
  conflicting_evidence_refs: readonly string[];
  evidence_validation_hash: string;
}>;

export type ComplianceDecisionResult = Readonly<{
  evaluation_status: ComplianceEvaluationStatus;
  decision_reason: string;
  decision_factors: readonly string[];
  threshold_applied: string;
  decision_hash: string;
}>;

export type ComplianceEvaluationLedgerRecord = Readonly<{
  evaluation_ledger_id: string;
  compliance_evaluation_id: string;
  tenant_id: string;
  mission_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  rule_references: readonly string[];
  threshold_references: readonly string[];
  evidence_references: readonly string[];
  violation_references: readonly string[];
  score_result: number;
  decision_state: ComplianceEvaluationStatus;
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  created_timestamp: string;
  evaluation_hash: string;
}>;

export type ComplianceEvaluationReplaySnapshot = Readonly<{
  compliance_evaluation_id: string;
  rule_snapshot: ComplianceRule | null;
  threshold_snapshot: ComplianceThreshold | null;
  evidence_bundle: EvidenceBundle;
  requirement_match_result: RequirementMatchResult;
  violation_result: ViolationResult;
  score_result: ComplianceScoreResult;
  threshold_result: ThresholdProcessingResult;
  decision_logic_version: "COMPLIANCE-DECISION-V1";
  final_decision: ComplianceEvaluationStatus;
  truth_ledger_reference: string;
  replay_hash: string;
}>;

export type ComplianceEvaluationRecord = Readonly<{
  contract_version: "COMPLIANCE-EVALUATION-V1";
  compliance_evaluation_id: string;
  compliance_id: string;
  tenant_id: string;
  mission_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  rule_reference: string;
  rule_version: string;
  threshold_reference: string;
  evaluation_timestamp: string;
  evidence_bundle_reference: string;
  rule_evaluation_result: RuleEvaluationResult;
  requirement_match_result: RequirementMatchResult;
  violation_result: ViolationResult;
  compliance_measurement: ComplianceMeasurement;
  score_result: ComplianceScoreResult;
  threshold_result: ThresholdProcessingResult;
  evidence_validation_result: EvidenceValidationResult;
  compliance_score: number;
  evaluation_status: ComplianceEvaluationStatus;
  decision_reason: string;
  decision_result: ComplianceDecisionResult;
  policy_result: PolicyComplianceResult;
  constitutional_result: ConstitutionalComplianceResult;
  authority_result: AuthorityComplianceResult;
  operational_result: OperationalComplianceResult;
  supporting_evidence: readonly ComplianceEvidence[];
  conflicting_evidence: readonly ComplianceEvidence[];
  missing_evidence: readonly string[];
  escalation_required: boolean;
  escalation_type: string | null;
  escalation_reason: string | null;
  governance_review_required: boolean;
  operator_review_required: boolean;
  corrective_action_reference: string | null;
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  ledger_record: ComplianceEvaluationLedgerRecord;
  replay_snapshot: ComplianceEvaluationReplaySnapshot;
  evaluation_hash: string;
}>;

export type ComplianceEvaluationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "evidence-backed" | "explainable" | "replayable" | "tenant-safe" | "fail-closed" | "operator-visible")[];
  pipeline_stages: readonly string[];
  supported_compliance_types: readonly ComplianceType[];
  critical_overrides: readonly string[];
  contract_version: "COMPLIANCE-EVALUATION-V1";
}>;

export type ComplianceEvaluationFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "EVALUATION_ID_MISSING"
  | "COMPLIANCE_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "RULE_UNRESOLVED"
  | "THRESHOLD_UNRESOLVED"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_INVALID"
  | "EVIDENCE_TAMPERED"
  | "TENANT_SCOPE_VIOLATION"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "LEDGER_WRITE_FAILED"
  | "SCORE_MISMATCH"
  | "THRESHOLD_MISMATCH"
  | "DECISION_MISMATCH"
  | "REPLAY_MISMATCH"
  | "HIDDEN_STATE_DETECTED"
  | "EVALUATION_HASH_MISMATCH";

export type ComplianceEvaluationValidationState = "VALID" | "INVALID" | "UNKNOWN" | "TENANT_SCOPE_VIOLATION" | "CERTIFICATION_BLOCKED" | "REPLAY_MISMATCH";

export type ComplianceEvaluationValidationFailure = Readonly<{
  failure_id: string;
  reason: ComplianceEvaluationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ComplianceEvaluationValidationResult = Readonly<{
  compliance_evaluation_id?: string;
  validation_state: ComplianceEvaluationValidationState;
  validator_version: "COMPLIANCE-EVALUATION-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    rule_resolved: boolean;
    threshold_resolved: boolean;
    evidence_valid: boolean;
    score_deterministic: boolean;
    threshold_deterministic: boolean;
    decision_reproducible: boolean;
    ledger_recorded: boolean;
    replay_snapshot_present: boolean;
    tenant_isolation_valid: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly ComplianceEvaluationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ComplianceEvaluationReplayResult = Readonly<{
  replay_id: string;
  compliance_evaluation_id: string;
  replay_state: ComplianceReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_decision: ComplianceEvaluationStatus;
  expected_decision: ComplianceEvaluationStatus;
  failure_reason: ComplianceEvaluationFailureReason | null;
}>;

export type ComplianceEvaluationObservabilitySurface = Readonly<{
  compliance_evaluation_id: string;
  evaluation_status: ComplianceEvaluationStatus;
  compliance_score: number;
  rule_evaluated: string;
  threshold_applied: string;
  evidence_used: readonly string[];
  missing_evidence: readonly string[];
  conflicting_evidence: readonly string[];
  violation_detected: boolean;
  violation_severity: ViolationSeverity;
  decision_reason: string;
  replay_state: ComplianceReplayState;
  ledger_reference: string;
  corrective_action_reference: string | null;
  escalation_required: boolean;
  validation_failures: readonly ComplianceEvaluationFailureReason[];
}>;
