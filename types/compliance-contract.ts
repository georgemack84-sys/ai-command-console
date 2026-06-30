export type ComplianceType =
  | "POLICY_COMPLIANCE"
  | "CONSTITUTIONAL_COMPLIANCE"
  | "AUTHORITY_COMPLIANCE"
  | "OPERATIONAL_COMPLIANCE"
  | "GOVERNANCE_COMPLIANCE"
  | "RUNTIME_COMPLIANCE"
  | "RECOMMENDATION_COMPLIANCE"
  | "CERTIFICATION_COMPLIANCE";

export type ComplianceEvaluationScopeType =
  | "SYSTEM_SCOPE"
  | "MISSION_SCOPE"
  | "PHASE_SCOPE"
  | "COMPONENT_SCOPE"
  | "POLICY_SCOPE"
  | "RECOMMENDATION_SCOPE"
  | "RUNTIME_SCOPE"
  | "TENANT_SCOPE"
  | "CERTIFICATION_SCOPE";

export type ComplianceRuleType = "MANDATORY" | "CONDITIONAL" | "PROHIBITIVE" | "THRESHOLD_BASED" | "EVIDENCE_BASED" | "CERTIFICATION_BASED" | "AUTHORITY_BASED" | "CONSTITUTIONAL";
export type ComplianceThresholdType = "PASS_THRESHOLD" | "WARNING_THRESHOLD" | "FAIL_THRESHOLD" | "CRITICAL_THRESHOLD";
export type ComplianceEvaluationStatus = "PASS" | "WARNING" | "FAIL" | "CRITICAL" | "UNKNOWN" | "INVALID";
export type ComplianceEvidenceState = "COMPLETE" | "PARTIAL" | "MISSING" | "CONFLICTING" | "INVALID";
export type ComplianceReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";
export type ComplianceConfidenceLevel = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW" | "UNKNOWN";
export type ComplianceCorrectiveActionState = "RECOMMENDED" | "REVIEW_REQUIRED" | "APPROVED" | "IN_PROGRESS" | "VERIFICATION_REQUIRED" | "RESOLVED" | "REJECTED" | "SUPERSEDED";
export type ComplianceCertificationState = "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "NOT_CERTIFIED" | "CERTIFICATION_BLOCKED";
export type ComplianceContractLifecycleState = "DRAFT" | "ACTIVE" | "SUPERSEDED" | "RESTRICTED" | "ARCHIVED";

export type ComplianceEvaluationScope = Readonly<{
  scope_type: ComplianceEvaluationScopeType;
  tenant_id: string;
  mission_id?: string;
  phase_id?: string;
  component_id?: string;
  policy_id?: string;
  recommendation_id?: string;
  runtime_id?: string;
  certification_id?: string;
}>;

export type ComplianceRule = Readonly<{
  rule_id: string;
  rule_name: string;
  rule_version: string;
  rule_type: ComplianceRuleType;
  rule_description: string;
  governing_source: string;
  required_evidence: readonly string[];
  evaluation_method: string;
  threshold_reference: string;
  failure_condition: string;
  criticality_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  corrective_action_reference: string;
  replay_requirements: readonly string[];
  certification_requirements: readonly string[];
}>;

export type ComplianceThreshold = Readonly<{
  threshold_id: string;
  threshold_name: string;
  threshold_version: string;
  threshold_type: ComplianceThresholdType;
  minimum_score: number;
  maximum_score: number;
  status_output: Exclude<ComplianceEvaluationStatus, "UNKNOWN" | "INVALID">;
  severity_level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  escalation_required: boolean;
  corrective_action_required: boolean;
  certification_impact: ComplianceCertificationState;
  effective_date: string;
  superseded_by: string | null;
}>;

export type ComplianceEvidence = Readonly<{
  evidence_id: string;
  evidence_type: string;
  evidence_source: string;
  evidence_timestamp: string;
  evidence_integrity_hash: string;
  evidence_lineage_reference: string;
  evidence_replay_reference: string;
  evidence_relevance_score: number;
  evidence_completeness_state: ComplianceEvidenceState;
  tenant_id: string;
}>;

export type ComplianceConfidenceBasis = Readonly<{
  confidence_score: number;
  confidence_level: ComplianceConfidenceLevel;
  confidence_factors: readonly string[];
  confidence_penalties: readonly string[];
  missing_inputs: readonly string[];
  conflicting_inputs: readonly string[];
  confidence_calculation_hash: string;
}>;

export type ComplianceReplayPackage = Readonly<{
  compliance_id: string;
  rule_reference: string;
  rule_version: string;
  policy_reference: string;
  constitution_reference: string;
  authority_reference: string;
  threshold_reference: string;
  evidence_snapshot: readonly ComplianceEvidence[];
  evaluation_inputs: Readonly<Record<string, unknown>>;
  scoring_inputs: Readonly<Record<string, unknown>>;
  confidence_inputs: Readonly<Record<string, unknown>>;
  evaluation_algorithm_version: "COMPLIANCE-EVAL-V1";
  calculation_hash: string;
  expected_output: Readonly<{
    evaluation_status: ComplianceEvaluationStatus;
    compliance_score: number;
    confidence_score: number;
    certification_state: ComplianceCertificationState;
  }>;
  truth_ledger_reference: string;
}>;

