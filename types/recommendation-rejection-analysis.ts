import type { RecommendationQualityResult } from "@/types/recommendation-quality-scoring";

export type RejectionCategory =
  | "INSUFFICIENT_EVIDENCE"
  | "POOR_EXPLANATION"
  | "EXCESSIVE_RISK"
  | "LOW_CONFIDENCE"
  | "GOVERNANCE_CONCERN"
  | "AUTHORITY_CONFLICT"
  | "TIMING_ISSUE"
  | "INCOMPLETE_CONTEXT"
  | "OPERATOR_PREFERENCE"
  | "INCORRECT_RECOMMENDATION"
  | "MULTIPLE_FACTORS"
  | "INSUFFICIENT_INFORMATION";

export type RejectionOutcomeImpact = "IMPROVED_OUTCOME" | "EQUIVALENT_OUTCOME" | "DEGRADED_OUTCOME" | "INCREASED_RISK" | "GOVERNANCE_PRESERVED" | "MISSED_OPPORTUNITY" | "INSUFFICIENT_EVIDENCE";
export type RejectionPattern = "RECURRING_EVIDENCE_DEFICIENCY" | "REPEATED_EXPLANATION_ISSUE" | "COMMON_GOVERNANCE_CONFLICT" | "AUTHORITY_RELATED_REJECTION" | "TIMING_RELATED_REJECTION" | "MISSION_SPECIFIC_REJECTION" | "MULTI_FACTOR_REJECTION" | "INSUFFICIENT_EVIDENCE_PATTERN";
export type RejectionAnalysisState = "REJECTION_RECORDED" | "CONTEXT_COLLECTED" | "FAILURE_CLASSIFIED" | "OUTCOME_EVALUATED" | "PATTERNS_IDENTIFIED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type RejectionAnalysisFailure =
  | "REJECTION_REASON_UNAVAILABLE"
  | "OBSERVED_OUTCOMES_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "OPERATOR_REJECTION_UNVERIFIABLE"
  | "OUTCOME_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type RejectionAnalysisScenario =
  | "BASELINE"
  | "INSUFFICIENT_EVIDENCE"
  | "POOR_EXPLANATION"
  | "EXCESSIVE_RISK"
  | "LOW_CONFIDENCE"
  | "GOVERNANCE_CONCERN"
  | "AUTHORITY_CONFLICT"
  | "TIMING_ISSUE"
  | "INCOMPLETE_CONTEXT"
  | "OPERATOR_PREFERENCE"
  | "INCORRECT_RECOMMENDATION"
  | "MULTIPLE_FACTORS"
  | "INSUFFICIENT_INFORMATION"
  | "IMPROVED_OUTCOME"
  | "DEGRADED_OUTCOME"
  | "MISSING_REASON"
  | "MISSING_OUTCOME"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "OPERATOR_REJECTION_UNVERIFIABLE"
  | "OUTCOME_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type RecommendationRejectionRecord = Readonly<{
  rejection_analysis_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  rejection_state: string;
  operator_action: string;
  rejection_reason: string;
  rejection_categories: readonly RejectionCategory[];
  primary_rejection_category: RejectionCategory;
  context_assessment: string;
  outcome_after_rejection: RejectionOutcomeImpact;
  mission_impact_score: number;
  governance_impact_score: number;
  recommendation_quality_assessment: string;
  rejection_effectiveness_score: number;
  pattern_refs: readonly string[];
  explanation: string;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  advisory_only: true;
  infers_operator_intent: false;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type RejectionPatternRecord = Readonly<{
  pattern_id: string;
  tenant_id: string;
  pattern: RejectionPattern;
  categories: readonly RejectionCategory[];
  descriptive_only: true;
  modifies_future_recommendations: false;
  supporting_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RejectionAnalysisValidation = Readonly<{
  validation_id: string;
  state: RejectionAnalysisState;
  certified: boolean;
  failures: readonly RejectionAnalysisFailure[];
  rejection_recorded: boolean;
  context_collected: boolean;
  failure_classified: boolean;
  outcome_evaluated: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  evidence_complete: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RejectionAnalysisLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  rejection_analysis_id: string;
  recommendation_ref: string;
  decision_ref: string;
  operator_rejection_ref: string;
  observed_outcome_refs: readonly string[];
  pattern_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type RejectionAnalysisApiSurface = Readonly<{
  api_id: string;
  analyze_rejection: "POST /recommendation-rejection-analysis/analyze";
  classify_failure: "POST /recommendation-rejection-analysis/classify";
  assess_context: "POST /recommendation-rejection-analysis/context";
  evaluate_outcome_impact: "POST /recommendation-rejection-analysis/outcome-impact";
  validate_analysis: "POST /recommendation-rejection-analysis/validate";
  replay_analysis: "POST /recommendation-rejection-analysis/replay";
  retrieve_contract: "GET /recommendation-rejection-analysis/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type RejectionAnalysisInput = Readonly<{
  quality?: RecommendationQualityResult;
  scenario?: RejectionAnalysisScenario;
}>;

export type RejectionAnalysisResult = Readonly<{
  recommendation_rejection_analysis_version: "recommendation-rejection-analysis/v1";
  quality: RecommendationQualityResult;
  api_surface: RejectionAnalysisApiSurface;
  rejection_record: RecommendationRejectionRecord;
  pattern_record: RejectionPatternRecord;
  validation: RejectionAnalysisValidation;
  ledger_record: RejectionAnalysisLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  rejection_signal_only: true;
  infers_operator_intent: false;
  adaptive_learning: false;
  modifies_recommendations: false;
  modifies_operator_actions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RejectionAnalysisFoundation = Readonly<{
  recommendation_rejection_analysis_version: "recommendation-rejection-analysis/v1";
  categories: readonly RejectionCategory[];
  api_surface: RejectionAnalysisApiSurface;
  result: RejectionAnalysisResult;
}>;
