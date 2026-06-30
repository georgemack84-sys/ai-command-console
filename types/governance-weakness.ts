import type { GovernanceRiskReplayStatus } from "./governance-risk";
import type { ViolationPatternRecord, ViolationPatternWindow, ViolationPatternType } from "./violation-patterns";

export type GovernanceWeaknessCategory =
  | "WEAK_CONTROL"
  | "MISSING_CONTROL"
  | "AMBIGUOUS_POLICY"
  | "UNRESOLVED_POLICY_CONFLICT"
  | "AUTHORITY_BOUNDARY_WEAKNESS"
  | "ESCALATION_PATH_WEAKNESS"
  | "OVERSIGHT_DEFICIENCY"
  | "REPEATED_EXCEPTION_DEPENDENCY"
  | "CERTIFICATION_GAP"
  | "REPLAY_GAP"
  | "LINEAGE_GAP"
  | "EVIDENCE_GAP"
  | "VISIBILITY_GAP"
  | "TENANT_BOUNDARY_WEAKNESS";

export type GovernanceWeaknessType =
  | "CONTROL_ALLOWS_RECURRING_VIOLATIONS"
  | "CONTROL_ALLOWS_REPEATED_EXCEPTIONS"
  | "POLICY_WITHOUT_ESCALATION_RULE"
  | "VIOLATION_WITHOUT_REVIEW_PATH"
  | "POLICY_REQUIREMENT_AMBIGUOUS"
  | "PERSISTENT_POLICY_CONFLICT"
  | "AUTHORITY_SCOPE_AMBIGUOUS"
  | "AUTHORITY_BOUNDARY_DRIFT_RECURRING"
  | "ESCALATION_PATH_INCONSISTENT"
  | "OPERATOR_REVIEW_DELAY_RECURRING"
  | "EXCEPTION_DEPENDENCY_RECURRING"
  | "CERTIFICATION_FAILURE_STRUCTURAL"
  | "REPLAY_RECONSTRUCTION_GAP"
  | "LINEAGE_RECONSTRUCTION_GAP"
  | "EVIDENCE_COMPLETENESS_GAP"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "CONTAINMENT_PATTERN_WITHOUT_REVIEW"
  | "TENANT_BOUNDARY_VALIDATION_WEAK";

export type GovernanceWeaknessState = "IDENTIFIED" | "VALIDATED" | "READY_FOR_SCORING" | "SUPERSEDED" | "DISMISSED" | "ARCHIVED";
export type GovernanceWeaknessReviewPriority = "WATCH" | "STANDARD_REVIEW" | "PRIORITY_REVIEW" | "IMMEDIATE_REVIEW";
export type GovernanceWeaknessValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "LINEAGE_REFERENCE_MISSING" | "REPLAY_REFERENCE_MISSING" | "INVALID_STATE" | "REPLAY_MISMATCH";
export type GovernanceWeaknessTenantStatus = "VALID" | "INVALID" | "UNKNOWN";
export type GovernanceWeaknessVisibilityStatus = "COMPLETE" | "INCOMPLETE" | "HIDDEN_BASIS";

export type GovernanceWeaknessFailureReason =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "REQUIRED_FIELD_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "WEAKNESS_ID_MISSING"
  | "SUPPORTING_PATTERNS_MISSING"
  | "INVALID_WEAKNESS_CATEGORY"
  | "INVALID_WEAKNESS_TYPE"
  | "INVALID_REVIEW_PRIORITY"
  | "INVALID_STATE"
  | "INVALID_STATE_TRANSITION"
  | "ANALYSIS_WINDOW_MISSING"
  | "CONFIDENCE_SCORE_MISSING"
  | "CONFIDENCE_OUT_OF_RANGE"
  | "CONFIDENCE_BASIS_MISSING"
  | "EVIDENCE_REFS_MISSING"
  | "LINEAGE_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "TENANT_SCOPE_VIOLATION"
  | "ANALYSIS_MODEL_VERSION_MISSING"
  | "CONFIDENCE_MODEL_VERSION_MISSING"
  | "MAPPING_MODEL_VERSION_MISSING"
  | "EXPLANATION_MISSING"
  | "OPERATOR_REVIEW_FLAG_MISSING"
  | "WEAKNESS_HASH_MISMATCH"
  | "IDENTITY_MUTATION"
  | "UNSUPPORTED_EXPLANATION";

export type GovernanceWeaknessIndicators = Readonly<{
  violation_frequency: number;
  violation_severity_profile: Readonly<{ LOW: number; MODERATE: number; HIGH: number; CRITICAL: number }>;
  repeat_exception_count: number;
  policy_conflict_recurrence: boolean;
  drift_direction: string;
  authority_mismatch_count: number;
  missing_escalation_count: number;
  replay_mismatch_count: number;
  lineage_break_count: number;
  certification_failure_count: number;
  evidence_completeness: number;
  operator_visibility_status: GovernanceWeaknessVisibilityStatus;
  tenant_isolation_status: GovernanceWeaknessTenantStatus;
}>;

export type GovernanceWeaknessConfidenceBasis = Readonly<{
  supporting_pattern_count: number;
  supporting_evidence_count: number;
  source_quality: number;
  pattern_confidence_average: number;
  lineage_completeness: number;
  replay_status: GovernanceRiskReplayStatus;
  policy_match_strength: number;
  control_match_strength: number;
  historical_recurrence_strength: number;
  evidence_completeness: number;
  tenant_validation_status: GovernanceWeaknessTenantStatus;
}>;

