import type { OutcomeReplayBinderResult } from "@/types/outcome-replay-binder";

export type RecommendationAcceptanceState = "ACCEPTED" | "REJECTED" | "OVERRIDDEN" | "DEFERRED";
export type RecommendationEffectivenessStatus = "DEFINED" | "INPUT_VALIDATED" | "EVALUATION_READY" | "SCORING_COMPLETE" | "GOVERNANCE_VALIDATED" | "REPLAY_VALIDATED" | "LEDGER_RECORDED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type RecommendationEffectivenessDimension =
  | "OVERALL_EFFECTIVENESS"
  | "OUTCOME_ACCURACY"
  | "RISK_ACCURACY"
  | "CONFIDENCE_ACCURACY"
  | "EVIDENCE_QUALITY"
  | "GOVERNANCE_ACCURACY"
  | "EXPLAINABILITY"
  | "OPERATOR_USABILITY"
  | "RECOMMENDATION_COMPLETENESS"
  | "ALTERNATIVE_RECOMMENDATION_QUALITY"
  | "ROLLBACK_QUALITY"
  | "DECISION_PACKAGE_CLARITY";

export type RecommendationEffectivenessFailure =
  | "OBSERVED_OUTCOME_MISSING"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_MISSING"
  | "REPLAY_INCOMPLETE"
  | "OPERATOR_ACTION_UNAVAILABLE"
  | "LINEAGE_INCOMPLETE"
  | "REQUIRED_SCORES_MISSING"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_ISOLATION_VIOLATED"
  | "RECOMMENDATION_IDENTITY_INCONSISTENT"
  | "LEDGER_MUTATION_DETECTED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "FAIL_OPEN_BEHAVIOR"
  | "HISTORICAL_RECOMMENDATION_MUTATION_ATTEMPTED"
  | "OPERATOR_ACTION_MUTATION_ATTEMPTED";

export type RecommendationEffectivenessScenario =
  | "BASELINE"
  | "MISSING_OUTCOME"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "MISSING_OPERATOR_ACTION"
  | "INCOMPLETE_LINEAGE"
  | "MISSING_SCORE"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "IDENTITY_MISMATCH"
  | "LEDGER_MUTATION"
  | "AUTHORITY_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "FAIL_OPEN"
  | "RECOMMENDATION_MUTATION"
  | "OPERATOR_ACTION_MUTATION";

export type RecommendationEffectivenessScore = Readonly<{
  dimension: RecommendationEffectivenessDimension;
  score: number;
  explanation: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecommendationEffectivenessRecord = Readonly<{
  effectiveness_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  recommendation_id: string;
  recommendation_version: string;
  decision_package_id: string;
  evaluation_timestamp: string;
  acceptance_state: RecommendationAcceptanceState;
  recommended_action: string;
  operator_action_taken: string;
  expected_outcome_refs: readonly string[];
  actual_outcome_refs: readonly string[];
  effectiveness_score: number;
  dimension_scores: readonly RecommendationEffectivenessScore[];
  confidence_accuracy_score: number;
  risk_accuracy_score: number;
  evidence_quality_score: number;
  governance_accuracy_score: number;
  operator_usability_score: number;
  failure_reasons: readonly RecommendationEffectivenessFailure[];
  improvement_opportunities: readonly string[];
  governance_validation_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  ledger_refs: readonly string[];
  evaluation_status: RecommendationEffectivenessStatus;
  advisory_only: true;
  modifies_recommendation_behavior: false;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessValidation = Readonly<{
  validation_id: string;
  lifecycle_state: RecommendationEffectivenessStatus;
  certified: boolean;
  failures: readonly RecommendationEffectivenessFailure[];
  governance_validated: boolean;
  replay_validated: boolean;
  ledger_recorded: boolean;
  replay_reconstruction_identical: boolean;
  tenant_isolated: boolean;
  all_dimensions_scored: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessLedgerRecord = Readonly<{
  ledger_record_id: string;
  tenant_id: string;
  effectiveness_id: string;
  recommendation_ref: string;
  decision_ref: string;
  outcome_ref: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  deleted: boolean;
  ledger_sequence: number;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessApiSurface = Readonly<{
  api_id: string;
  initialize_evaluation: "POST /recommendation-effectiveness-contract/evaluate";
  validate_schema: "POST /recommendation-effectiveness-contract/validate";
  validate_replay: "POST /recommendation-effectiveness-contract/replay";
  append_ledger_record: "POST /recommendation-effectiveness-contract/ledger";
  retrieve_contract: "GET /recommendation-effectiveness-contract/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessInput = Readonly<{
  replay_binder?: OutcomeReplayBinderResult;
  scenario?: RecommendationEffectivenessScenario;
  acceptance_state?: RecommendationAcceptanceState;
}>;

export type RecommendationEffectivenessResult = Readonly<{
  recommendation_effectiveness_version: "recommendation-effectiveness-contract/v1";
  replay_binder: OutcomeReplayBinderResult;
  api_surface: RecommendationEffectivenessApiSurface;
  effectiveness_record: RecommendationEffectivenessRecord;
  validation: RecommendationEffectivenessValidation;
  ledger_record: RecommendationEffectivenessLedgerRecord;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  evaluates_completed_lifecycle_only: true;
  modifies_recommendation_behavior: false;
  modifies_operator_action: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RecommendationEffectivenessFoundation = Readonly<{
  recommendation_effectiveness_version: "recommendation-effectiveness-contract/v1";
  mandatory_dimensions: readonly RecommendationEffectivenessDimension[];
  api_surface: RecommendationEffectivenessApiSurface;
  result: RecommendationEffectivenessResult;
}>;
