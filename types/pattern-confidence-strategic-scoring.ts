import type { PatternValidationEvidenceResult, PatternValidationRecord } from "@/types/pattern-validation-evidence-engine";

export type PatternScoreRating = "EXCEPTIONAL" | "HIGH" | "MEDIUM" | "LOW" | "WEAK" | "REJECTED";
export type PatternScoringState = "INPUT_VALIDATED" | "EVIDENCE_SCORED" | "RECURRENCE_SCORED" | "CONFIDENCE_SCORED" | "STRATEGIC_SCORED" | "COMPOSITE_SCORED" | "REGISTERED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type PatternScoringFailure =
  | "VALIDATED_PATTERN_MISSING"
  | "PATTERN_VALIDATION_REJECTED"
  | "EVIDENCE_INCOMPLETE"
  | "RECURRENCE_CALCULATION_UNAVAILABLE"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "SCORING_RULE_VERSION_UNAVAILABLE"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "EXPLANATION_MISSING"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_WEIGHTING_DETECTED"
  | "AUTONOMOUS_OPTIMIZATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternScoringScenario =
  | "BASELINE"
  | "WEAK_PATTERN"
  | "MISSING_VALIDATION"
  | "REJECTED_PATTERN"
  | "MISSING_EVIDENCE"
  | "MISSING_RECURRENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "MISSING_RULE_VERSION"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "MISSING_EXPLANATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC_WEIGHTING"
  | "AUTONOMOUS_OPTIMIZATION"
  | "FAIL_OPEN";

export type PatternScoringWeights = Readonly<{
  confidence_score: number;
  recurrence_strength: number;
  evidence_quality: number;
  governance_importance: number;
  mission_importance: number;
  strategic_importance: number;
  operator_importance: number;
  risk_relevance: number;
  total: 1;
  deterministic: true;
  integrity_hash: string;
}>;

export type PatternScoreRecord = Readonly<{
  score_id: string;
  pattern_id: string;
  tenant_id: string;
  scoring_timestamp: string;
  scoring_rule_version: "pattern-scoring-rule/v1";
  confidence_score: number;
  recurrence_strength: number;
  evidence_quality: number;
  governance_importance: number;
  mission_importance: number;
  strategic_importance: number;
  operator_importance: number;
  risk_relevance: number;
  composite_pattern_score: number;
  rating: PatternScoreRating;
  scoring_summary: string;
  explainability_refs: readonly string[];
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  advisory_only: true;
  modifies_recommendations: false;
  modifies_priorities: false;
  modifies_governance: false;
  adaptive_behavior: false;
  integrity_hash: string;
}>;

export type PatternScoringRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  score_refs: readonly string[];
  pattern_refs: readonly string[];
  rating_index: Readonly<Record<string, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternScoringValidation = Readonly<{
  validation_id: string;
  state: PatternScoringState;
  certified: boolean;
  failures: readonly PatternScoringFailure[];
  validation_input_accepted: boolean;
  evidence_complete: boolean;
  recurrence_available: boolean;
  governance_referenced: boolean;
  replay_validated: boolean;
  scoring_rules_available: boolean;
  deterministic_weighting: boolean;
  explanations_complete: boolean;
  tenant_isolated: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_autonomous_optimization: boolean;
  integrity_hash: string;
}>;

export type PatternScoringApiSurface = Readonly<{
  api_id: string;
  score_pattern: "POST /pattern-confidence-strategic-scoring/score";
  calculate_confidence: "POST /pattern-confidence-strategic-scoring/confidence";
  calculate_strategic: "POST /pattern-confidence-strategic-scoring/strategic";
  calculate_governance: "POST /pattern-confidence-strategic-scoring/governance";
  calculate_composite: "POST /pattern-confidence-strategic-scoring/composite";
  retrieve_registry: "POST /pattern-confidence-strategic-scoring/registry";
  replay_scoring: "POST /pattern-confidence-strategic-scoring/replay";
  retrieve_contract: "GET /pattern-confidence-strategic-scoring/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_behavior_supported: false;
  priority_mutation_supported: false;
  integrity_hash: string;
}>;

export type PatternScoringInput = Readonly<{
  validation_result?: PatternValidationEvidenceResult;
  scenario?: PatternScoringScenario;
}>;

export type PatternScoringResult = Readonly<{
  pattern_confidence_strategic_scoring_version: "pattern-confidence-strategic-scoring/v1";
  validation_result: PatternValidationEvidenceResult;
  api_surface: PatternScoringApiSurface;
  weights: PatternScoringWeights;
  score_records: readonly PatternScoreRecord[];
  registry: PatternScoringRegistry;
  validation: PatternScoringValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_first: true;
  adaptive_behavior: false;
  modifies_recommendations: false;
  modifies_priorities: false;
  modifies_governance: false;
  autonomous_optimization: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternScoringFoundation = Readonly<{
  pattern_confidence_strategic_scoring_version: "pattern-confidence-strategic-scoring/v1";
  weights: PatternScoringWeights;
  api_surface: PatternScoringApiSurface;
  result: PatternScoringResult;
}>;

export type PatternValidationRecordForScoring = PatternValidationRecord;
