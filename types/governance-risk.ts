export type GovernanceRiskCategory =
  | "POLICY_RISK"
  | "AUTHORITY_RISK"
  | "ESCALATION_RISK"
  | "CONTROL_WEAKNESS_RISK"
  | "OVERSIGHT_RISK"
  | "LINEAGE_RISK"
  | "REPLAY_RISK"
  | "TENANT_ISOLATION_RISK"
  | "CERTIFICATION_RISK"
  | "GOVERNANCE_DRIFT_RISK"
  | "EVIDENCE_RISK"
  | "EXCEPTION_RISK";

export type GovernanceRiskSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type GovernanceRiskReplayStatus = "REPLAY_SUCCESSFUL" | "REPLAY_INCOMPLETE" | "REPLAY_MISMATCH" | "REPLAY_NOT_REQUIRED";
export type GovernanceRiskState = "DETECTED" | "VALIDATED" | "UNDER_REVIEW" | "MITIGATED" | "SUPERSEDED" | "DISMISSED" | "ARCHIVED";
export type GovernanceRiskValidationState = "VALID" | "INVALID" | "INCOMPLETE" | "TENANT_SCOPE_VIOLATION" | "REPLAY_REFERENCE_MISSING" | "LINEAGE_REFERENCE_MISSING" | "UNKNOWN_SOURCE" | "INVALID_STATE";

export type GovernanceRiskSourceType =
  | "POLICY_VIOLATION"
  | "POLICY_CONFLICT"
  | "POLICY_DRIFT"
  | "AUTHORITY_DRIFT"
  | "GOVERNANCE_EXCEPTION"
  | "MANUAL_OVERRIDE"
  | "ESCALATION_EVENT"
  | "FAILED_CERTIFICATION_TEST"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BREAK"
  | "MISSING_EVIDENCE"
  | "MISSING_CONTRACT"
  | "UNRESOLVED_GOVERNANCE_ACTION"
  | "TENANT_BOUNDARY_ANOMALY"
  | "REPEATED_WARNING_STATE"
  | "RUNTIME_CONTAINMENT_EVENT"
  | "OPERATOR_INTERVENTION_PATTERN";

export type GovernanceRiskFailureReason =
  | "CONTRACT_MISSING"
  | "REQUIRED_FIELD_MISSING"
  | "TENANT_ID_MISSING"
  | "GOVERNANCE_RISK_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "GOVERNANCE_INTELLIGENCE_ID_MISSING"
  | "POLICY_INTELLIGENCE_ID_MISSING"
  | "UNKNOWN_SOURCE"
  | "INVALID_CATEGORY"
  | "INVALID_SEVERITY"
  | "SEVERITY_BASIS_MISSING"
  | "CONFIDENCE_SCORE_MISSING"
  | "CONFIDENCE_BASIS_MISSING"
  | "CONFIDENCE_OUT_OF_RANGE"
  | "EVIDENCE_REFS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "INVALID_STATE"
  | "INVALID_STATE_TRANSITION"
  | "IDENTITY_MUTATION"
  | "EXPLANATION_MISSING"
  | "OPERATOR_REVIEW_FLAG_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION";

export type GovernanceRiskSourceDefinition = Readonly<{
  risk_source_type: GovernanceRiskSourceType;
  description: string;
  allowed_risk_categories: readonly GovernanceRiskCategory[];
  requires_evidence_refs: boolean;
  requires_policy_refs: boolean;
  requires_replay_refs: boolean;
  requires_operator_review: boolean;
  source_confidence_weight: number;
  tenant_scoped: true;
  enabled: true;
}>;

export type GovernanceRiskSeverityBasis = Readonly<{
  scoring_model_version: "GOV-RISK-SEVERITY-V1";
  source_inputs: readonly GovernanceRiskSourceType[];
  deterministic_score: number;
  threshold_result: GovernanceRiskSeverity;
  drivers: readonly string[];
}>;

