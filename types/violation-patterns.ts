import type { GovernanceRiskReplayStatus } from "./governance-risk";

export type ViolationPatternType =
  | "RECURRING_POLICY_VIOLATION"
  | "RECURRING_CONTROL_VIOLATION"
  | "RECURRING_GOVERNANCE_BOUNDARY_VIOLATION"
  | "RECURRING_TENANT_RULE_VIOLATION"
  | "RECURRING_AUTHORITY_SCOPE_VIOLATION"
  | "POLICY_DRIFT"
  | "AUTHORITY_DRIFT"
  | "ESCALATION_TREND"
  | "EXCEPTION_RECURRENCE"
  | "OVERRIDE_RECURRENCE"
  | "UNRESOLVED_GOVERNANCE_EVENT_RECURRENCE"
  | "RISING_CONTAINMENT_EVENT_PATTERN"
  | "POLICY_CONFLICT_RECURRENCE"
  | "OPERATOR_INTERVENTION_RECURRENCE"
  | "CERTIFICATION_FAILURE_RECURRENCE"
  | "REPLAY_MISMATCH_RECURRENCE"
  | "LINEAGE_BREAK_RECURRENCE"
  | "EVIDENCE_GAP_RECURRENCE";

export type ViolationPatternState = "DETECTED" | "VALIDATED" | "LINKED_TO_RISK" | "SUPERSEDED" | "DISMISSED" | "ARCHIVED";
export type ViolationTrendDirection = "INCREASING" | "DECREASING" | "STABLE" | "VOLATILE" | "NEW" | "INSUFFICIENT_HISTORY";
export type ViolationPatternStrength = "WEAK" | "MODERATE" | "STRONG" | "SEVERE";
export type ViolationPatternWindowType = "7_DAY_ROLLING" | "30_DAY_ROLLING" | "60_DAY_ROLLING" | "90_DAY_ROLLING" | "MISSION_LIFECYCLE" | "POLICY_VERSION_LIFECYCLE" | "CERTIFICATION_CYCLE" | "CUSTOM_OPERATOR_DEFINED";
export type NormalizedGovernanceEventType =
  | "POLICY_VIOLATION"
  | "CONTROL_VIOLATION"
  | "GOVERNANCE_BOUNDARY_VIOLATION"
  | "TENANT_RULE_VIOLATION"
  | "AUTHORITY_SCOPE_VIOLATION"
  | "POLICY_DRIFT_SIGNAL"
  | "AUTHORITY_DRIFT_SIGNAL"
  | "ESCALATION_EVENT"
  | "EXCEPTION_EVENT"
  | "OVERRIDE_EVENT"
  | "UNRESOLVED_GOVERNANCE_EVENT"
  | "CONTAINMENT_EVENT"
  | "POLICY_CONFLICT"
  | "OPERATOR_INTERVENTION"
  | "CERTIFICATION_FAILURE"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BREAK"
  | "EVIDENCE_GAP";

export type ViolationPatternValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "LINEAGE_REFERENCE_MISSING" | "REPLAY_REFERENCE_MISSING" | "INVALID_STATE" | "REPLAY_MISMATCH";

export type ViolationPatternFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "REQUIRED_FIELD_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "PATTERN_ID_MISSING"
  | "INVALID_PATTERN_TYPE"
  | "INVALID_TREND_DIRECTION"
  | "INVALID_PATTERN_STRENGTH"
  | "INVALID_PATTERN_STATE"
  | "INVALID_STATE_TRANSITION"
  | "TIME_WINDOW_MISSING"
  | "BASELINE_MISSING"
  | "CONFIDENCE_SCORE_MISSING"
  | "CONFIDENCE_OUT_OF_RANGE"
  | "CONFIDENCE_BASIS_MISSING"
  | "EVIDENCE_REFS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "DETECTION_MODEL_VERSION_MISSING"
  | "CONFIDENCE_MODEL_VERSION_MISSING"
  | "EXPLANATION_MISSING"
  | "OPERATOR_REVIEW_FLAG_MISSING"
  | "PATTERN_HASH_MISMATCH"
  | "IDENTITY_MUTATION"
  | "HIDDEN_DETECTION_STATE";

export type ViolationPatternWindow = Readonly<{
  start: string;
  end: string;
  window_type: ViolationPatternWindowType;
}>;

export type NormalizedGovernanceEvent = Readonly<{
  source_record_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: NormalizedGovernanceEventType;
  event_timestamp: string;
  policy_ref?: string;
  control_ref?: string;
  authority_ref?: string;
  exception_ref?: string;
  escalation_ref?: string;
  certification_ref?: string;
  replay_mismatch_ref?: string;
  containment_ref?: string;
  operator_intervention_ref?: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  severity_weight: number;
  source_hash: string;
  attributes: Readonly<Record<string, string | number | boolean>>;
}>;

