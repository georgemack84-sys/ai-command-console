import type { RiskAdaptationDomain } from "@/types/risk-adaptation-engine-foundation";
import type { RiskDriftResult } from "@/types/risk-drift-detector";
import type { RiskSeverityRecalibrationResult } from "@/types/risk-severity-recalibrator";

export type RiskPatternCategory =
  | "SEVERITY_UNDERESTIMATION"
  | "SEVERITY_OVERESTIMATION"
  | "PROBABILITY_UNDERESTIMATION"
  | "PROBABILITY_OVERESTIMATION"
  | "RECURRING_BLIND_SPOT"
  | "FALSE_ALARM"
  | "MISSED_GOVERNANCE_RISK"
  | "CONSTITUTIONAL_RISK_PATTERN"
  | "MISSION_TYPE_PATTERN"
  | "TENANT_SPECIFIC_PATTERN"
  | "OPERATOR_TENDENCY"
  | "ENVIRONMENTAL_INFLUENCE"
  | "ESCALATION_FAILURE"
  | "ROLLBACK_FAILURE"
  | "COMPOSITE_BEHAVIORAL_PATTERN";

export type RiskPatternRecommendationCategory = "SEVERITY_RECALIBRATION" | "PROBABILITY_RECALIBRATION" | "ENHANCED_MONITORING" | "ADDITIONAL_EVIDENCE" | "GOVERNANCE_REVIEW" | "CONSTITUTIONAL_REVIEW" | "ESCALATION_REFINEMENT" | "ROLLBACK_REFINEMENT" | "SIMULATION_REQUIREMENT" | "DOCUMENTATION_IMPROVEMENT";
export type RiskPatternConfidenceBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskPatternValidationState = "CERTIFIED" | "FAILED" | "PENDING_REPLAY" | "REJECTED";

export type RiskPatternFailure =
  | "MULTIPLE_OBSERVATIONS_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "DETERMINISTIC_CLASSIFICATION_MISSING"
  | "CONFIDENCE_EVALUATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "CONSTITUTIONAL_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_MISSING"
  | "HISTORY_TIMELINE_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"
  | "ESCALATION_THRESHOLD_MUTATION_DETECTED"
  | "ROLLBACK_THRESHOLD_MUTATION_DETECTED"
  | "GOVERNANCE_POLICY_MUTATION_DETECTED"
  | "GOVERNANCE_DECISION_OVERRIDE_DETECTED"
  | "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"
  | "HISTORICAL_EVIDENCE_REWRITE_DETECTED"
  | "MISSION_HISTORY_REWRITE_DETECTED"
  | "CONSTITUTIONAL_RISK_SUPPRESSION_DETECTED"
  | "NONDETERMINISTIC_PATTERN_ANALYSIS"
  | "FAIL_OPEN_BEHAVIOR";

export type RiskPatternScenario =
  | "BASELINE"
  | "SEVERITY_UNDERESTIMATION"
  | "SEVERITY_OVERESTIMATION"
  | "PROBABILITY_UNDERESTIMATION"
  | "PROBABILITY_OVERESTIMATION"
  | "BLIND_SPOT"
  | "FALSE_ALARM"
  | "GOVERNANCE_RISK"
  | "CONSTITUTIONAL_RISK"
  | "MISSION_TYPE"
  | "TENANT_SPECIFIC"
  | "OPERATOR_TENDENCY"
  | "ENVIRONMENTAL"
  | "ESCALATION_FAILURE"
  | "ROLLBACK_FAILURE"
  | "COMPOSITE"
  | "MISSING_OBSERVATIONS"
  | "MISSING_EVIDENCE"
  | "MISSING_CLASSIFICATION"
  | "MISSING_CONFIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "BROKEN_LINEAGE"
  | "MISSING_TIMELINE"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "PRODUCTION_MUTATION"
  | "ESCALATION_THRESHOLD_MUTATION"
  | "ROLLBACK_THRESHOLD_MUTATION"
  | "GOVERNANCE_POLICY_MUTATION"
  | "GOVERNANCE_DECISION_OVERRIDE"
  | "OPERATOR_OVERRIDE"
  | "EVIDENCE_REWRITE"
  | "MISSION_HISTORY_REWRITE"
  | "CONSTITUTIONAL_SUPPRESSION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type RiskPatternRecord = Readonly<{
  risk_pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  risk_domain: RiskAdaptationDomain;
  pattern_category: RiskPatternCategory;
  pattern_name: string;
  pattern_description: string;
  pattern_frequency: number;
  historical_occurrence_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  pattern_confidence: number;
  governance_impact: string;
  constitutional_impact: string;
  operator_impact: string;
  environmental_factors: readonly string[];
  recommendation_summary: string;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  advisory_only: true;
  observational_only: true;
  mutates_production_risk_models: false;
  changes_escalation_thresholds: false;
  changes_rollback_thresholds: false;
  changes_governance_policy: false;
  overrides_governance_decisions: false;
  overrides_operator_authority: false;
  rewrites_historical_evidence: false;
  rewrites_mission_history: false;
  suppresses_constitutional_risk: false;
}>;

