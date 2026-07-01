import type { GovernanceRiskCategory, GovernanceRiskSeverity, GovernanceRiskWindow, GovernanceRiskReplayStatus } from "./governance-risk";
import type { GovernanceWeaknessReviewPriority, GovernanceWeaknessCategory } from "./governance-weakness";
import type { ViolationPatternStrength, ViolationTrendDirection } from "./violation-patterns";

export type GovernanceRiskScoreState = "SCORED" | "VALIDATED" | "UNDER_REVIEW" | "MITIGATED" | "SUPERSEDED" | "DISMISSED" | "ARCHIVED";
export type GovernanceRiskScoringValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "LINEAGE_REFERENCE_MISSING" | "REPLAY_REFERENCE_MISSING" | "INVALID_STATE" | "REPLAY_MISMATCH";
export type ControlImportance = "LOW_IMPORTANCE" | "STANDARD_IMPORTANCE" | "HIGH_IMPORTANCE" | "CRITICAL_IMPORTANCE";
export type PolicyCriticality = "LOW" | "STANDARD" | "HIGH" | "CRITICAL";
export type AuthorityImpact = "NONE" | "MINOR" | "MATERIAL" | "SEVERE";
export type TenantIsolationImpact = "NONE" | "POTENTIAL" | "CONFIRMED" | "SEVERE";
export type ReplayImpact = "NONE" | "PARTIAL" | "MISMATCH" | "UNREPLAYABLE";
export type CertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL" | "NOT_TESTED";
export type OperatorVisibilityStatus = "COMPLETE" | "PARTIAL" | "INCOMPLETE" | "HIDDEN";
export type HistoricalRecurrence = "NONE" | "LOW" | "MODERATE" | "HIGH" | "SYSTEMIC";

export type GovernanceRiskScoringFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "REQUIRED_FIELD_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "RISK_ID_MISSING"
  | "SCORING_INPUTS_MISSING"
  | "UNKNOWN_RISK_CATEGORY"
  | "UNKNOWN_WEAKNESS_CATEGORY"
  | "INVALID_PATTERN_STRENGTH"
  | "INVALID_TREND_DIRECTION"
  | "INVALID_SEVERITY"
  | "INVALID_STATE"
  | "INVALID_STATE_TRANSITION"
  | "INVALID_RISK_SCORE"
  | "BASE_SCORE_MISMATCH"
  | "MODIFIER_SCORE_MISMATCH"
  | "THRESHOLD_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "SCORING_MODEL_VERSION_MISSING"
  | "CONFIDENCE_MODEL_VERSION_MISSING"
  | "THRESHOLD_VERSION_MISSING"
  | "DRIVER_MODEL_VERSION_MISSING"
  | "EXPLANATION_MODEL_VERSION_MISSING"
  | "CONFIDENCE_BASIS_MISSING"
  | "EVIDENCE_SUMMARY_MISSING"
  | "RISK_DRIVERS_MISSING"
  | "RISK_DRIVER_EVIDENCE_MISSING"
  | "EVIDENCE_REFS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "SOURCE_HASHES_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "HIDDEN_SCORING_STATE"
  | "UNSUPPORTED_EXPLANATION"
  | "RISK_HASH_MISMATCH"
  | "IDENTITY_MUTATION"
  | "OPERATOR_REVIEW_FLAG_MISSING";

export type NormalizedRiskScoringInputs = Readonly<{
  risk_source_severity: GovernanceRiskSeverity;
  pattern_frequency: number;
  pattern_trend: ViolationTrendDirection;
  pattern_strength: ViolationPatternStrength;
  weakness_category: GovernanceWeaknessCategory;
  control_importance: ControlImportance;
  policy_criticality: PolicyCriticality;
  authority_impact: AuthorityImpact;
  tenant_isolation_impact: TenantIsolationImpact;
  replay_impact: ReplayImpact;
  lineage_completeness: number;
  evidence_completeness: number;
  certification_status: CertificationStatus;
  operator_visibility_status: OperatorVisibilityStatus;
  historical_recurrence: HistoricalRecurrence;
}>;