export type GovernanceWeaknessReplayPackage = Readonly<{
  governance_weakness_id: string;
  tenant_id: string;
  mission_id: string;
  contract_version: "GOV-WEAKNESS-CONTRACT-V1";
  supporting_pattern_hashes: readonly string[];
  analysis_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow | null;
  mapping_model_version: "GOV-WEAKNESS-MAPPING-V1";
  analysis_model_version: "GOV-WEAKNESS-ANALYSIS-V1";
  confidence_model_version: "GOV-WEAKNESS-CONFIDENCE-V1";
  reconstruction_hash: string;
}>;

export type GovernanceWeaknessRecord = Readonly<{
  contract_version: "GOV-WEAKNESS-CONTRACT-V1";
  governance_weakness_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  policy_intelligence_id: string | null;
  weakness_type: GovernanceWeaknessType;
  weakness_category: GovernanceWeaknessCategory;
  weakness_state: GovernanceWeaknessState;
  supporting_patterns: readonly ViolationPatternRecord[];
  related_policies: readonly string[];
  related_controls: readonly string[];
  related_authority_scopes: readonly string[];
  related_violations: readonly string[];
  related_exceptions: readonly string[];
  related_escalations: readonly string[];
  related_certification_results: readonly string[];
  related_replay_records: readonly string[];
  related_operator_reviews: readonly string[];
  related_containment_events: readonly string[];
  analysis_window: ViolationPatternWindow;
  comparison_window: ViolationPatternWindow | null;
  weakness_indicators: GovernanceWeaknessIndicators;
  confidence_score: number;
  confidence_basis: GovernanceWeaknessConfidenceBasis;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  mapping_model_version: "GOV-WEAKNESS-MAPPING-V1";
  analysis_model_version: "GOV-WEAKNESS-ANALYSIS-V1";
  confidence_model_version: "GOV-WEAKNESS-CONFIDENCE-V1";
  replay_package: GovernanceWeaknessReplayPackage;
  explanation: string;
  recommended_review_priority: GovernanceWeaknessReviewPriority;
  recommended_operator_review: boolean;
  created_timestamp: string;
  weakness_hash: string;
}>;

export type GovernanceWeaknessDoctrine = Readonly<{
  principles: readonly ("deterministic" | "evidence-backed" | "tenant-scoped" | "lineage-preserving" | "replayable" | "operator-visible" | "advisory-only" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  allowed_categories: readonly GovernanceWeaknessCategory[];
  allowed_types: readonly GovernanceWeaknessType[];
  allowed_states: readonly GovernanceWeaknessState[];
  allowed_review_priorities: readonly GovernanceWeaknessReviewPriority[];
  allowed_state_transitions: Readonly<Record<GovernanceWeaknessState, readonly GovernanceWeaknessState[]>>;
}>;

export type GovernanceWeaknessMappingRule = Readonly<{
  pattern_type: ViolationPatternType;
  weakness_category: GovernanceWeaknessCategory;
  weakness_type: GovernanceWeaknessType;
  review_priority_floor: GovernanceWeaknessReviewPriority;
}>;

export type GovernanceWeaknessValidationFailure = Readonly<{
  failure_id: string;
  reason: GovernanceWeaknessFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type GovernanceWeaknessValidationResult = Readonly<{
  governance_weakness_id?: string;
  validation_state: GovernanceWeaknessValidationState;
  validator_version: "GOV-WEAKNESS-VALIDATOR-V1";
  checks: Readonly<{
    schema_valid: boolean;
    required_fields_present: boolean;
    weakness_category_valid: boolean;
    weakness_type_valid: boolean;
    confidence_valid: boolean;
    review_priority_valid: boolean;
    evidence_refs_valid: boolean;
    lineage_refs_valid: boolean;
    replay_refs_valid: boolean;
    tenant_isolation_valid: boolean;
    lifecycle_state_valid: boolean;
  }>;
  errors: readonly GovernanceWeaknessValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type GovernanceWeaknessReplayResult = Readonly<{
  replay_id: string;
  governance_weakness_id: string;
  validation_state: "PASS" | "FAIL";
  reconstructed_hash: string;
  expected_hash: string;
  failure_reason: GovernanceWeaknessFailureReason | null;
}>;

export type GovernanceWeaknessAnalysisResult = Readonly<{
  analyzer_version: "GOV-WEAKNESS-ANALYSIS-V1";
  tenant_id: string;
  mission_id: string;
  mapping_model_version: "GOV-WEAKNESS-MAPPING-V1";
  source_pattern_count: number;
  weaknesses: readonly GovernanceWeaknessRecord[];
}>;

export type GovernanceWeaknessObservabilitySurface = Readonly<{
  governance_weakness_id: string;
  tenant_id: string;
  mission_id: string;
  weakness_category: GovernanceWeaknessCategory;
  weakness_type: GovernanceWeaknessType;
  weakness_state: GovernanceWeaknessState;
  supporting_pattern_ids: readonly string[];
  related_policies: readonly string[];
  related_controls: readonly string[];
  related_authority_scopes: readonly string[];
  related_violations: readonly string[];
  related_exceptions: readonly string[];
  related_escalations: readonly string[];
  related_certification_results: readonly string[];
  related_replay_records: readonly string[];
  related_containment_events: readonly string[];
  analysis_window: ViolationPatternWindow;
  weakness_indicators: GovernanceWeaknessIndicators;
  confidence_score: number;
  confidence_basis: GovernanceWeaknessConfidenceBasis;
  recommended_review_priority: GovernanceWeaknessReviewPriority;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  replay_status: GovernanceRiskReplayStatus;
  model_versions: Readonly<{ mapping_model_version: string; analysis_model_version: string; confidence_model_version: string }>;
  explanation: string;
  validation_failures: readonly GovernanceWeaknessValidationFailure[];
}>;
