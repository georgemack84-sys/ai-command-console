import type { ComplianceEvaluationScope, ComplianceReplayState, ComplianceType } from "./compliance-contract";
import type { ComplianceEvaluationRecord, ViolationSeverity } from "./compliance-evaluation";

export type ComplianceTrendDirection = "IMPROVING" | "STABLE" | "DEGRADING" | "VOLATILE" | "RECURRING_FAILURE" | "INSUFFICIENT_HISTORY" | "UNKNOWN";
export type ComplianceTrendRiskIndicator = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
export type ComplianceTrendWindowType = "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM" | "CUSTOM" | "CERTIFICATION_WINDOW" | "MISSION_WINDOW" | "PHASE_WINDOW";
export type ComplianceVelocityDirection = "POSITIVE_VELOCITY" | "NEGATIVE_VELOCITY" | "NEUTRAL_VELOCITY" | "VOLATILE_VELOCITY" | "UNKNOWN_VELOCITY";
export type ComplianceStabilityLevel = "HIGHLY_STABLE" | "STABLE" | "MODERATELY_STABLE" | "UNSTABLE" | "CRITICAL_INSTABILITY" | "UNKNOWN";
export type CorrectiveEffectiveness = "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "INEFFECTIVE" | "REGRESSIVE" | "UNKNOWN";
export type CorrectiveActionType = "MITIGATION_APPLIED" | "GOVERNANCE_CORRECTION" | "POLICY_UPDATE" | "AUTHORITY_ADJUSTMENT" | "WORKFLOW_CORRECTION" | "RUNTIME_CONTROL_UPDATE" | "EVIDENCE_REQUIREMENT_UPDATE" | "CERTIFICATION_REMEDIATION";
export type RecurringFailureType = "REPEATED_POLICY_FAILURE" | "REPEATED_CONSTITUTIONAL_VIOLATION" | "REPEATED_AUTHORITY_FAILURE" | "REPEATED_OPERATIONAL_FAILURE" | "REPEATED_RUNTIME_FAILURE" | "REPEATED_REPLAY_FAILURE" | "REPEATED_EVIDENCE_FAILURE" | "REPEATED_CERTIFICATION_FAILURE" | "NONE";
export type HistoricalComparisonType = "CURRENT_VS_PREVIOUS_WINDOW" | "CURRENT_VS_CERTIFIED_BASELINE" | "CURRENT_VS_MISSION_START" | "CURRENT_VS_PRE_CORRECTION" | "CURRENT_VS_POLICY_VERSION" | "CURRENT_VS_AUTHORITY_VERSION" | "CURRENT_VS_HISTORICAL_AVERAGE";
export type ComplianceTrendScenario = "IMPROVING" | "STABLE" | "DEGRADING" | "VOLATILE" | "RECURRING_POLICY_FAILURE" | "RECURRING_CONSTITUTIONAL_VIOLATION" | "RECURRING_AUTHORITY_FAILURE" | "RECURRING_OPERATIONAL_FAILURE" | "EFFECTIVE_CORRECTION" | "INEFFECTIVE_CORRECTION" | "REGRESSIVE_CORRECTION" | "INSUFFICIENT_HISTORY" | "CROSS_TENANT_HISTORY" | "LEDGER_WRITE_FAILURE" | "REPLAY_MISMATCH" | "HIDDEN_STATE";

export type ComplianceTrendWindow = Readonly<{
  trend_window_id: string;
  window_start: string;
  window_end: string;
  window_type: ComplianceTrendWindowType;
  window_selection_hash: string;
}>;

export type ComplianceTrendBaseline = Readonly<{
  baseline_score: number;
  baseline_violation_rate: number;
  baseline_failure_rate: number;
  baseline_correction_time: number;
  baseline_stability_index: number;
  baseline_reference: string;
  baseline_hash: string;
}>;

export type ComplianceScoreMovement = Readonly<{
  average_score: number;
  minimum_score: number;
  maximum_score: number;
  score_delta: number;
  score_direction: "UP" | "DOWN" | "FLAT" | "UNKNOWN";
  score_volatility: number;
  score_recovery_pattern: "RECOVERING" | "DECLINING" | "FLAT" | "VOLATILE" | "UNKNOWN";
  score_movement_hash: string;
}>;

export type ComplianceViolationPattern = Readonly<{
  violation_pattern: string;
  recurring_failure_detected: boolean;
  severity_trend: "IMPROVING" | "STABLE" | "WORSENING" | "VOLATILE" | "UNKNOWN";
  violation_frequency_delta: number;
  violation_count: number;
  pattern_hash: string;
}>;