export type GovernanceRiskConfidenceBasis = Readonly<{
  supporting_evidence_count: number;
  source_quality: number;
  lineage_completeness: number;
  replay_status: GovernanceRiskReplayStatus;
  policy_match_strength: number;
  historical_pattern_strength: number;
}>;

export type GovernanceRiskWindow = Readonly<{
  start: string;
  end: string;
  window_type: "30_DAY_ROLLING" | "MISSION_WINDOW" | "CERTIFICATION_WINDOW" | "REPLAY_WINDOW";
}>;

export type GovernanceRiskReplayPackage = Readonly<{
  governance_risk_id: string;
  tenant_id: string;
  mission_id: string;
  contract_version: "GOV-RISK-CONTRACT-V1";
  risk_source_refs: readonly GovernanceRiskSourceType[];
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  severity_model_version: "GOV-RISK-SEVERITY-V1";
  confidence_model_version: "GOV-RISK-CONFIDENCE-V1";
  source_record_hashes: readonly string[];
  reconstruction_hash: string;
}>;

export type GovernanceRiskRecord = Readonly<{
  contract_version: "GOV-RISK-CONTRACT-V1";
  governance_risk_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  policy_intelligence_id: string | null;
  risk_source_refs: readonly GovernanceRiskSourceType[];
  risk_category: GovernanceRiskCategory;
  risk_severity: GovernanceRiskSeverity;
  severity_basis: GovernanceRiskSeverityBasis;
  confidence_score: number;
  confidence_basis: GovernanceRiskConfidenceBasis;
  evidence_refs: readonly string[];
  violation_refs: readonly string[];
  policy_refs: readonly string[];
  exception_refs: readonly string[];
  escalation_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  risk_detected_timestamp: string;
  risk_window: GovernanceRiskWindow;
  risk_state: GovernanceRiskState;
  explanation: string;
  recommended_operator_review: boolean;
  replay_package: GovernanceRiskReplayPackage;
  risk_hash: string;
}>;

export type GovernanceRiskDoctrine = Readonly<{
  principles: readonly ("advisory-only" | "deterministic" | "tenant-isolated" | "evidence-bound" | "lineage-preserving" | "replayable" | "operator-visible" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  allowed_categories: readonly GovernanceRiskCategory[];
  allowed_severities: readonly GovernanceRiskSeverity[];
  allowed_states: readonly GovernanceRiskState[];
  allowed_state_transitions: Readonly<Record<GovernanceRiskState, readonly GovernanceRiskState[]>>;
}>;

export type GovernanceRiskValidationFailure = Readonly<{
  failure_id: string;
  reason: GovernanceRiskFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceRiskValidationResult = Readonly<{
  governance_risk_id?: string;
  validation_state: GovernanceRiskValidationState;
  validator_version: "GOV-RISK-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    risk_sources_registered: boolean;
    category_valid: boolean;
    severity_valid: boolean;
    confidence_valid: boolean;
    evidence_refs_valid: boolean;
    lineage_refs_valid: boolean;
    replay_refs_valid: boolean;
    tenant_isolation_valid: boolean;
    lifecycle_state_valid: boolean;
  }>;
  errors: readonly GovernanceRiskValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceRiskReplayResult = Readonly<{
  replay_id: string;
  governance_risk_id: string;
  validation_state: "PASS" | "FAIL";
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: GovernanceRiskFailureReason | null;
}>;

export type GovernanceRiskObservabilitySurface = Readonly<{
  governance_risk_id: string;
  tenant_id: string;
  mission_id: string;
  risk_category: GovernanceRiskCategory;
  risk_severity: GovernanceRiskSeverity;
  confidence_score: number;
  confidence_basis: GovernanceRiskConfidenceBasis;
  risk_state: GovernanceRiskState;
  recommended_operator_review: boolean;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  validation_failures: readonly GovernanceRiskValidationFailure[];
}>;
