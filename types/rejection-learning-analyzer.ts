import type { FeedbackNormalizationEngineResult } from "@/types/feedback-normalization-engine";

export type RejectionLearningCategory =
  | "EVIDENCE_INSUFFICIENT"
  | "RECOMMENDATION_INCORRECT"
  | "CONFIDENCE_MISMATCH"
  | "GOVERNANCE_ISSUE"
  | "TIMING_ISSUE"
  | "INCOMPLETE_CONTEXT"
  | "OPERATOR_EXPERTISE"
  | "SIMULATION_DISAGREEMENT";

export type RejectionFailureDimension =
  | "FACTUAL_ACCURACY"
  | "EVIDENCE_SUFFICIENCY"
  | "RECOMMENDATION_CLARITY"
  | "TIMING_APPROPRIATENESS"
  | "CONFIDENCE_CALIBRATION"
  | "CONTEXTUAL_AWARENESS"
  | "GOVERNANCE_COMPLIANCE"
  | "MISSION_ALIGNMENT";

export type RejectionGapCategory =
  | "EVIDENCE_ACQUISITION_GAP"
  | "REASONING_GAP"
  | "CONTEXT_AWARENESS_GAP"
  | "CONFIDENCE_CALIBRATION_GAP"
  | "GOVERNANCE_VALIDATION_GAP"
  | "SIMULATION_COVERAGE_GAP"
  | "PRIORITIZATION_GAP"
  | "EXPLAINABILITY_GAP"
  | "RECOMMENDATION_COMPLETENESS_GAP"
  | "MISSION_AWARENESS_GAP";

export type RejectionLearningState = "ANALYZED" | "NO_REJECTION_SIGNAL" | "REJECTED";
export type RejectionGapSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RejectionLearningFailure =
  | "REJECTION_REFERENCE_MISSING"
  | "RECOMMENDATION_UNAVAILABLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "EVIDENCE_UNAVAILABLE"
  | "MISSION_OUTCOME_UNAVAILABLE"
  | "GOVERNANCE_METADATA_INCOMPLETE"
  | "ANALYSIS_RULE_VERSION_INVALID"
  | "NORMALIZED_FEEDBACK_REJECTED"
  | "UNSUPPORTED_FEEDBACK_TYPE"
  | "TENANT_ISOLATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT";

export type RejectionLearningScenario =
  | "BASELINE"
  | "NO_REJECTION"
  | "EVIDENCE_INSUFFICIENT"
  | "RECOMMENDATION_INCORRECT"
  | "CONFIDENCE_MISMATCH"
  | "GOVERNANCE_ISSUE"
  | "TIMING_ISSUE"
  | "INCOMPLETE_CONTEXT"
  | "OPERATOR_EXPERTISE"
  | "SIMULATION_DISAGREEMENT"
  | "MISSION_OUTCOME_GAP"
  | "DOWNSTREAM_OUTCOME_GAP"
  | "MISSING_REJECTION_REFERENCE"
  | "MISSING_RECOMMENDATION"
  | "MISSING_REPLAY_LINEAGE"
  | "MISSING_EVIDENCE"
  | "MISSING_MISSION_OUTCOME"
  | "MISSING_GOVERNANCE_METADATA"
  | "INVALID_RULE_VERSION"
  | "NORMALIZATION_REJECTED"
  | "CROSS_TENANT"
  | "INTEGRITY_MISMATCH"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT";

export type RejectionGapRecord = Readonly<{
  gap_id: string;
  category: RejectionGapCategory;
  severity: RejectionGapSeverity;
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  affected_recommendation_category: string;
  improvement_priority: number;
  integrity_hash: string;
}>;

export type RejectionPatternRegistryRecord = Readonly<{
  pattern_id: string;
  canonical_rejection_category: RejectionLearningCategory;
  failure_classification: RejectionFailureDimension;
  recurrence_frequency: number;
  affected_recommendation_categories: readonly string[];
  supporting_evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_relevance: "LOW" | "MEDIUM" | "HIGH";
  improvement_opportunities: readonly string[];
  first_observed_timestamp: string;
  latest_observed_timestamp: string;
  integrity_hash: string;
}>;

