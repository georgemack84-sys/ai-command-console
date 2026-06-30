import type { DriftIntelligenceRecord, DriftScenario, DriftSeverity } from "@/types/drift-detection-trend-intelligence-engine";

export type AssuranceRecommendationType = "CONTINUE" | "MONITOR_CLOSELY" | "OPERATOR_REVIEW" | "INCREASE_SUPERVISION" | "CREATE_CHECKPOINT" | "PAUSE" | "ROLLBACK" | "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_REVIEW" | "TERMINATE_RECOMMENDATION";
export type AssuranceRecommendationSeverity = "INFO" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL";
export type AssuranceRecommendationState = "PUBLISHED" | "REQUIRES_OPERATOR" | "REQUIRES_GOVERNANCE" | "REQUIRES_CONSTITUTIONAL_REVIEW" | "CERTIFIED_ADVISORY";
export type AssuranceRecommendationLifecycleStage = "COLLECT_ASSURANCE_SIGNALS" | "VALIDATE_INPUTS" | "CLASSIFY_RECOMMENDATION" | "EVALUATE_RISK_AND_SEVERITY" | "MAP_GOVERNANCE_JUSTIFICATION" | "MAP_CONSTITUTIONAL_REFERENCES" | "GENERATE_ALTERNATIVES" | "GENERATE_EXPLANATION" | "VALIDATE_REPLAY" | "PUBLISH_RECOMMENDATION";
export type AssuranceRecommendationScenario = "BASELINE" | "EARLY_DEGRADATION" | "HUMAN_JUDGMENT_REQUIRED" | "MONITORING_INSUFFICIENT" | "PRESERVE_STATE" | "UNSAFE_CONTINUATION" | "KNOWN_GOOD_STATE_PREFERRED" | "GOVERNANCE_CONCERN" | "CONSTITUTIONAL_CONCERN" | "CRITICAL_FAILURE" | "MISSING_EVIDENCE" | "REPLAY_MISMATCH" | "EXECUTION_AUTHORITY_ATTEMPT";
export type AssuranceRecommendationFailure = "MISSING_RECOMMENDATION_TYPE" | "MISSING_SEVERITY" | "MISSING_REASONING" | "MISSING_EVIDENCE" | "MISSING_CONFIDENCE" | "MISSING_RISKS" | "MISSING_ALTERNATIVES" | "MISSING_GOVERNANCE_JUSTIFICATION" | "MISSING_CONSTITUTIONAL_REFERENCES" | "REPLAY_MISMATCH" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "UNAUTHORIZED_EXECUTION_CAPABILITY";

export type AssuranceRecommendationExplanation = Readonly<{
  summary: string;
  primary_reason: string;
  supporting_signals: readonly string[];
  risk_analysis: string;
  alternative_analysis: string;
  governance_basis: string;
  constitutional_basis: string;
  operator_visibility_note: string;
  explanation_hash: string;
}>;

export type AssuranceRecommendationAlternative = Readonly<{
  alternative_id: string;
  recommendation_type: AssuranceRecommendationType;
  accepted: boolean;
  tradeoff: string;
  safety_comparison: string;
  alternative_hash: string;
}>;

export type AssuranceRecommendationRecord = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  engine_version: "assurance-recommendation-engine/v8ALT.1E";
  lifecycle: readonly AssuranceRecommendationLifecycleStage[];
  recommendation_type: AssuranceRecommendationType;
  recommendation_severity: AssuranceRecommendationSeverity;
  recommendation_state: AssuranceRecommendationState;
  runtime_context: string;
  assurance_state: string;
  confidence_score: number;
  runtime_health_score: number;
  drift_severity: DriftSeverity;
  risk_level: AssuranceRecommendationSeverity;
  reasoning: readonly string[];
  evidence: readonly string[];
  confidence: number;
  risks: readonly string[];
  alternatives: readonly AssuranceRecommendationAlternative[];
  governance_justification: readonly string[];
  constitutional_references: readonly string[];
  explanation: AssuranceRecommendationExplanation;
  operator_required: boolean;
  recommended_next_review: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  operator_overridden: boolean;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  created_at: string;
  record_hash: string;
}>;

export type AssuranceRecommendationInput = Readonly<{
  scenario?: AssuranceRecommendationScenario;
  drift?: DriftIntelligenceRecord;
}>;

export type AssuranceRecommendationReplayResult = Readonly<{
  replay_id: string;
  recommendation_id: string;
  deterministic: boolean;
  reconstructed_type: AssuranceRecommendationType;
  reconstructed_severity: AssuranceRecommendationSeverity;
  reconstructed_explanation_hash: string;
  reconstructed_integrity_hash: string;
  replay_failures: readonly AssuranceRecommendationFailure[];
  replay_hash: string;
}>;

export type AssuranceRecommendationValidationResult = Readonly<{
  recommendation_id: string | null;
  valid: boolean;
  recommendation_complete: boolean;
  evidence_complete: boolean;
  alternatives_complete: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  advisory_only: boolean;
  failures: readonly AssuranceRecommendationFailure[];
  validation_hash: string;
}>;

export type AssuranceRecommendationCertification = Readonly<{
  certification_id: string;
  recommendation_id: string;
  certified: boolean;
  validation: AssuranceRecommendationValidationResult;
  ready_for_assurance_state_manager: boolean;
  certification_hash: string;
}>;

export type AssuranceRecommendationPublisherSurface = Readonly<{
  recommendation_id: string;
  recommendation_type: AssuranceRecommendationType;
  recommendation_severity: AssuranceRecommendationSeverity;
  recommendation_state: AssuranceRecommendationState;
  operator_required: boolean;
  risk_level: AssuranceRecommendationSeverity;
  summary: string;
  alternatives: readonly AssuranceRecommendationAlternative[];
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
}>;

export type AssuranceRecommendationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "assurance-recommendation-engine/v8ALT.1E";
    principles: readonly string[];
    lifecycle: readonly AssuranceRecommendationLifecycleStage[];
    recommendation_types: readonly AssuranceRecommendationType[];
    severity_levels: readonly AssuranceRecommendationSeverity[];
    restrictions: readonly string[];
    advisory_only: true;
  }>;
  recommendation: AssuranceRecommendationRecord;
  validation: AssuranceRecommendationValidationResult;
  replay: AssuranceRecommendationReplayResult;
  certification: AssuranceRecommendationCertification;
}>;

export type AssuranceRecommendationScenarioMap = Readonly<Record<AssuranceRecommendationScenario, DriftScenario>>;