export type ViolationPatternConfidenceBasis = Readonly<{
  supporting_evidence_count: number;
  source_quality: number;
  lineage_completeness: number;
  replay_status: GovernanceRiskReplayStatus;
  policy_match_strength: number;
  historical_pattern_strength: number;
  time_window_completeness: number;
  reference_integrity: number;
}>;

export type ViolationPatternReplayPackage = Readonly<{
  violation_pattern_id: string;
  tenant_id: string;
  mission_id: string;
  contract_version: "VIOLATION-PATTERN-CONTRACT-V1";
  normalized_event_hashes: readonly string[];
  time_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow | null;
  detection_model_version: "VIOLATION-PATTERN-DETECTOR-V1";
  confidence_model_version: "VIOLATION-PATTERN-CONFIDENCE-V1";
  reconstruction_hash: string;
}>;

export type ViolationPatternRecord = Readonly<{
  contract_version: "VIOLATION-PATTERN-CONTRACT-V1";
  violation_pattern_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  policy_intelligence_id: string | null;
  pattern_type: ViolationPatternType;
  pattern_state: ViolationPatternState;
  risk_candidate: boolean;
  related_policy_refs: readonly string[];
  related_violation_refs: readonly string[];
  related_exception_refs: readonly string[];
  related_escalation_refs: readonly string[];
  related_authority_refs: readonly string[];
  related_certification_refs: readonly string[];
  related_replay_mismatch_refs: readonly string[];
  related_containment_refs: readonly string[];
  related_operator_intervention_refs: readonly string[];
  frequency: number;
  baseline_frequency: number;
  frequency_delta: number;
  time_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow | null;
  trend_direction: ViolationTrendDirection;
  pattern_strength: ViolationPatternStrength;
  confidence_score: number;
  confidence_basis: ViolationPatternConfidenceBasis;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  detection_model_version: "VIOLATION-PATTERN-DETECTOR-V1";
  confidence_model_version: "VIOLATION-PATTERN-CONFIDENCE-V1";
  replay_package: ViolationPatternReplayPackage;
  explanation: string;
  recommended_operator_review: boolean;
  created_timestamp: string;
  pattern_hash: string;
}>;

export type ViolationPatternDoctrine = Readonly<{
  principles: readonly ("deterministic" | "tenant-scoped" | "evidence-bound" | "replay-ready" | "operator-visible" | "advisory-only" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  allowed_pattern_types: readonly ViolationPatternType[];
  allowed_trend_directions: readonly ViolationTrendDirection[];
  allowed_pattern_strengths: readonly ViolationPatternStrength[];
  allowed_states: readonly ViolationPatternState[];
  allowed_state_transitions: Readonly<Record<ViolationPatternState, readonly ViolationPatternState[]>>;
}>;

export type ViolationPatternValidationFailure = Readonly<{
  failure_id: string;
  reason: ViolationPatternFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ViolationPatternValidationResult = Readonly<{
  violation_pattern_id?: string;
  validation_state: ViolationPatternValidationState;
  validator_version: "VIOLATION-PATTERN-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    pattern_type_valid: boolean;
    trend_valid: boolean;
    strength_valid: boolean;
    confidence_valid: boolean;
    evidence_refs_valid: boolean;
    lineage_refs_valid: boolean;
    replay_refs_valid: boolean;
    tenant_isolation_valid: boolean;
    lifecycle_state_valid: boolean;
  }>;
  errors: readonly ViolationPatternValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ViolationPatternReplayResult = Readonly<{
  replay_id: string;
  violation_pattern_id: string;
  validation_state: "PASS" | "FAIL";
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: ViolationPatternFailureReason | null;
}>;

export type ViolationPatternDetectionResult = Readonly<{
  detector_version: "VIOLATION-PATTERN-DETECTOR-V1";
  tenant_id: string;
  mission_id: string;
  time_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow;
  normalized_events: readonly NormalizedGovernanceEvent[];
  patterns: readonly ViolationPatternRecord[];
}>;

export type ViolationPatternObservabilitySurface = Readonly<{
  violation_pattern_id: string;
  tenant_id: string;
  mission_id: string;
  pattern_type: ViolationPatternType;
  pattern_strength: ViolationPatternStrength;
  confidence_score: number;
  trend_direction: ViolationTrendDirection;
  frequency: number;
  baseline_frequency: number;
  time_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow | null;
  related_policy_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  replay_status: GovernanceRiskReplayStatus;
  model_versions: Readonly<{ detection_model_version: string; confidence_model_version: string }>;
  explanation: string;
  risk_candidate: boolean;
  recommended_operator_review: boolean;
  validation_failures: readonly ViolationPatternValidationFailure[];
}>;