export type RejectionImprovementOpportunity = Readonly<{
  opportunity_id: string;
  opportunity_type: "ADDITIONAL_EVIDENCE_COLLECTION" | "STRONGER_EXPLANATIONS" | "IMPROVED_CONFIDENCE_CALIBRATION" | "ENHANCED_CONTEXTUAL_REASONING" | "BETTER_GOVERNANCE_VALIDATION" | "EXPANDED_SIMULATION_COVERAGE" | "PRIORITIZATION_REFINEMENT" | "MISSION_SPECIFIC_GUIDANCE";
  description: string;
  source_gap_refs: readonly string[];
  may_increase_adaptation_priority: boolean;
  may_trigger_simulation: boolean;
  supports_governance_review: boolean;
  becomes_adaptive_evidence: boolean;
  changes_production_recommendations: false;
  modifies_recommendation_logic: false;
  alters_governance: false;
  retrains_models: false;
  bypasses_approval_workflows: false;
  integrity_hash: string;
}>;

export type RejectionImprovementEvidence = Readonly<{
  evidence_id: string;
  rejected_recommendation_ref: string;
  rejection_classification: RejectionLearningCategory;
  root_cause: RejectionFailureDimension;
  identified_gap_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  mission_outcome: string;
  downstream_outcome: string;
  replay_refs: readonly string[];
  governance_relevance: "LOW" | "MEDIUM" | "HIGH";
  confidence_assessment: string;
  advisory_only: true;
  deterministic: true;
  replayable: true;
  explainable: true;
  immutable: true;
  governance_compliant: boolean;
  integrity_hash: string;
}>;

export type RejectionLearningExplanation = Readonly<{
  explanation_id: string;
  why_recommendation_was_rejected: string;
  rejection_classification: string;
  supporting_evidence: readonly string[];
  identified_gaps: readonly RejectionGapCategory[];
  improvement_opportunities: readonly string[];
  mission_outcome: string;
  downstream_outcome: string;
  governance_considerations: string;
  replay_lineage: readonly string[];
  traceable: true;
  integrity_hash: string;
}>;

export type RejectionLearningAuditEvent = Readonly<{
  audit_event_id: string;
  event_type: "REJECTION_REFERENCE" | "CLASSIFICATION" | "FAILURE_ANALYSIS" | "GAP_ANALYSIS" | "OPPORTUNITY_DETECTION" | "IMPROVEMENT_EVIDENCE" | "REGISTRY_APPEND" | "REJECTION";
  outcome: string;
  recorded_at: string;
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type RejectionLearningApiSurface = Readonly<{
  api_id: string;
  analyze_rejection_learning: "POST /rejection-learning-analyzer/analyze";
  retrieve_classification: "POST /rejection-learning-analyzer/classification";
  retrieve_failure_analysis: "POST /rejection-learning-analyzer/failure";
  retrieve_gaps: "POST /rejection-learning-analyzer/gaps";
  retrieve_opportunities: "POST /rejection-learning-analyzer/opportunities";
  retrieve_improvement_evidence: "POST /rejection-learning-analyzer/evidence";
  retrieve_registry: "POST /rejection-learning-analyzer/registry";
  retrieve_audit: "POST /rejection-learning-analyzer/audit";
  replay_analysis: "POST /rejection-learning-analyzer/replay";
  retrieve_contract: "GET /rejection-learning-analyzer/contract";
  recommendation_mutation_supported: false;
  adaptive_proposal_generation_supported: false;
  model_retraining_supported: false;
  confidence_mutation_supported: false;
  governance_override_supported: false;
  production_mutation_supported: false;
  evidence_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type RejectionLearningAnalyzerInput = Readonly<{
  scenario?: RejectionLearningScenario;
  normalization_result?: FeedbackNormalizationEngineResult;
}>;

export type RejectionLearningAnalyzerResult = Readonly<{
  rejection_learning_analyzer_version: "rejection-learning-analyzer/v1";
  analysis_rule_version: "rejection-learning-rules/v1";
  api_surface: RejectionLearningApiSurface;
  normalization_result: FeedbackNormalizationEngineResult;
  primary_classification: RejectionLearningCategory | null;
  secondary_factors: readonly RejectionLearningCategory[];
  classification_confidence: number;
  failure_analysis: RejectionFailureDimension | null;
  gap_records: readonly RejectionGapRecord[];
  improvement_opportunities: readonly RejectionImprovementOpportunity[];
  improvement_evidence: RejectionImprovementEvidence | null;
  pattern_registry: readonly RejectionPatternRegistryRecord[];
  explanation: RejectionLearningExplanation;
  audit_events: readonly RejectionLearningAuditEvent[];
  analysis_state: RejectionLearningState;
  failures: readonly RejectionLearningFailure[];
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

export type RejectionLearningAnalyzerFoundation = Readonly<{
  rejection_learning_analyzer_version: "rejection-learning-analyzer/v1";
  api_surface: RejectionLearningApiSurface;
  result: RejectionLearningAnalyzerResult;
}>;