export type RiskScoringBasis = Readonly<{
  scoring_model_version: "GOV-RISK-SCORE-V1";
  confidence_model_version: "GOV-RISK-CONFIDENCE-V1";
  severity_threshold_version: "GOV-RISK-THRESHOLD-V1";
  base_score: number;
  modifier_score: number;
  final_score: number;
  severity_threshold_result: GovernanceRiskSeverity;
  scoring_inputs: NormalizedRiskScoringInputs;
  scoring_rules_applied: readonly string[];
  critical_floor_rules_applied: readonly string[];
}>;

export type RiskDriver = Readonly<{
  driver_type: string;
  driver_description: string;
  score_impact: number;
  evidence_refs: readonly string[];
}>;

export type RiskEvidenceSummary = Readonly<{
  supporting_evidence_count: number;
  policy_refs_count: number;
  violation_refs_count: number;
  exception_refs_count: number;
  escalation_refs_count: number;
  related_pattern_count: number;
  related_weakness_count: number;
  replay_refs_count: number;
  lineage_refs_count: number;
  evidence_completeness: number;
  strongest_evidence_refs: readonly string[];
  weakest_evidence_refs: readonly string[];
  missing_evidence: readonly string[];
}>;

export type RiskScoreConfidenceBasis = Readonly<{
  evidence_completeness: number;
  source_reliability: number;
  lineage_completeness: number;
  replay_success: number;
  policy_match_strength: number;
  pattern_strength: number;
  weakness_confidence: number;
  data_consistency: number;
}>;

export type GovernanceRiskScoreReplayPackage = Readonly<{
  governance_risk_id: string;
  tenant_id: string;
  mission_id: string;
  scoring_model_version: "GOV-RISK-SCORE-V1";
  confidence_model_version: "GOV-RISK-CONFIDENCE-V1";
  severity_threshold_version: "GOV-RISK-THRESHOLD-V1";
  driver_extraction_model_version: "GOV-RISK-DRIVER-V1";
  explanation_model_version: "GOV-RISK-EXPLANATION-V1";
  scoring_input_refs: Readonly<{
    policy_refs: readonly string[];
    violation_refs: readonly string[];
    exception_refs: readonly string[];
    escalation_refs: readonly string[];
    pattern_refs: readonly string[];
    weakness_refs: readonly string[];
    evidence_refs: readonly string[];
    lineage_refs: readonly string[];
    replay_refs: readonly string[];
    certification_refs: readonly string[];
    operator_visibility_refs: readonly string[];
  }>;
  normalized_scoring_inputs: NormalizedRiskScoringInputs;
  source_record_hashes: readonly string[];
  scoring_result_hash: string;
  risk_hash: string;
}>;

export type GovernanceRiskScoreRecord = Readonly<{
  contract_version: "GOV-RISK-SCORE-CONTRACT-V1";
  governance_risk_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  policy_intelligence_id: string | null;
  governance_weakness_id: string;
  violation_pattern_refs: readonly string[];
  risk_category: GovernanceRiskCategory;
  risk_severity: GovernanceRiskSeverity;
  risk_score: number;
  confidence_score: number;
  confidence_basis: RiskScoreConfidenceBasis;
  scoring_basis: RiskScoringBasis;
  risk_drivers: readonly RiskDriver[];
  evidence_summary: RiskEvidenceSummary;
  related_policies: readonly string[];
  related_controls: readonly string[];
  related_violations: readonly string[];
  related_exceptions: readonly string[];
  related_escalations: readonly string[];
  related_patterns: readonly string[];
  related_weaknesses: readonly string[];
  tenant_isolation_status: "VALID" | "POTENTIAL" | "CONFIRMED" | "SEVERE";
  lineage_status: "COMPLETE" | "PARTIAL" | "BROKEN";
  replay_status: GovernanceRiskReplayStatus;
  certification_status: CertificationStatus;
  operator_visibility_status: OperatorVisibilityStatus;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  risk_detected_timestamp: string;
  risk_window: GovernanceRiskWindow;
  scored_timestamp: string;
  explanation: string;
  recommended_operator_review: boolean;
  recommended_review_priority: GovernanceWeaknessReviewPriority;
  risk_state: GovernanceRiskScoreState;
  scoring_model_version: "GOV-RISK-SCORE-V1";
  confidence_model_version: "GOV-RISK-CONFIDENCE-V1";
  severity_threshold_version: "GOV-RISK-THRESHOLD-V1";
  driver_extraction_model_version: "GOV-RISK-DRIVER-V1";
  explanation_model_version: "GOV-RISK-EXPLANATION-V1";
  risk_replay_package: GovernanceRiskScoreReplayPackage;
  risk_hash: string;
}>;