export type ComplianceCorrectiveAction = Readonly<{
  corrective_action_id: string;
  compliance_id: string;
  failure_type: string;
  severity: Exclude<ComplianceEvaluationStatus, "PASS" | "UNKNOWN" | "INVALID">;
  recommended_action: string;
  required_governance_review: boolean;
  operator_review_required: boolean;
  deadline_policy: string;
  evidence_required_for_closure: readonly string[];
  verification_method: string;
  status: ComplianceCorrectiveActionState;
  lineage_reference: string;
  truth_ledger_reference: string;
}>;

export type ComplianceRecord = Readonly<{
  contract_version: "COMPLIANCE-CONTRACT-V1";
  compliance_id: string;
  tenant_id: string;
  mission_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  rule_reference: string;
  policy_reference: string;
  constitution_reference: string;
  authority_reference: string;
  threshold_reference: string;
  evaluation_timestamp: string;
  evaluation_status: ComplianceEvaluationStatus;
  compliance_score: number;
  confidence_score: number;
  confidence_basis: ComplianceConfidenceBasis;
  supporting_evidence: readonly ComplianceEvidence[];
  supporting_decisions: readonly string[];
  corrective_actions: readonly ComplianceCorrectiveAction[];
  lineage_reference: string;
  replay_reference: string;
  replay_package: ComplianceReplayPackage;
  truth_ledger_reference: string;
  certification_state: ComplianceCertificationState;
  lifecycle_state: ComplianceContractLifecycleState;
  compliance_hash: string;
}>;

export type ComplianceContractDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "replayable" | "tenant-safe" | "certification-ready" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  required_fields: readonly (keyof ComplianceRecord)[];
  allowed_types: readonly ComplianceType[];
  allowed_scopes: readonly ComplianceEvaluationScopeType[];
  contract_version: "COMPLIANCE-CONTRACT-V1";
}>;

export type ComplianceValidationFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "COMPLIANCE_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "EVALUATION_SCOPE_MISSING"
  | "INVALID_EVALUATION_SCOPE"
  | "UNKNOWN_COMPLIANCE_CATEGORY"
  | "RULE_REFERENCE_MISSING"
  | "INVALID_RULE_REFERENCE"
  | "THRESHOLD_REFERENCE_MISSING"
  | "INVALID_THRESHOLD_REFERENCE"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_INVALID"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "REPLAY_PACKAGE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "INVALID_EVALUATION_STATUS"
  | "SCORE_OUT_OF_RANGE"
  | "SCORE_STATUS_MISMATCH"
  | "CONFIDENCE_OUT_OF_RANGE"
  | "CONFIDENCE_MISMATCH"
  | "INVALID_CERTIFICATION_STATE"
  | "CORRECTIVE_ACTION_INVALID"
  | "TENANT_SCOPE_VIOLATION"
  | "IMMUTABLE_FIELD_MUTATION"
  | "HIDDEN_STATE_DETECTED"
  | "COMPLIANCE_HASH_MISMATCH";

export type ComplianceValidationState = "VALID" | "INVALID" | "UNKNOWN" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type ComplianceValidationFailure = Readonly<{
  failure_id: string;
  reason: ComplianceValidationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ComplianceValidationResult = Readonly<{
  compliance_id?: string;
  validation_state: ComplianceValidationState;
  validator_version: "COMPLIANCE-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    category_registered: boolean;
    scope_valid: boolean;
    rule_valid: boolean;
    threshold_valid: boolean;
    evidence_valid: boolean;
    score_deterministic: boolean;
    confidence_deterministic: boolean;
    corrective_actions_valid: boolean;
    lineage_present: boolean;
    replay_present: boolean;
    truth_ledger_present: boolean;
    tenant_isolation_valid: boolean;
    immutable_fields_valid: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly ComplianceValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ComplianceReplayResult = Readonly<{
  replay_id: string;
  compliance_id: string;
  replay_state: ComplianceReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_status: ComplianceEvaluationStatus;
  expected_status: ComplianceEvaluationStatus;
  failure_reason: ComplianceValidationFailureReason | null;
}>;

export type ComplianceObservabilitySurface = Readonly<{
  compliance_id: string;
  evaluation_status: ComplianceEvaluationStatus;
  compliance_score: number;
  confidence_score: number;
  confidence_level: ComplianceConfidenceLevel;
  rule_evaluated: string;
  threshold_applied: string;
  evidence_summary: Readonly<{
    supporting_evidence_count: number;
    missing_evidence_count: number;
    conflicting_evidence_count: number;
    invalid_evidence_count: number;
  }>;
  corrective_actions: readonly ComplianceCorrectiveAction[];
  replay_state: ComplianceReplayState;
  certification_state: ComplianceCertificationState;
  explanation: string;
}>;

export type ComplianceLifecycleTransitionResult = Readonly<{
  from_state: ComplianceContractLifecycleState;
  to_state: ComplianceContractLifecycleState;
  allowed: boolean;
  reason: string;
}>;
