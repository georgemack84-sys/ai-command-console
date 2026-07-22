import type { FeedbackNormalizationEngineResult } from "@/types/feedback-normalization-engine";

export type OverrideRootCause =
  | "INSUFFICIENT_EVIDENCE"
  | "INACCURATE_CONFIDENCE"
  | "INCORRECT_PRIORITIZATION"
  | "EXCESSIVE_CAUTION"
  | "EXCESSIVE_OPTIMISM"
  | "GOVERNANCE_DISAGREEMENT"
  | "CONTEXTUAL_KNOWLEDGE"
  | "MISSION_SPECIFIC_FACTORS";

export type OverrideContextCategory =
  | "ROUTINE_OPERATIONS"
  | "DEGRADED_OPERATIONS"
  | "EMERGENCY_RESPONSE"
  | "HIGH_RISK_MISSION"
  | "GOVERNANCE_SENSITIVE_MISSION"
  | "COMPLIANCE_SENSITIVE_MISSION"
  | "RESOURCE_CONSTRAINED_MISSION"
  | "TIME_CRITICAL_MISSION";

export type OverridePatternType =
  | "RECURRING_OVERRIDE_REASON"
  | "REPEATED_RECOMMENDATION_WEAKNESS"
  | "REPEATED_EVIDENCE_DEFICIENCY"
  | "RECURRING_CONFIDENCE_ISSUE"
  | "GOVERNANCE_RELATED_OVERRIDE"
  | "MISSION_SPECIFIC_OVERRIDE_TREND";

export type OverrideTrendDirection = "NONE" | "INCREASING" | "STABLE" | "DECREASING";
export type OverrideLearningState = "ANALYZED" | "NO_OVERRIDE_SIGNAL" | "REJECTED";

export type OverrideLearningFailure =
  | "OVERRIDE_REFERENCE_MISSING"
  | "RECOMMENDATION_UNAVAILABLE"
  | "MISSION_CONTEXT_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_METADATA_INCOMPLETE"
  | "ANALYSIS_RULE_VERSION_INVALID"
  | "NORMALIZED_FEEDBACK_REJECTED"
  | "UNSUPPORTED_FEEDBACK_TYPE"
  | "TENANT_ISOLATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT";

export type OverrideLearningScenario =
  | "BASELINE"
  | "NO_OVERRIDE"
  | "INSUFFICIENT_EVIDENCE"
  | "INACCURATE_CONFIDENCE"
  | "INCORRECT_PRIORITIZATION"
  | "EXCESSIVE_CAUTION"
  | "EXCESSIVE_OPTIMISM"
  | "GOVERNANCE_DISAGREEMENT"
  | "CONTEXTUAL_KNOWLEDGE"
  | "MISSION_SPECIFIC_FACTORS"
  | "DEGRADED_OPERATIONS"
  | "EMERGENCY_RESPONSE"
  | "HIGH_RISK_MISSION"
  | "COMPLIANCE_SENSITIVE_MISSION"
  | "RESOURCE_CONSTRAINED_MISSION"
  | "TIME_CRITICAL_MISSION"
  | "MISSING_OVERRIDE_REFERENCE"
  | "MISSING_RECOMMENDATION"
  | "MISSING_MISSION_CONTEXT"
  | "MISSING_REPLAY_LINEAGE"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE_METADATA"
  | "INVALID_RULE_VERSION"
  | "NORMALIZATION_REJECTED"
  | "CROSS_TENANT"
  | "INTEGRITY_MISMATCH"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT";

export type OverridePatternRecord = Readonly<{
  pattern_id: string;
  canonical_pattern_name: string;
  pattern_type: OverridePatternType;
  root_cause: OverrideRootCause;
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_relevance: "LOW" | "MEDIUM" | "HIGH";
  confidence_metric: number;
  affected_recommendation_categories: readonly string[];
  first_observed_timestamp: string;
  latest_observed_timestamp: string;
  integrity_hash: string;
}>;

export type OverrideFrequencyMetrics = Readonly<{
  metrics_id: string;
  override_rate: number;
  recurrence_interval_days: number;
  trend_direction: OverrideTrendDirection;
  concentration_by_mission: string;
  concentration_by_recommendation_type: string;
  operator_consistency: number;
  deterministic: true;
  tenant_isolated: true;
  integrity_hash: string;
}>;

export type OverrideContextAnalysis = Readonly<{
  context_id: string;
  context_categories: readonly OverrideContextCategory[];
  mission_objectives: readonly string[];
  mission_phase: string;
  operational_constraints: readonly string[];
  governance_context: string;
  constitutional_requirements: readonly string[];
  operator_expertise: string;
  recommendation_timing: string;
  deterministic_evidence: string;
  integrity_hash: string;
}>;

