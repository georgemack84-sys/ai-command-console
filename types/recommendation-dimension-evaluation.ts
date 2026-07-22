import type { OverrideAnalysisResult } from "@/types/override-analysis-engine";

export type RecommendationDimension = "EVIDENCE" | "RISK" | "CONFIDENCE" | "GOVERNANCE" | "EXPLAINABILITY" | "ALTERNATIVES" | "ROLLBACK";
export type DimensionRating = "EXCEPTIONAL" | "HIGH" | "GOOD" | "ADEQUATE" | "LIMITED" | "POOR" | "UNACCEPTABLE";
export type DimensionEvaluationState = "DIMENSION_SELECTION" | "DIMENSION_SCORING" | "DIMENSION_VALIDATION" | "IMPROVEMENTS_IDENTIFIED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type DimensionEvaluationFailure =
  | "RECOMMENDATION_UNAVAILABLE"
  | "DIMENSION_EVALUATION_INCOMPLETE"
  | "MANDATORY_EVIDENCE_MISSING"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "EVIDENCE_INTEGRITY_FAILED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type DimensionEvaluationScenario =
  | "BASELINE"
  | "EXCEPTIONAL"
  | "HIGH"
  | "GOOD"
  | "ADEQUATE"
  | "LIMITED"
  | "POOR"
  | "UNACCEPTABLE"
  | "WEAK_EVIDENCE_ONLY"
  | "WEAK_RISK_ONLY"
  | "WEAK_CONFIDENCE_ONLY"
  | "WEAK_GOVERNANCE_ONLY"
  | "WEAK_EXPLAINABILITY_ONLY"
  | "WEAK_ALTERNATIVES_ONLY"
  | "WEAK_ROLLBACK_ONLY"
  | "MISSING_RECOMMENDATION"
  | "INCOMPLETE_DIMENSIONS"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type DimensionScoreRecord = Readonly<{
  dimension_score_id: string;
  dimension: RecommendationDimension;
  score: number;
  rating: DimensionRating;
  findings: readonly string[];
  strengths: readonly string[];
  weaknesses: readonly string[];
  improvement_opportunities: readonly string[];
  explanation: string;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  independent: true;
  integrity_hash: string;
}>;

export type RecommendationDimensionEvaluationRecord = Readonly<{
  dimension_evaluation_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  evidence_score: number;
  risk_score: number;
  confidence_score: number;
  governance_score: number;
  explainability_score: number;
  alternatives_score: number;
  rollback_score: number;
  evidence_findings: readonly string[];
  risk_findings: readonly string[];
  confidence_findings: readonly string[];
  governance_findings: readonly string[];
  explainability_findings: readonly string[];
  alternatives_findings: readonly string[];
  rollback_findings: readonly string[];
  dimension_scores: readonly DimensionScoreRecord[];
  improvement_opportunities: readonly string[];
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  advisory_only: true;
  diagnostic_only: true;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type DimensionEvaluationValidation = Readonly<{
  validation_id: string;
  state: DimensionEvaluationState;
  certified: boolean;
  failures: readonly DimensionEvaluationFailure[];
  dimensions_complete: boolean;
  dimensions_independent: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  evidence_complete: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type DimensionEvaluationLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  dimension_evaluation_id: string;
  dimension_score_refs: readonly string[];
  recommendation_ref: string;
  decision_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type DimensionEvaluationApiSurface = Readonly<{
  api_id: string;
  evaluate_dimensions: "POST /recommendation-dimension-evaluation/evaluate";
  evaluate_evidence: "POST /recommendation-dimension-evaluation/evidence";
  evaluate_risk: "POST /recommendation-dimension-evaluation/risk";
  evaluate_confidence: "POST /recommendation-dimension-evaluation/confidence";
  evaluate_governance: "POST /recommendation-dimension-evaluation/governance";
  evaluate_explainability: "POST /recommendation-dimension-evaluation/explainability";
  evaluate_alternatives: "POST /recommendation-dimension-evaluation/alternatives";
  evaluate_rollback: "POST /recommendation-dimension-evaluation/rollback";
  validate_evaluation: "POST /recommendation-dimension-evaluation/validate";
  replay_evaluation: "POST /recommendation-dimension-evaluation/replay";
  retrieve_contract: "GET /recommendation-dimension-evaluation/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type DimensionEvaluationInput = Readonly<{
  override?: OverrideAnalysisResult;
  scenario?: DimensionEvaluationScenario;
}>;

export type DimensionEvaluationResult = Readonly<{
  recommendation_dimension_evaluation_version: "recommendation-dimension-evaluation/v1";
  override: OverrideAnalysisResult;
  api_surface: DimensionEvaluationApiSurface;
  evaluation_record: RecommendationDimensionEvaluationRecord;
  validation: DimensionEvaluationValidation;
  ledger_record: DimensionEvaluationLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  diagnostic_only: true;
  dimensions_independent: true;
  adaptive_learning: false;
  modifies_recommendations: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DimensionEvaluationFoundation = Readonly<{
  recommendation_dimension_evaluation_version: "recommendation-dimension-evaluation/v1";
  dimensions: readonly RecommendationDimension[];
  api_surface: DimensionEvaluationApiSurface;
  result: DimensionEvaluationResult;
}>;
