import type { ComparatorResult } from "@/types/expected-vs-actual-comparator";

export type RecommendationQualityDimension =
  | "USEFULNESS"
  | "COMPLETENESS"
  | "CORRECTNESS"
  | "EXPLAINABILITY"
  | "EVIDENCE_QUALITY"
  | "CONFIDENCE_QUALITY"
  | "GOVERNANCE_COMPLIANCE"
  | "AUTHORITY_CORRECTNESS"
  | "ALTERNATIVE_USEFULNESS"
  | "ROLLBACK_USEFULNESS"
  | "OPERATOR_USABILITY";

export type RecommendationQualityRating = "EXCEPTIONAL" | "HIGH" | "GOOD" | "ACCEPTABLE" | "MARGINAL" | "POOR" | "UNACCEPTABLE";
export type QualityScoringState = "INPUTS_VALIDATED" | "DIMENSIONS_SCORED" | "WEIGHTS_APPLIED" | "COMPOSITE_CALCULATED" | "QUALITY_CLASSIFIED" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type RecommendationQualityFailure =
  | "MANDATORY_DIMENSIONS_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "WEIGHTING_PROFILE_INVALID"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "INTEGRITY_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "EVIDENCE_VERIFICATION_FAILED"
  | "COMPOSITE_SCORE_NOT_REPRODUCIBLE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION_DETECTED"
  | "EXPLANATION_MISSING"
  | "FAIL_OPEN_BEHAVIOR";

export type RecommendationQualityScenario =
  | "BASELINE"
  | "EXCEPTIONAL"
  | "HIGH"
  | "GOOD"
  | "ACCEPTABLE"
  | "MARGINAL"
  | "POOR"
  | "UNACCEPTABLE"
  | "MISSING_DIMENSION"
  | "INCOMPLETE_EVIDENCE"
  | "INVALID_WEIGHTING"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "INCOMPLETE_LINEAGE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "RECONSTRUCTION_FAILURE"
  | "EVIDENCE_VERIFICATION_FAILURE"
  | "COMPOSITE_MISMATCH"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "MISSING_EXPLANATION"
  | "FAIL_OPEN";

export type WeightingProfile = Readonly<{
  profile_id: string;
  profile_version: "10.3.3";
  governance_approved: boolean;
  immutable: true;
  weights: Readonly<Record<RecommendationQualityDimension, number>>;
  weight_total: number;
  integrity_hash: string;
}>;

export type RecommendationDimensionScore = Readonly<{
  dimension: RecommendationQualityDimension;
  raw_score: number;
  weight: number;
  weighted_score: number;
  explanation: string;
  supporting_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationQualityScore = Readonly<{
  quality_score_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  usefulness_score: number;
  completeness_score: number;
  correctness_score: number;
  explainability_score: number;
  evidence_quality_score: number;
  confidence_quality_score: number;
  governance_compliance_score: number;
  authority_correctness_score: number;
  alternative_usefulness_score: number;
  rollback_usefulness_score: number;
  operator_usability_score: number;
  dimension_scores: readonly RecommendationDimensionScore[];
  composite_effectiveness_score: number;
  quality_rating: RecommendationQualityRating;
  weighting_profile: WeightingProfile;
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

export type RecommendationQualityValidation = Readonly<{
  validation_id: string;
  state: QualityScoringState;
  certified: boolean;
  failures: readonly RecommendationQualityFailure[];
  dimensions_complete: boolean;
  weighting_valid: boolean;
  composite_reproducible: boolean;
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  explanations_complete: boolean;
  evidence_complete: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RecommendationQualityLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  quality_score_id: string;
  recommendation_ref: string;
  decision_ref: string;
  outcome_refs: readonly string[];
  comparator_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type RecommendationQualityApiSurface = Readonly<{
  api_id: string;
  score_recommendation: "POST /recommendation-quality-scoring/score";
  validate_scoring: "POST /recommendation-quality-scoring/validate";
  replay_scoring: "POST /recommendation-quality-scoring/replay";
  calculate_performance: "POST /recommendation-quality-scoring/performance";
  retrieve_contract: "GET /recommendation-quality-scoring/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type RecommendationQualityInput = Readonly<{
  comparator?: ComparatorResult;
  scenario?: RecommendationQualityScenario;
}>;

export type RecommendationQualityResult = Readonly<{
  recommendation_quality_scoring_version: "recommendation-quality-scoring/v1";
  comparator: ComparatorResult;
  api_surface: RecommendationQualityApiSurface;
  quality_score: RecommendationQualityScore;
  validation: RecommendationQualityValidation;
  ledger_record: RecommendationQualityLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  quality_scoring_only: true;
  adaptive_learning: false;
  modifies_recommendations: false;
  modifies_outcomes: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationQualityFoundation = Readonly<{
  recommendation_quality_scoring_version: "recommendation-quality-scoring/v1";
  mandatory_dimensions: readonly RecommendationQualityDimension[];
  weighting_profile: WeightingProfile;
  api_surface: RecommendationQualityApiSurface;
  result: RecommendationQualityResult;
}>;