export type GovernanceRiskScoringDoctrine = Readonly<{
  principles: readonly ("advisory-only" | "deterministic" | "evidence-bound" | "tenant-isolated" | "lineage-preserving" | "replayable" | "operator-visible" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  allowed_severities: readonly GovernanceRiskSeverity[];
  allowed_categories: readonly GovernanceRiskCategory[];
  allowed_states: readonly GovernanceRiskScoreState[];
  allowed_state_transitions: Readonly<Record<GovernanceRiskScoreState, readonly GovernanceRiskScoreState[]>>;
}>;

export type GovernanceRiskScoringValidationFailure = Readonly<{
  failure_id: string;
  reason: GovernanceRiskScoringFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceRiskScoringValidationResult = Readonly<{
  governance_risk_id?: string;
  validation_state: GovernanceRiskScoringValidationState;
  validator_version: "GOV-RISK-SCORE-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    category_valid: boolean;
    severity_valid: boolean;
    scoring_basis_valid: boolean;
    confidence_valid: boolean;
    risk_drivers_valid: boolean;
    evidence_summary_valid: boolean;
    evidence_refs_valid: boolean;
    lineage_refs_valid: boolean;
    replay_refs_valid: boolean;
    tenant_isolation_valid: boolean;
    lifecycle_state_valid: boolean;
  }>;
  errors: readonly GovernanceRiskScoringValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceRiskScoringResult = Readonly<{
  scoring_engine_version: "GOV-RISK-SCORE-V1";
  tenant_id: string;
  mission_id: string;
  scores: readonly GovernanceRiskScoreRecord[];
}>;

export type GovernanceRiskScoreReplayResult = Readonly<{
  replay_id: string;
  governance_risk_id: string;
  validation_state: "PASS" | "FAIL";
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: GovernanceRiskScoringFailureReason | null;
}>;

export type GovernanceRiskScoreObservabilitySurface = Readonly<{
  governance_risk_id: string;
  risk_category: GovernanceRiskCategory;
  risk_severity: GovernanceRiskSeverity;
  risk_score: number;
  confidence_score: number;
  risk_drivers: readonly RiskDriver[];
  base_score: number;
  modifier_score: number;
  critical_floor_rules: readonly string[];
  severity_threshold_version: string;
  scoring_model_version: string;
  confidence_model_version: string;
  evidence_summary: RiskEvidenceSummary;
  related_policies: readonly string[];
  related_controls: readonly string[];
  related_patterns: readonly string[];
  related_weaknesses: readonly string[];
  tenant_isolation_status: string;
  lineage_status: string;
  replay_status: GovernanceRiskReplayStatus;
  certification_status: CertificationStatus;
  operator_visibility_status: OperatorVisibilityStatus;
  recommended_review_priority: GovernanceWeaknessReviewPriority;
  explanation: string;
  validation_failures: readonly GovernanceRiskScoringValidationFailure[];
}>;