export type RiskPatternConfidence = Readonly<{
  confidence_id: string;
  risk_pattern_id: string;
  confidence_score: number;
  confidence_band: RiskPatternConfidenceBand;
  frequency_score: number;
  evidence_completeness_score: number;
  consistency_score: number;
  reproducibility_score: number;
  cross_mission_confirmation_score: number;
  data_sufficiency_score: number;
  confidence_explanation: string;
  integrity_hash: string;
}>;

export type RiskPatternTimeline = Readonly<{
  timeline_id: string;
  risk_pattern_id: string;
  first_occurrence: string;
  pattern_growth: readonly number[];
  stable_periods: readonly string[];
  frequency_changes: readonly string[];
  significant_events: readonly string[];
  governance_interventions: readonly string[];
  historical_milestones: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskPatternRecommendation = Readonly<{
  recommendation_id: string;
  risk_pattern_id: string;
  category: RiskPatternRecommendationCategory;
  recommendation_summary: string;
  governance_review_required: boolean;
  simulation_required: boolean;
  operator_review_required: boolean;
  expected_benefit: number;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskPatternEvidenceRegistry = Readonly<{
  evidence_registry_id: string;
  risk_pattern_id: string;
  historical_assessment_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  drift_refs: readonly string[];
  recalibration_refs: readonly string[];
  governance_decision_refs: readonly string[];
  escalation_history_refs: readonly string[];
  rollback_history_refs: readonly string[];
  operational_telemetry_refs: readonly string[];
  supporting_document_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type RiskPatternLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  pattern_refs: readonly string[];
  confidence_refs: readonly string[];
  timeline_refs: readonly string[];
  recommendation_refs: readonly string[];
  evidence_registry_refs: readonly string[];
  category_index: Readonly<Record<RiskPatternCategory, readonly string[]>>;
  recommendation_index: Readonly<Record<RiskPatternRecommendationCategory, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type RiskPatternValidation = Readonly<{
  validation_id: string;
  state: RiskPatternValidationState;
  certified: boolean;
  failures: readonly RiskPatternFailure[];
  multiple_observations_complete: boolean;
  evidence_complete: boolean;
  deterministic_classification_complete: boolean;
  confidence_evaluation_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  constitutional_complete: boolean;
  lineage_complete: boolean;
  history_timeline_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  advisory_only: boolean;
  observational_only: boolean;
  no_production_risk_model_mutation: boolean;
  no_threshold_mutation: boolean;
  no_governance_policy_mutation: boolean;
  no_governance_decision_override: boolean;
  no_operator_override: boolean;
  no_historical_evidence_rewrite: boolean;
  no_mission_history_rewrite: boolean;
  no_constitutional_suppression: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RiskPatternApiSurface = Readonly<{
  api_id: string;
  analyze_patterns: "POST /risk-pattern-intelligence/analyze";
  retrieve_patterns: "POST /risk-pattern-intelligence/patterns";
  retrieve_classifications: "POST /risk-pattern-intelligence/classifications";
  retrieve_confidence: "POST /risk-pattern-intelligence/confidence";
  retrieve_timeline: "POST /risk-pattern-intelligence/timeline";
  retrieve_recommendations: "POST /risk-pattern-intelligence/recommendations";
  retrieve_evidence: "POST /risk-pattern-intelligence/evidence";
  retrieve_ledger: "POST /risk-pattern-intelligence/ledger";
  retrieve_governance: "POST /risk-pattern-intelligence/governance";
  retrieve_validation: "POST /risk-pattern-intelligence/validation";
  replay_analysis: "POST /risk-pattern-intelligence/replay";
  retrieve_contract: "GET /risk-pattern-intelligence/contract";
  update_supported: false;
  delete_supported: false;
  production_risk_mutation_supported: false;
  threshold_mutation_supported: false;
  governance_policy_mutation_supported: false;
  governance_decision_override_supported: false;
  operator_override_supported: false;
  integrity_hash: string;
}>;

export type RiskPatternInput = Readonly<{
  scenario?: RiskPatternScenario;
  drift_result?: RiskDriftResult;
  recalibration_result?: RiskSeverityRecalibrationResult;
}>;

export type RiskPatternResult = Readonly<{
  risk_pattern_intelligence_version: "risk-pattern-intelligence/v1";
  api_surface: RiskPatternApiSurface;
  patterns: readonly RiskPatternRecord[];
  confidence: RiskPatternConfidence;
  timeline: RiskPatternTimeline;
  recommendations: readonly RiskPatternRecommendation[];
  evidence_registry: RiskPatternEvidenceRegistry;
  ledger: RiskPatternLedger;
  validation: RiskPatternValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  observational_only: true;
  mutates_production_risk_models: false;
  changes_escalation_thresholds: false;
  changes_rollback_thresholds: false;
  changes_governance_policy: false;
  changes_constitutional_safeguards: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskPatternFoundation = Readonly<{
  risk_pattern_intelligence_version: "risk-pattern-intelligence/v1";
  api_surface: RiskPatternApiSurface;
  result: RiskPatternResult;
}>;