export type ComplianceFailurePattern = Readonly<{
  failure_pattern_id: string;
  pattern_type: RecurringFailureType;
  recurrence_count: number;
  affected_scope: string;
  affected_components: readonly string[];
  affected_rule: string;
  affected_policy: string;
  first_seen: string;
  last_seen: string;
  severity_progression: readonly ViolationSeverity[];
  corrective_action_attempts: readonly string[];
  pattern_risk_indicator: ComplianceTrendRiskIndicator;
  escalation_required: boolean;
  truth_ledger_reference: string;
  pattern_hash: string;
}>;

export type ComplianceCorrectiveActionTrend = Readonly<{
  corrective_action_id: string;
  corrective_action_type: CorrectiveActionType;
  linked_failure_pattern: string;
  pre_action_score: number;
  post_action_score: number;
  pre_action_violation_rate: number;
  post_action_violation_rate: number;
  recurrence_after_action: number;
  correction_time: number;
  verification_status: "VERIFIED" | "PARTIAL" | "FAILED" | "UNKNOWN";
  corrective_effectiveness: CorrectiveEffectiveness;
  effectiveness_score: number;
  supporting_evidence: readonly string[];
  truth_ledger_reference: string;
  corrective_action_hash: string;
}>;

export type ComplianceVelocity = Readonly<{
  compliance_velocity: ComplianceVelocityDirection;
  velocity_direction: ComplianceVelocityDirection;
  velocity_rate: number;
  velocity_window: string;
  velocity_driver: string;
  velocity_hash: string;
}>;

export type ComplianceStability = Readonly<{
  stability_index: number;
  stability_level: ComplianceStabilityLevel;
  stability_factors: readonly string[];
  instability_drivers: readonly string[];
  historical_stability_comparison: string;
  stability_hash: string;
}>;

export type ComplianceHistoricalComparison = Readonly<{
  historical_comparison_type: HistoricalComparisonType;
  baseline_reference: string;
  current_window_reference: string;
  historical_delta: number;
  comparison_result: "BETTER_THAN_BASELINE" | "WORSE_THAN_BASELINE" | "MATCHES_BASELINE" | "INSUFFICIENT_BASELINE" | "UNKNOWN";
  comparison_explanation: string;
  supporting_evidence: readonly string[];
  comparison_hash: string;
}>;

export type ComplianceTrendRisk = Readonly<{
  risk_indicator: ComplianceTrendRiskIndicator;
  risk_score: number;
  risk_drivers: readonly string[];
  severity_basis: readonly ViolationSeverity[];
  escalation_required: boolean;
  operator_visibility_required: boolean;
  governance_review_required: boolean;
  risk_indicator_hash: string;
}>;

export type ComplianceTrendLedgerRecord = Readonly<{
  trend_ledger_id: string;
  trend_id: string;
  tenant_id: string;
  mission_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  trend_window: ComplianceTrendWindow;
  baseline_reference: string;
  source_evaluation_refs: readonly string[];
  trend_direction: ComplianceTrendDirection;
  risk_indicator: ComplianceTrendRiskIndicator;
  compliance_velocity: ComplianceVelocityDirection;
  stability_index: number;
  corrective_effectiveness: CorrectiveEffectiveness;
  historical_comparison: string;
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  created_timestamp: string;
  trend_hash: string;
}>;

export type ComplianceTrendReplaySnapshot = Readonly<{
  trend_id: string;
  source_evaluations: readonly ComplianceEvaluationRecord[];
  trend_window: ComplianceTrendWindow;
  baseline: ComplianceTrendBaseline;
  score_movement: ComplianceScoreMovement;
  violation_pattern: ComplianceViolationPattern;
  corrective_action_trend: ComplianceCorrectiveActionTrend;
  velocity: ComplianceVelocity;
  stability: ComplianceStability;
  historical_comparison: ComplianceHistoricalComparison;
  classification_logic_version: "COMPLIANCE-TREND-CLASSIFIER-V1";
  risk_logic_version: "COMPLIANCE-TREND-RISK-V1";
  expected_trend_direction: ComplianceTrendDirection;
  expected_risk_indicator: ComplianceTrendRiskIndicator;
  replay_hash: string;
}>;