export type OverrideImprovementEvidence = Readonly<{
  evidence_id: string;
  observed_override_ref: string;
  identified_root_cause: OverrideRootCause;
  supporting_evidence_refs: readonly string[];
  confidence_assessment: string;
  governance_impact: string;
  contextual_factors: readonly OverrideContextCategory[];
  mission_outcome: string;
  replay_refs: readonly string[];
  may_increase_adaptation_priority: boolean;
  supports_simulation: boolean;
  supports_future_analysis: boolean;
  supports_governance_review: boolean;
  modifies_production_recommendations: false;
  changes_confidence_automatically: false;
  alters_operational_policies: false;
  creates_adaptive_proposals: false;
  integrity_hash: string;
}>;

export type OverrideLearningExplanation = Readonly<{
  explanation_id: string;
  why_override_occurred: string;
  root_cause_rationale: string;
  supporting_evidence: readonly string[];
  confidence_assessment: string;
  contextual_influences: readonly OverrideContextCategory[];
  governance_considerations: string;
  mission_outcome: string;
  generated_improvement_evidence_ref: string;
  traceable: true;
  integrity_hash: string;
}>;

export type OverrideLearningAuditEvent = Readonly<{
  audit_event_id: string;
  event_type: "OVERRIDE_REFERENCE" | "ROOT_CAUSE" | "PATTERN_DETECTION" | "FREQUENCY_ANALYSIS" | "CONTEXT_ANALYSIS" | "IMPROVEMENT_EVIDENCE" | "REGISTRY_APPEND" | "REJECTION";
  outcome: string;
  recorded_at: string;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type OverrideLearningApiSurface = Readonly<{
  api_id: string;
  analyze_override_learning: "POST /override-learning-analyzer/analyze";
  retrieve_patterns: "POST /override-learning-analyzer/patterns";
  retrieve_root_cause: "POST /override-learning-analyzer/root-cause";
  retrieve_frequency: "POST /override-learning-analyzer/frequency";
  retrieve_context: "POST /override-learning-analyzer/context";
  retrieve_improvement_evidence: "POST /override-learning-analyzer/evidence";
  retrieve_registry: "POST /override-learning-analyzer/registry";
  retrieve_audit: "POST /override-learning-analyzer/audit";
  replay_analysis: "POST /override-learning-analyzer/replay";
  retrieve_contract: "GET /override-learning-analyzer/contract";
  modifies_recommendations_supported: false;
  confidence_mutation_supported: false;
  model_retraining_supported: false;
  adaptive_proposal_generation_supported: false;
  governance_override_supported: false;
  production_mutation_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type OverrideLearningAnalyzerInput = Readonly<{
  scenario?: OverrideLearningScenario;
  normalization_result?: FeedbackNormalizationEngineResult;
}>;

export type OverrideLearningAnalyzerResult = Readonly<{
  override_learning_analyzer_version: "override-learning-analyzer/v1";
  analysis_rule_version: "override-learning-rules/v1";
  api_surface: OverrideLearningApiSurface;
  normalization_result: FeedbackNormalizationEngineResult;
  pattern_record: OverridePatternRecord | null;
  root_cause: OverrideRootCause | null;
  contributing_factors: readonly OverrideRootCause[];
  root_cause_confidence: number;
  frequency_metrics: OverrideFrequencyMetrics | null;
  context_analysis: OverrideContextAnalysis | null;
  improvement_evidence: OverrideImprovementEvidence | null;
  explanation: OverrideLearningExplanation;
  registry: readonly OverridePatternRecord[];
  audit_events: readonly OverrideLearningAuditEvent[];
  analysis_state: OverrideLearningState;
  failures: readonly OverrideLearningFailure[];
  replay_hash: string;
  integrity_hash: string;
  deterministic: true;
  replayable: boolean;
  explainable: true;
  tenant_isolated: boolean;
  evidence_lineage_complete: boolean;
  replay_lineage_complete: boolean;
  evidence_only: true;
  immutable_registry: true;
  append_only_audit: true;
  modifies_recommendations: false;
  modifies_confidence: false;
  retrains_models: false;
  creates_adaptive_proposals: false;
  changes_production_behavior: false;
}>;

export type OverrideLearningAnalyzerFoundation = Readonly<{
  override_learning_analyzer_version: "override-learning-analyzer/v1";
  api_surface: OverrideLearningApiSurface;
  result: OverrideLearningAnalyzerResult;
}>;
