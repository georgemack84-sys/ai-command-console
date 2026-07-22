import type { RecommendationQualityResult } from "@/types/recommendation-quality-scoring";

export type AcceptanceClassification =
  | "SUCCESSFUL_ACCEPTANCE"
  | "PARTIALLY_SUCCESSFUL_ACCEPTANCE"
  | "NEUTRAL_ACCEPTANCE"
  | "INEFFECTIVE_ACCEPTANCE"
  | "HARMFUL_ACCEPTANCE"
  | "PREMATURE_ACCEPTANCE"
  | "GOVERNANCE_RESTRICTED_ACCEPTANCE"
  | "INSUFFICIENT_EVIDENCE";

export type ImplementationStatus = "IMPLEMENTED_AS_PROPOSED" | "PARTIALLY_IMPLEMENTED" | "MODIFIED_BEFORE_EXECUTION" | "NOT_IMPLEMENTED" | "UNKNOWN";
export type OutcomeCorrelation = "POSITIVE_CORRELATION" | "PARTIAL_CORRELATION" | "NEUTRAL_CORRELATION" | "NEGATIVE_CORRELATION" | "HARMFUL_CORRELATION" | "INSUFFICIENT_EVIDENCE";
export type AcceptancePattern = "CONSISTENT_ACCEPTANCE" | "MODIFIED_ACCEPTANCE" | "QUALITY_ALIGNED_ACCEPTANCE" | "GOVERNANCE_DEPENDENT_ACCEPTANCE" | "PREMATURE_ACCEPTANCE_PATTERN" | "INSUFFICIENT_EVIDENCE_PATTERN";
export type AcceptanceAnalysisState = "ACCEPTANCE_RECORDED" | "IMPLEMENTATION_VERIFIED" | "OUTCOME_OBSERVED" | "ACCEPTANCE_CLASSIFIED" | "OUTCOME_CORRELATED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type AcceptanceAnalysisFailure =
  | "OPERATOR_ACCEPTANCE_UNAVAILABLE"
  | "OBSERVED_OUTCOMES_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "OPERATOR_ACTION_UNVERIFIABLE"
  | "OUTCOME_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type AcceptanceAnalysisScenario =
  | "BASELINE"
  | "SUCCESSFUL"
  | "PARTIAL"
  | "NEUTRAL"
  | "INEFFECTIVE"
  | "HARMFUL"
  | "PREMATURE"
  | "GOVERNANCE_RESTRICTED"
  | "INSUFFICIENT_EVIDENCE"
  | "MISSING_ACCEPTANCE"
  | "MISSING_OUTCOME"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "OPERATOR_ACTION_UNVERIFIABLE"
  | "OUTCOME_EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type RecommendationAcceptanceRecord = Readonly<{
  acceptance_analysis_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  acceptance_state: string;
  operator_action: string;
  implementation_status: ImplementationStatus;
  expected_outcome_refs: readonly string[];
  observed_outcome_refs: readonly string[];
  mission_improvement_score: number;
  workflow_efficiency_score: number;
  operator_confidence_score: number;
  governance_preservation_score: number;
  acceptance_effectiveness_score: number;
  acceptance_classification: AcceptanceClassification;
  outcome_correlation: OutcomeCorrelation;
  acceptance_pattern: AcceptancePattern;
  trend_refs: readonly string[];
  explanation: string;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  advisory_only: true;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type AcceptanceTrendRecord = Readonly<{
  trend_id: string;
  tenant_id: string;
  pattern: AcceptancePattern;
  trend_category: string;
  descriptive_only: true;
  modifies_future_recommendations: false;
  supporting_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type AcceptanceAnalysisValidation = Readonly<{
  validation_id: string;
  state: AcceptanceAnalysisState;
  certified: boolean;
  failures: readonly AcceptanceAnalysisFailure[];
  acceptance_recorded: boolean;
  implementation_verified: boolean;
  outcome_observed: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  evidence_complete: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type AcceptanceAnalysisLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  acceptance_analysis_id: string;
  recommendation_ref: string;
  decision_ref: string;
  operator_action_ref: string;
  observed_outcome_refs: readonly string[];
  trend_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type AcceptanceAnalysisApiSurface = Readonly<{
  api_id: string;
  analyze_acceptance: "POST /recommendation-acceptance-analysis/analyze";
  classify_acceptance: "POST /recommendation-acceptance-analysis/classify";
  correlate_outcome: "POST /recommendation-acceptance-analysis/correlate";
  validate_analysis: "POST /recommendation-acceptance-analysis/validate";
  replay_analysis: "POST /recommendation-acceptance-analysis/replay";
  retrieve_contract: "GET /recommendation-acceptance-analysis/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type AcceptanceAnalysisInput = Readonly<{
  quality?: RecommendationQualityResult;
  scenario?: AcceptanceAnalysisScenario;
}>;

export type AcceptanceAnalysisResult = Readonly<{
  recommendation_acceptance_analysis_version: "recommendation-acceptance-analysis/v1";
  quality: RecommendationQualityResult;
  api_surface: AcceptanceAnalysisApiSurface;
  acceptance_record: RecommendationAcceptanceRecord;
  trend_record: AcceptanceTrendRecord;
  validation: AcceptanceAnalysisValidation;
  ledger_record: AcceptanceAnalysisLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  acceptance_signal_only: true;
  infers_operator_intent: false;
  adaptive_learning: false;
  modifies_recommendations: false;
  modifies_operator_actions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AcceptanceAnalysisFoundation = Readonly<{
  recommendation_acceptance_analysis_version: "recommendation-acceptance-analysis/v1";
  classifications: readonly AcceptanceClassification[];
  api_surface: AcceptanceAnalysisApiSurface;
  result: AcceptanceAnalysisResult;
}>;