export type ComplianceTrendRecord = Readonly<{
  contract_version: "COMPLIANCE-TREND-V1";
  trend_id: string;
  tenant_id: string;
  mission_id: string;
  evaluation_scope: ComplianceEvaluationScope;
  compliance_type: ComplianceType;
  trend_window: ComplianceTrendWindow;
  baseline_reference: string;
  source_evaluation_refs: readonly string[];
  source_violation_refs: readonly string[];
  source_corrective_action_refs: readonly string[];
  trend_direction: ComplianceTrendDirection;
  trend_confidence: number;
  trend_reason: string;
  risk_indicator: ComplianceTrendRisk;
  compliance_velocity: ComplianceVelocity;
  stability_index: ComplianceStability;
  corrective_effectiveness: ComplianceCorrectiveActionTrend;
  historical_comparison: ComplianceHistoricalComparison;
  score_movement: ComplianceScoreMovement;
  violation_pattern: ComplianceViolationPattern;
  failure_pattern: ComplianceFailurePattern;
  supporting_evidence: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  truth_ledger_reference: string;
  trend_timestamp: string;
  trend_ledger_record: ComplianceTrendLedgerRecord;
  replay_snapshot: ComplianceTrendReplaySnapshot;
  trend_hash: string;
}>;

export type ComplianceTrendDoctrine = Readonly<{
  principles: readonly ("deterministic" | "explainable" | "replayable" | "tenant-scoped" | "evidence-backed" | "fail-closed" | "operator-visible")[];
  trend_directions: readonly ComplianceTrendDirection[];
  risk_indicators: readonly ComplianceTrendRiskIndicator[];
  pipeline_stages: readonly string[];
  contract_version: "COMPLIANCE-TREND-V1";
}>;

export type ComplianceTrendFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "TREND_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "HISTORY_MISSING"
  | "BASELINE_MISSING"
  | "SOURCE_EVALUATION_INVALID"
  | "SCORE_MOVEMENT_MISMATCH"
  | "CORRECTIVE_EFFECTIVENESS_MISMATCH"
  | "VELOCITY_MISMATCH"
  | "STABILITY_MISMATCH"
  | "HISTORICAL_COMPARISON_MISMATCH"
  | "RISK_INDICATOR_MISMATCH"
  | "TENANT_SCOPE_VIOLATION"
  | "LINEAGE_REFERENCE_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "TRUTH_LEDGER_REFERENCE_MISSING"
  | "LEDGER_WRITE_FAILED"
  | "REPLAY_MISMATCH"
  | "HIDDEN_STATE_DETECTED"
  | "TREND_HASH_MISMATCH";

export type ComplianceTrendValidationState = "VALID" | "INSUFFICIENT_HISTORY" | "UNKNOWN" | "TENANT_SCOPE_VIOLATION" | "CERTIFICATION_BLOCKED" | "REPLAY_MISMATCH" | "INVALID";

export type ComplianceTrendValidationFailure = Readonly<{
  failure_id: string;
  reason: ComplianceTrendFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type ComplianceTrendValidationResult = Readonly<{
  trend_id?: string;
  validation_state: ComplianceTrendValidationState;
  validator_version: "COMPLIANCE-TREND-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    history_present: boolean;
    baseline_present: boolean;
    source_evaluations_valid: boolean;
    score_movement_reproducible: boolean;
    corrective_effectiveness_reproducible: boolean;
    velocity_reproducible: boolean;
    stability_reproducible: boolean;
    historical_comparison_reproducible: boolean;
    risk_indicator_reproducible: boolean;
    ledger_recorded: boolean;
    replay_snapshot_present: boolean;
    tenant_isolation_valid: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly ComplianceTrendValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type ComplianceTrendReplayResult = Readonly<{
  replay_id: string;
  trend_id: string;
  replay_state: ComplianceReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_trend_direction: ComplianceTrendDirection;
  expected_trend_direction: ComplianceTrendDirection;
  failure_reason: ComplianceTrendFailureReason | null;
}>;

export type ComplianceTrendObservabilitySurface = Readonly<{
  trend_id: string;
  trend_direction: ComplianceTrendDirection;
  risk_indicator: ComplianceTrendRiskIndicator;
  compliance_velocity: ComplianceVelocityDirection;
  stability_index: number;
  stability_level: ComplianceStabilityLevel;
  corrective_effectiveness: CorrectiveEffectiveness;
  historical_comparison: string;
  recurring_failure_patterns: readonly ComplianceFailurePattern[];
  improving_areas: readonly string[];
  degrading_areas: readonly string[];
  open_corrective_actions: readonly string[];
  resolved_corrective_actions: readonly string[];
  supporting_evidence: readonly string[];
  replay_state: ComplianceReplayState;
  truth_ledger_reference: string;
  validation_failures: readonly ComplianceTrendFailureReason[];
}>;
